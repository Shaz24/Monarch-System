# -*- coding: utf-8 -*-
"""
Zen 2.0 -- Super Agent Voice Assistant for the Monarch System
TTS: ElevenLabs  |  STT: Google  |  AI: Gemini 2.0
Wake: Voice ("Zen") + Double Clap

Architecture:
  - ONE shared mic stream via listen_in_background
  - ClapDetector analyzes audio fed from background callbacks (no 2nd stream)
  - Foreground command session temporarily takes over the mic

Usage:  python zen.py
"""

import sys
import os
import io
import json
import time
import queue as _queue
import threading
import webbrowser
import subprocess
import struct
import math
import re
import traceback
from datetime import datetime

# ── Imports ───────────────────────────────────────────────────────────────────
try:
    import speech_recognition as sr
except ImportError:
    sys.exit("[ERROR] Run: pip install speechrecognition pyaudio")

try:
    from elevenlabs.client import ElevenLabs
    from elevenlabs import VoiceSettings
    import pygame
except ImportError:
    sys.exit("[ERROR] Run: pip install elevenlabs pygame")

try:
    import google.genai as genai
    from google.genai import types as genai_types
except ImportError:
    sys.exit("[ERROR] Run: pip install google-genai>=1.10.0")

try:
    import numpy as np
except ImportError:
    sys.exit("[ERROR] Run: pip install numpy")

try:
    import psutil
    _PSUTIL_OK = True
except ImportError:
    _PSUTIL_OK = False

try:
    import pyperclip
    _CLIP_OK = True
except ImportError:
    _CLIP_OK = False

try:
    import requests as _requests
    _REQUESTS_OK = True
except ImportError:
    _REQUESTS_OK = False

# ── Config ────────────────────────────────────────────────────────────────────
try:
    from config import (
        GEMINI_API_KEY, ELEVENLABS_API_KEY,
        WAKE_WORD, APP_URL,
        ELEVENLABS_VOICE_ID, ELEVENLABS_MODEL,
        ELEVENLABS_STABILITY, ELEVENLABS_SIMILARITY,
        ELEVENLABS_STYLE, ELEVENLABS_SPEAKER_BOOST,
        COMMAND_TIMEOUT, COMMAND_PHRASE_LIMIT,
        GEMINI_MODEL, GEMINI_MODEL_FALLBACKS, DEBUG, MIC_INDEX,
        CLAP_WAKE_ENABLED, CLAP_SENSITIVITY, CLAP_WINDOW_MS, CLAP_COOLDOWN_MS,
        CONVO_WINDOW_SEC, PROACTIVE_ENABLED,
        BATTERY_WARN_THRESHOLD, POMODORO_WORK_MIN,
        WEATHER_LOCATION,
    )
except ImportError:
    sys.exit("[ERROR] config.py not found. Run from inside the zen/ directory.")

_MEMORY_FILE = os.path.join(os.path.dirname(__file__), "zen_memory.json")

# ── Route map ─────────────────────────────────────────────────────────────────
ROUTES = {
    "dashboard":   "/dashboard",  "home": "/dashboard",
    "schedule":    "/schedule",   "directives": "/schedule",
    "todo":        "/todo",       "tasks": "/todo",   "quests": "/todo",
    "fitness":     "/fitness",    "workout": "/fitness", "gym": "/fitness",
    "mind":        "/mind",       "mental": "/mind",  "meditation": "/mind",
    "coding":      "/coding",     "code": "/coding",  "engineering": "/coding",
    "creator":     "/creator",    "broadcast": "/creator",
    "boss mode":   "/boss-mode",  "boss": "/boss-mode",
    "analytics":   "/analytics",  "stats": "/analytics",
    "profile":     "/profile",    "account": "/profile",
    "antigravity": "/antigravity",
}

# ── ANSI Colors ───────────────────────────────────────────────────────────────
C_GRAY    = "\033[90m"
C_RED     = "\033[91m"
C_GREEN   = "\033[92m"
C_YELLOW  = "\033[93m"
C_CYAN    = "\033[96m"
C_MAGENTA = "\033[95m"
C_BLUE    = "\033[94m"
C_RESET   = "\033[0m"
C_BOLD    = "\033[1m"


# ══════════════════════════════════════════════════════════════════════════════
#  MEMORY MANAGER
# ══════════════════════════════════════════════════════════════════════════════
class MemoryManager:
    def __init__(self):
        self.data = {
            "session_count": 0,
            "user_name": None,
            "preferences": {},
            "long_term_notes": [],
            "history_summary": "",
            "last_session": None,
        }
        self._load()

    def _load(self):
        try:
            if os.path.exists(_MEMORY_FILE):
                with open(_MEMORY_FILE, "r", encoding="utf-8") as f:
                    self.data.update(json.load(f))
        except Exception:
            pass

    def save(self):
        try:
            self.data["last_session"] = datetime.now().isoformat()
            with open(_MEMORY_FILE, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2)
        except Exception:
            pass

    def new_session(self):
        self.data["session_count"] = self.data.get("session_count", 0) + 1
        self.save()

    def set_user_name(self, name: str):
        self.data["user_name"] = name
        self.save()

    def add_note(self, note: str):
        notes = self.data.get("long_term_notes", [])
        notes.append({"note": note, "time": datetime.now().isoformat()})
        self.data["long_term_notes"] = notes[-20:]
        self.save()

    def update_summary(self, summary: str):
        self.data["history_summary"] = summary
        self.save()

    def get_context_block(self) -> str:
        blocks = []
        if self.data.get("user_name"):
            blocks.append(f"User's preferred name: {self.data['user_name']}")
        if self.data.get("session_count", 0) > 1:
            last = self.data.get("last_session", "")
            try:
                ago = datetime.now() - datetime.fromisoformat(last)
                blocks.append(f"Last session: {'earlier today' if ago.days == 0 else f'{ago.days} day(s) ago'}")
            except Exception:
                pass
        if self.data.get("history_summary"):
            blocks.append(f"Memory summary: {self.data['history_summary']}")
        if self.data.get("long_term_notes"):
            note_texts = [n["note"] for n in self.data["long_term_notes"][-3:]]
            blocks.append(f"Recent notes: {'; '.join(note_texts)}")
        return "\n".join(blocks) if blocks else ""


# ══════════════════════════════════════════════════════════════════════════════
#  CLAP DETECTOR — pure software, NO separate PyAudio stream
#  Audio is fed in from the listen_in_background callbacks.
# ══════════════════════════════════════════════════════════════════════════════
class ClapDetector:
    """
    Analyses AudioData objects for a double-clap signature.
    Each audio segment is chunked into 10-ms frames; two RMS spikes
    above CLAP_SENSITIVITY within CLAP_WINDOW_MS fire the wake event.
    """

    def __init__(self, wake_event: threading.Event, log_fn):
        self._wake   = wake_event
        self._log    = log_fn
        self._muted  = False
        # Cross-segment clap tracking (in case two claps land in different callbacks)
        self._prev_clap_time: float | None = None

    def mute(self):
        self._muted = True

    def unmute(self):
        self._muted = False

    def feed(self, audio_data):
        """Call with each AudioData from the background listener."""
        if self._muted or not CLAP_WAKE_ENABLED:
            return
        try:
            raw   = audio_data.get_raw_data(convert_rate=16000, convert_width=2)
            count = len(raw) // 2
            if count == 0:
                return

            CHUNK_SAMPLES = 160   # 10 ms at 16 kHz
            window_s      = CLAP_WINDOW_MS  / 1000.0
            cooldown_s    = CLAP_COOLDOWN_MS / 1000.0
            now           = time.time()
            seg_start     = now - count / 16000   # approx start time of this segment

            peaks = []  # seconds-since-segment-start for each spike

            for i in range(0, count, CHUNK_SAMPLES):
                end     = min(i + CHUNK_SAMPLES, count)
                n       = end - i
                segment = raw[i * 2 : end * 2]
                if len(segment) < 2:
                    continue
                shorts = struct.unpack(f"{n}h", segment)
                rms    = math.sqrt(sum(s * s for s in shorts) / n)
                t      = i / 16000  # seconds from segment start

                if rms > CLAP_SENSITIVITY:
                    if not peaks or (t - peaks[-1]) > cooldown_s:
                        peaks.append(t)

            if not peaks:
                return

            # ── Check within-segment double clap ─────────────────────
            for i in range(len(peaks) - 1):
                if peaks[i + 1] - peaks[i] <= window_s:
                    self._log(
                        f"Double clap in segment! peaks at {peaks[i]:.2f}s & {peaks[i+1]:.2f}s",
                        "CLAP"
                    )
                    self._prev_clap_time = None
                    self._wake.set()
                    return

            # ── Check cross-segment double clap ───────────────────────
            first_peak_abs = seg_start + peaks[0]
            if self._prev_clap_time is not None:
                gap = first_peak_abs - self._prev_clap_time
                if cooldown_s < gap <= window_s:
                    self._log(
                        f"Double clap across segments! gap={gap*1000:.0f}ms",
                        "CLAP"
                    )
                    self._prev_clap_time = None
                    self._wake.set()
                    return

            # Store the last peak from this segment for next callback
            last_peak_abs = seg_start + peaks[-1]
            if now - last_peak_abs < window_s:
                self._prev_clap_time = last_peak_abs
            else:
                self._prev_clap_time = None

        except Exception:
            pass


# ══════════════════════════════════════════════════════════════════════════════
#  PROACTIVE MONITOR
# ══════════════════════════════════════════════════════════════════════════════
class ProactiveMonitor:
    def __init__(self, speak_fn, log_fn):
        self._speak   = speak_fn
        self._log     = log_fn
        self._stop    = threading.Event()
        self._thread  = threading.Thread(target=self._run, daemon=True, name="ProactiveMonitor")
        self._battery_warned = False
        self._timers  = []
        self._timer_lock = threading.Lock()

    def start(self):
        self._thread.start()

    def stop(self):
        self._stop.set()

    def add_timer(self, seconds: int, message: str):
        with self._timer_lock:
            self._timers.append((time.time() + seconds, message))
        self._log(f"Timer set: {seconds}s → \"{message}\"", state="INFO")

    def _run(self):
        while not self._stop.is_set():
            if _PSUTIL_OK:
                try:
                    batt = psutil.sensors_battery()
                    if batt and not batt.power_plugged:
                        pct = batt.percent
                        if pct <= BATTERY_WARN_THRESHOLD and not self._battery_warned:
                            self._battery_warned = True
                            self._speak(
                                f"Commander, battery is at {int(pct)} percent. "
                                "I'd recommend plugging in soon."
                            )
                        elif pct > BATTERY_WARN_THRESHOLD + 5:
                            self._battery_warned = False
                except Exception:
                    pass

            now    = time.time()
            fired  = []
            with self._timer_lock:
                remaining = []
                for fire_at, msg in self._timers:
                    if now >= fire_at:
                        fired.append(msg)
                    else:
                        remaining.append((fire_at, msg))
                self._timers = remaining

            for msg in fired:
                self._speak(msg)

            self._stop.wait(timeout=10)


# ══════════════════════════════════════════════════════════════════════════════
#  ZEN ASSISTANT — Super Agent
# ══════════════════════════════════════════════════════════════════════════════
class ZenAssistant:

    def __init__(self):
        self._tts_lock    = threading.Lock()
        self.local_tts    = None
        self.chat_history = []
        self._clap_event  = threading.Event()
        self._wake_queue  = _queue.Queue()   # populated by background listener thread
        self.memory       = MemoryManager()

        self._log("Initializing Zen 2.0...", state="IDLE")

        # ── ElevenLabs ────────────────────────────────────────────────
        if not ELEVENLABS_API_KEY:
            sys.exit(f"{C_RED}[ERROR] ELEVENLABS_API_KEY missing{C_RESET}")
        self.el = ElevenLabs(api_key=ELEVENLABS_API_KEY)
        pygame.mixer.init(frequency=44100, size=-16, channels=2, buffer=2048)
        self._log("ElevenLabs + audio ready.", state="SUCCESS")

        # ── Background recognizer (used for wake-word listening) ──────
        self._bg_r = sr.Recognizer()
        self._bg_r.energy_threshold        = 300
        self._bg_r.dynamic_energy_threshold = True
        self._bg_r.pause_threshold          = 0.7   # shorter → faster cycle

        # ── Foreground recognizer (used for command listening) ────────
        self.r = sr.Recognizer()
        self.r.pause_threshold        = 1.0
        self.r.phrase_threshold       = 0.3
        self.r.non_speaking_duration  = 0.5
        self.r.dynamic_energy_threshold = True

        # ── Gemini — lazy init, NO smoke-test (avoids burning quota) ──
        self.ai_enabled   = False
        self.genai_client = None
        if GEMINI_API_KEY:
            try:
                self.genai_client = genai.Client(api_key=GEMINI_API_KEY)
                self.ai_enabled   = True
                self._log(f"Gemini AI initialized ({GEMINI_MODEL}).", state="SUCCESS")
            except Exception as e:
                self._log(f"Gemini init failed: {e}", state="ERROR")
        else:
            self._log("No GEMINI_API_KEY — AI responses disabled.", state="ERROR")

        # ── Clap detector (no separate stream!) ───────────────────────
        self.clap_detector = ClapDetector(self._clap_event, self._log) if CLAP_WAKE_ENABLED else None

        # ── Proactive monitor ─────────────────────────────────────────
        self.proactive = ProactiveMonitor(self._speak, self._log)
        if PROACTIVE_ENABLED:
            self.proactive.start()
            self._log("Proactive monitor started.", state="SUCCESS")

        self.memory.new_session()
        self._log("Ready.", state="SUCCESS")

    # ─────────────────────────────────────────────────────────────────
    # Logging
    # ─────────────────────────────────────────────────────────────────
    def _log(self, msg, state="INFO"):
        if DEBUG:
            color_map = {
                "IDLE":      C_GRAY,
                "LISTENING": C_CYAN,
                "THINKING":  C_YELLOW,
                "SPEAKING":  C_GREEN,
                "ERROR":     C_RED + C_BOLD,
                "SUCCESS":   C_GREEN + C_BOLD,
                "CLAP":      C_MAGENTA + C_BOLD,
                "INFO":      C_RESET,
            }
            color = color_map.get(state, C_RESET)
            ts = datetime.now().strftime("%H:%M:%S")
            print(f"{C_GRAY}[{ts}]{C_RESET} {color}[{state:<9}]{C_RESET} {msg}")

    # ─────────────────────────────────────────────────────────────────
    # Voice settings
    # ─────────────────────────────────────────────────────────────────
    def _get_voice_settings(self, text: str) -> VoiceSettings:
        t = text.lower()
        stability, style = ELEVENLABS_STABILITY, ELEVENLABS_STYLE
        if any(w in t for w in ["commander", "boss", "right away", "systems", "locked", "volume", "command"]):
            stability, style = 0.70, 0.15
        elif any(w in t for w in ["discipline", "focus", "stoic", "advice", "wisdom", "path"]):
            stability, style = 0.60, 0.25
        elif any(w in t for w in ["joke", "awesome", "great", "motivated", "cheer"]):
            stability, style = 0.45, 0.50
        return VoiceSettings(
            stability=stability,
            similarity_boost=ELEVENLABS_SIMILARITY,
            style=style,
            use_speaker_boost=ELEVENLABS_SPEAKER_BOOST,
        )

    # ─────────────────────────────────────────────────────────────────
    # TTS
    # ─────────────────────────────────────────────────────────────────
    def _speak(self, text: str):
        self._log(f'"{text}"', state="SPEAKING")
        if self.clap_detector:
            self.clap_detector.mute()

        with self._tts_lock:
            try:
                settings    = self._get_voice_settings(text)
                chunks      = self.el.text_to_speech.convert(
                    voice_id=ELEVENLABS_VOICE_ID,
                    text=text,
                    model_id=ELEVENLABS_MODEL,
                    voice_settings=settings,
                    output_format="mp3_44100_128",
                )
                audio_bytes = b"".join(chunks)
                buf         = io.BytesIO(audio_bytes)
                pygame.mixer.music.load(buf)
                pygame.mixer.music.play()

                is_win = sys.platform.startswith("win")
                while pygame.mixer.music.get_busy():
                    if is_win:
                        try:
                            import msvcrt
                            if msvcrt.kbhit():
                                key = msvcrt.getch()
                                if key in [b" ", b"\x1b"]:
                                    pygame.mixer.music.stop()
                                    self._log("Speech interrupted.", state="IDLE")
                                    break
                        except Exception:
                            pass
                    time.sleep(0.05)

            except Exception as e:
                self._log(f"ElevenLabs TTS failed: {e}", state="ERROR")
                try:
                    if self.local_tts is None:
                        import pyttsx3
                        self.local_tts = pyttsx3.init()
                        self.local_tts.setProperty("rate", 165)
                    self.local_tts.say(text)
                    self.local_tts.runAndWait()
                except Exception as tts_err:
                    self._log(f"Local TTS failed: {tts_err}", state="ERROR")
                    print(f"  Zen says: {text}")

        time.sleep(0.3)
        if self.clap_detector:
            self.clap_detector.unmute()

    # ─────────────────────────────────────────────────────────────────
    # Chime
    # ─────────────────────────────────────────────────────────────────
    def _chime(self):
        try:
            sr_val = 44100
            for freq, dur in [(800, 0.10), (1100, 0.07)]:
                t    = np.linspace(0, dur, int(sr_val * dur), False)
                wave = (np.sin(2 * np.pi * freq * t) * 28000).astype(np.int16)
                stereo = np.column_stack([wave, wave])
                pygame.sndarray.make_sound(stereo).play()
                time.sleep(dur + 0.04)
        except Exception:
            try:
                import winsound
                winsound.Beep(800, 100)
                winsound.Beep(1100, 70)
            except Exception:
                print("\a")

    # ─────────────────────────────────────────────────────────────────
    # STT — foreground only (background uses bg_r directly)
    # ─────────────────────────────────────────────────────────────────
    def _recognize(self, source, timeout=None, phrase_limit=6) -> str | None:
        try:
            audio = self.r.listen(source, timeout=timeout, phrase_time_limit=phrase_limit)
            text  = self.r.recognize_google(audio).lower().strip()
            self._log(f'Heard: "{text}"', state="SUCCESS")
            return text
        except sr.WaitTimeoutError:
            return None
        except sr.UnknownValueError:
            return None
        except sr.RequestError as e:
            self._log(f"STT error: {e}", state="ERROR")
            return None

    # ─────────────────────────────────────────────────────────────────
    # ── TOOL IMPLEMENTATIONS ─────────────────────────────────────────
    # ─────────────────────────────────────────────────────────────────
    def _tool_open_app_route(self, route: str = "", page_name: str = "") -> str:
        if not route and page_name:
            for phrase, r in ROUTES.items():
                if phrase in page_name.lower():
                    route = r
                    break
        url  = APP_URL + (route or "/")
        page = (route or "/").strip("/").replace("-", " ").title() or "Home"
        webbrowser.open(url)
        return f"Opening {page}, Commander."

    def _tool_log_activity(self, category: str, activity_type: str,
                           duration: int = 30, xp: int = 0, stats: str = "") -> str:
        xp = xp or max(20, min(200, int(duration * 1.5)))
        params = f"?action=log-activity&category={category}&type={activity_type}&duration={duration}&xp={xp}&stats={stats}"
        webbrowser.open(APP_URL + "/" + category + params)
        return f"Logging a {duration} minute {activity_type} for you. That earns {xp} XP, Commander."

    def _tool_web_search(self, query: str, engine: str = "google") -> str:
        import urllib.parse
        q   = urllib.parse.quote(query)
        url = (f"https://www.youtube.com/results?search_query={q}"
               if engine == "youtube"
               else f"https://www.google.com/search?q={q}")
        webbrowser.open(url)
        return f"Searching {engine.title()} for '{query}'."

    def _tool_get_system_info(self) -> str:
        now  = datetime.now()
        info = [
            f"Time: {now.strftime('%I:%M %p')}",
            f"Date: {now.strftime('%A, %B %d, %Y')}",
        ]
        if _PSUTIL_OK:
            try:
                info.append(f"CPU: {psutil.cpu_percent(interval=0.5):.0f}%")
            except Exception:
                pass
            try:
                batt = psutil.sensors_battery()
                if batt:
                    info.append(
                        f"Battery: {batt.percent:.0f}%, "
                        f"{'plugged in' if batt.power_plugged else 'on battery'}"
                    )
            except Exception:
                pass
            try:
                info.append(f"RAM: {psutil.virtual_memory().percent:.0f}% used")
            except Exception:
                pass
        return ". ".join(info) + "."

    def _tool_control_volume(self, action: str) -> str:
        if sys.platform.startswith("win"):
            import ctypes
            vk_map = {"up": 0xAF, "down": 0xAE, "mute": 0xAD}
            repeat = 4 if action in ("up", "down") else 1
            vk = vk_map.get(action)
            if vk:
                for _ in range(repeat):
                    ctypes.windll.user32.keybd_event(vk, 0, 0, 0)
                    ctypes.windll.user32.keybd_event(vk, 0, 2, 0)
        labels = {"up": "increased", "down": "decreased", "mute": "toggled"}
        return f"Volume {labels.get(action, 'adjusted')}, Commander."

    def _tool_lock_screen(self) -> str:
        if sys.platform.startswith("win"):
            import ctypes
            ctypes.windll.user32.LockWorkStation()
            return "System locked, Boss. Stay secure."
        return "Screen lock is only supported on Windows."

    def _tool_run_timer(self, minutes: int, label: str = "") -> str:
        label = label or f"{minutes} minute timer"
        msg   = f"Time is up, Commander. Your {label} has ended."
        self.proactive.add_timer(minutes * 60, msg)
        h, m  = divmod(minutes, 60)
        dur   = (f"{h}h " if h else "") + (f"{m}min" if m else "")
        return f"Timer set for {dur.strip()}. I'll fire when it's done."

    def _tool_get_weather(self, location: str = "") -> str:
        """Fetch current weather, auto-detecting city from IP if not specified."""
        if not _REQUESTS_OK:
            return "Weather lookup needs the requests library."

        loc = location.strip() if location and location.strip() else ""

        # Auto-detect city via IP geolocation if no explicit location
        if not loc and (not WEATHER_LOCATION or WEATHER_LOCATION == "auto"):
            try:
                ip_data = _requests.get("https://ipapi.co/json/", timeout=4).json()
                loc = ip_data.get("city") or ip_data.get("region") or ""
                if loc:
                    self._log(f"Weather: auto-detected city = {loc}", state="INFO")
            except Exception:
                pass
        elif not loc:
            loc = WEATHER_LOCATION

        try:
            url  = f"https://wttr.in/{loc}?format=3" if loc else "https://wttr.in/?format=3"
            resp = _requests.get(url, timeout=6)
            return f"Current weather: {resp.text.strip()}." if resp.ok else "Couldn't reach the weather service right now."
        except Exception as e:
            return f"Weather lookup failed: {e}"

    def _tool_read_clipboard(self) -> str:
        if not _CLIP_OK:
            return "Clipboard access needs pyperclip."
        try:
            content = pyperclip.paste()
            return f"Clipboard: {content.strip()[:200]}." if content and content.strip() else "Clipboard is empty."
        except Exception as e:
            return f"Failed to read clipboard: {e}"

    def _tool_write_clipboard(self, text: str) -> str:
        if not _CLIP_OK:
            return "Clipboard access needs pyperclip."
        try:
            pyperclip.copy(text)
            return "Copied to clipboard, Commander."
        except Exception as e:
            return f"Failed: {e}"

    def _tool_remember_note(self, note: str) -> str:
        self.memory.add_note(note)
        return "Committed to memory, Commander."

    # (Function declarations kept for future use — tools are dispatched
    #  directly from _handle() via pattern matching for reliability.)

    # ─────────────────────────────────────────────────────────────────
    # Tool dispatcher (called from _handle pattern matching)
    # ─────────────────────────────────────────────────────────────────
    def _dispatch_tool(self, name: str, **kwargs) -> str:
        self._log(f"Tool → {name}({kwargs})", state="THINKING")
        try:
            dispatch = {
                "open_app_route":  lambda: self._tool_open_app_route(**kwargs),
                "log_activity":    lambda: self._tool_log_activity(**kwargs),
                "web_search":      lambda: self._tool_web_search(**kwargs),
                "get_system_info": lambda: self._tool_get_system_info(),
                "control_volume":  lambda: self._tool_control_volume(**kwargs),
                "lock_screen":     lambda: self._tool_lock_screen(),
                "run_timer":       lambda: self._tool_run_timer(**kwargs),
                "get_weather":     lambda: self._tool_get_weather(**kwargs),
                "read_clipboard":  lambda: self._tool_read_clipboard(),
                "write_clipboard": lambda: self._tool_write_clipboard(**kwargs),
                "remember_note":   lambda: self._tool_remember_note(**kwargs),
            }
            fn = dispatch.get(name)
            return fn() if fn else f"Unknown tool: {name}"
        except Exception as e:
            self._log(f"Tool error ({name}): {e}", state="ERROR")
            return f"I ran into a problem: {e}"

    # ─────────────────────────────────────────────────────────────────
    # Gemini conversational AI — simple, reliable text generation
    # ─────────────────────────────────────────────────────────────────
    def _ask_ai(self, command: str) -> str:
        self._log("Querying Gemini...", state="THINKING")

        hour = datetime.now().hour
        time_note = (
            "It is morning." if hour < 12
            else "It is afternoon." if hour < 17
            else "It is evening." if hour < 21
            else "It is late night."
        )

        memory_ctx = self.memory.get_context_block()
        history_ctx = ""
        if self.chat_history:
            history_ctx = "\nRecent conversation:\n" + "".join(
                f"User: {u}\nZen: {a}\n" for u, a in self.chat_history[-4:]
            )

        # Fetch real location from IP (fast, cached per-call) for AI context
        location_ctx = ""
        if _REQUESTS_OK:
            try:
                ip_data = _requests.get("https://ipapi.co/json/", timeout=3).json()
                city    = ip_data.get("city", "")
                region  = ip_data.get("region", "")
                country = ip_data.get("country_name", "")
                tz      = ip_data.get("timezone", "")
                if city or country:
                    location_ctx = (
                        f"User location: {', '.join(filter(None, [city, region, country]))}. "
                        f"Timezone: {tz}."
                    )
            except Exception:
                pass

        system_prompt = (
            "You are Zen, an elite AI super agent for the Monarch System "
            "(a gamified self-improvement platform for peak human performance). "
            "Blend three personalities: "
            "1. Loyal Subordinate — precise, calls user 'Commander' or 'Boss'. "
            "2. Close Friend — warm, candid, encouraging. "
            "3. Wise Advisor — stoic, strategic, growth-focused. "
            "Monarch System pages: Dashboard, Schedule, Todo/Quests, Fitness, Mind, "
            "Coding, Creator, Boss Mode, Analytics, Profile, Antigravity. "
            "XP stats: fitness (strength, endurance), coding (intelligence, focus), "
            "mind (stoicism, focus), creator (creativity, consistency). "
            "Rules: keep replies 1-3 sentences, voice-friendly, no markdown, no bullets, no emojis. "
            f"{time_note} "
            f"Datetime: {datetime.now().strftime('%A, %B %d, %Y at %I:%M %p')}."
        )
        if location_ctx:
            system_prompt += f"\n{location_ctx}"
        if memory_ctx:
            system_prompt += f"\nUser context: {memory_ctx}"
        if history_ctx:
            system_prompt += history_ctx

        prompt = f"{system_prompt}\n\nUser: {command}\nZen:"

        models_to_try = [GEMINI_MODEL] + list(GEMINI_MODEL_FALLBACKS)
        last_err = None

        for model in models_to_try:
            try:
                response = self.genai_client.models.generate_content(
                    model=model,
                    contents=prompt,
                )
                reply = (response.text or "").strip()
                if not reply:
                    return "I'm not sure how to answer that."

                if model != GEMINI_MODEL:
                    self._log(f"Used fallback model: {model}", state="INFO")

                self.chat_history.append((command, reply))
                if len(self.chat_history) > 8:
                    self.chat_history.pop(0)

                return reply

            except Exception as e:
                err = str(e)
                last_err = e
                self._log(f"Gemini [{model}] error: {type(e).__name__}: {err[:120]}", state="ERROR")
                # Only retry on quota/not-found — other errors are fatal
                if "429" in err or "RESOURCE_EXHAUSTED" in err or "404" in err or "NOT_FOUND" in err:
                    self._log(f"Trying next model...", state="INFO")
                    continue
                # Non-retriable error
                return "The AI encountered an error. Check the debug log for details."

        # All models exhausted
        err = str(last_err)
        if "429" in err or "RESOURCE_EXHAUSTED" in err:
            return "All AI models are rate-limited right now, Commander. The quota resets in a few minutes."
        return "The AI encountered an error. Check the debug log for details."

    # ─────────────────────────────────────────────────────────────────
    # Command handler — pattern matching + AI fallback
    # ─────────────────────────────────────────────────────────────────
    def _is_stop_command(self, cmd: str) -> bool:
        return any(k in cmd for k in ["stop", "shutdown", "goodbye", "sleep", "turn off", "go offline"])

    def _handle(self, command: str) -> str:
        self._log(f'Processing: "{command}"', state="THINKING")
        c = command.lower()

        # ── Shutdown ───────────────────────────────────────────────────
        if self._is_stop_command(c):
            self.memory.save()
            self._speak("Zen going offline. Stay sharp, Commander.")
            sys.exit(0)

        # ── Greetings / status ─────────────────────────────────────────
        if any(k in c for k in ["hello", "hey zen", "hi zen", "status", "you online", "are you there"]):
            hour = datetime.now().hour
            if hour < 12:   return "Good morning, Commander. All systems green."
            elif hour < 17: return "Good afternoon, Boss. Online and ready."
            elif hour < 21: return "Good evening. Systems are optimal. What's the mission?"
            else:           return "Still here, Boss. Burning the midnight oil alongside you."

        # ── Time / Date ────────────────────────────────────────────────
        if any(k in c for k in ["what time", "what's the time", "current time"]):
            return f"It's {datetime.now().strftime('%I:%M %p')}."
        if any(k in c for k in ["what day", "what date", "today's date", "what's today"]):
            return f"Today is {datetime.now().strftime('%A, %B %d, %Y')}."

        # ── Help ───────────────────────────────────────────────────────
        if any(k in c for k in ["help", "what can you do", "commands", "capabilities"]):
            return (
                "I can navigate Monarch, log activities, search Google or YouTube, "
                "control volume, lock your screen, set timers, check weather, "
                "read your clipboard, and have a full conversation via Gemini AI. "
                "Say Zen or double-clap to activate me."
            )

        # ── System info ────────────────────────────────────────────────
        if any(k in c for k in ["battery", "cpu usage", "ram usage", "system info", "system status"]):
            return self._dispatch_tool("get_system_info")

        # ── Volume ─────────────────────────────────────────────────────
        if any(k in c for k in ["volume up", "raise volume", "louder", "increase volume"]):
            return self._dispatch_tool("control_volume", action="up")
        if any(k in c for k in ["volume down", "lower volume", "quieter", "decrease volume"]):
            return self._dispatch_tool("control_volume", action="down")
        if any(k in c for k in ["mute", "unmute", "silence"]):
            return self._dispatch_tool("control_volume", action="mute")

        # ── Lock screen ────────────────────────────────────────────────
        if any(k in c for k in ["lock my pc", "lock the screen", "lock screen", "lock pc", "lock computer"]):
            return self._dispatch_tool("lock_screen")

        # ── Weather ────────────────────────────────────────────────────
        if any(k in c for k in ["weather", "temperature", "forecast", "what's it like outside"]):
            loc_match = re.search(r'(?:weather|forecast|temperature)\s+(?:in|at|for)\s+([\w\s]+)', c)
            loc = loc_match.group(1).strip() if loc_match else ""
            return self._dispatch_tool("get_weather", location=loc)

        # ── Timer / Pomodoro ───────────────────────────────────────────
        timer_kw = ["set a timer", "set timer", "start a timer", "pomodoro", "remind me in", "timer for"]
        if any(k in c for k in timer_kw) or re.search(r'(\d+)\s*(minute|min|hour|hr)s?\s*(timer|pomodoro)', c):
            m = re.search(r'(\d+)\s*(minute|min|hour|hr)', c)
            if m:
                num, unit = int(m.group(1)), m.group(2)
                minutes   = num * 60 if "hour" in unit or "hr" in unit else num
            else:
                minutes = 25   # default Pomodoro
            label = "Pomodoro session" if "pomodoro" in c else f"{minutes} minute timer"
            return self._dispatch_tool("run_timer", minutes=minutes, label=label)

        # ── Clipboard ──────────────────────────────────────────────────
        if "clipboard" in c and any(k in c for k in ["read", "what's on", "what is on", "show"]):
            return self._dispatch_tool("read_clipboard")
        if "copy" in c and "clipboard" in c:
            text_match = re.search(r'copy\s+["\']?(.+?)["\']?\s+to clipboard', c)
            if text_match:
                return self._dispatch_tool("write_clipboard", text=text_match.group(1))

        # ── Remember note ──────────────────────────────────────────────
        if any(k in c for k in ["remember that", "note that", "don't forget", "make a note", "save that"]):
            note = re.sub(r'\b(remember that|note that|don\'t forget|make a note|save that)\b', '', c).strip()
            return self._dispatch_tool("remember_note", note=note)

        # ── YouTube ────────────────────────────────────────────────────
        if "youtube" in c or "play" in c:
            query = re.sub(r'\b(play|on youtube|youtube|search|for me)\b', '', c).strip()
            if query:
                return self._dispatch_tool("web_search", query=query, engine="youtube")

        # ── Google search ──────────────────────────────────────────────
        if any(k in c for k in ["google", "search for", "look up", "find"]):
            query = re.sub(r'\b(google|search for|look up|find|search)\b', '', c).strip()
            if query:
                return self._dispatch_tool("web_search", query=query, engine="google")

        # ── Log activity ───────────────────────────────────────────────
        if any(k in c for k in ["log", "record", "track", "completed", "finished", "just did"]):
            category, activity_type, stats = None, "Activity", ""
            if any(k in c for k in ["workout", "fitness", "gym", "run", "pushup", "squat", "cardio", "exercise"]):
                category, activity_type, stats = "fitness",  "Workout",          "strength,endurance"
            elif any(k in c for k in ["coding", "code", "leetcode", "dsa", "programming", "dev"]):
                category, activity_type, stats = "coding",   "Coding Session",   "intelligence,focus"
            elif any(k in c for k in ["meditation", "meditate", "journal", "mindfulness", "stoic"]):
                category, activity_type, stats = "mind",     "Mind Session",     "stoicism,focus"
            elif any(k in c for k in ["creator", "youtube", "instagram", "video", "content", "upload"]):
                category, activity_type, stats = "creator",  "Content Creation", "creativity,consistency"

            if category:
                m = re.search(r'(\d+)\s*(minute|min|hour|hr)', c)
                if m:
                    num, unit = int(m.group(1)), m.group(2)
                    duration  = num * 60 if "hour" in unit or "hr" in unit else num
                else:
                    duration = 30
                return self._dispatch_tool(
                    "log_activity",
                    category=category, activity_type=activity_type,
                    duration=duration, stats=stats
                )

        # ── Navigate Monarch pages ─────────────────────────────────────────────
        # Strategy 1: explicit navigation verb → extract target page
        #   e.g. "go to fitness", "show me the dashboard", "take me to coding"
        _NAV_VERB_RE = re.compile(
            r'\b(?:go to|take me to|navigate to|show me|switch to|head to|pull up|bring up)\b\s+(?:the\s+)?(\w[\w\s]*)',
            re.IGNORECASE
        )
        nav_m = _NAV_VERB_RE.search(c)
        if nav_m:
            target = nav_m.group(1).lower().strip()
            for phrase in sorted(ROUTES, key=len, reverse=True):
                if phrase in target:
                    return self._dispatch_tool("open_app_route", route=ROUTES[phrase])

        # Strategy 2: "open" verb — could be a page OR the app itself
        #   e.g. "open fitness", "open the app", "open up monarch"
        open_m = re.search(r'\bopen(?:\s+up)?\b\s+(?:the\s+)?(\w[\w\s]*)', c)
        if open_m:
            target = open_m.group(1).lower().strip()
            # Check for a page route first
            for phrase in sorted(ROUTES, key=len, reverse=True):
                if phrase in target:
                    return self._dispatch_tool("open_app_route", route=ROUTES[phrase])
            # Otherwise open the app itself
            if any(k in target for k in ["app", "monarch", "system", "it", "this"]):
                webbrowser.open(APP_URL)
                return "Monarch System is now online, Commander."

        # Strategy 3: "launch" verb
        launch_m = re.search(r'\blaunch\b\s+(?:the\s+)?(\w[\w\s]*)', c)
        if launch_m:
            target = launch_m.group(1).lower().strip()
            for phrase in sorted(ROUTES, key=len, reverse=True):
                if phrase in target:
                    return self._dispatch_tool("open_app_route", route=ROUTES[phrase])
            if any(k in target for k in ["app", "monarch", "system"]):
                webbrowser.open(APP_URL)
                return "Monarch System is now online, Commander."

        # Strategy 4: direct route keyword mention (without a navigation verb)
        # Use word-boundary matching for short/ambiguous phrases to avoid false positives
        _SHORT_ROUTE_PHRASES = {"home", "gym", "mind", "code", "boss", "todo", "tasks", "stats"}
        for phrase in sorted(ROUTES, key=len, reverse=True):
            if phrase in _SHORT_ROUTE_PHRASES:
                if re.search(r'\b' + re.escape(phrase) + r'\b', c):
                    return self._dispatch_tool("open_app_route", route=ROUTES[phrase])
            elif phrase in c:
                return self._dispatch_tool("open_app_route", route=ROUTES[phrase])

        # ── Open Monarch app (no specific page) ────────────────────────────────
        monarch_kw = [
            "monarch", "boot up", "launch app", "launch the app",
            "start app", "start the app", "open app", "open the app",
            "open it", "open it up", "show me the app",
        ]
        if any(k in c for k in monarch_kw):
            webbrowser.open(APP_URL)
            return "Monarch System is now online, Commander."

        # ── AI fallback for everything else ────────────────────────────
        if self.ai_enabled:
            return self._ask_ai(command)

        return "I didn't catch that, Commander. Try: open Monarch, go to fitness, or set a timer."

    # ─────────────────────────────────────────────────────────────────
    # Background listener callback
    # ─────────────────────────────────────────────────────────────────
    def _make_bg_callback(self):
        def _bg_callback(recognizer, audio):
            # ── Feed to clap detector ──────────────────────────────────
            if self.clap_detector:
                self.clap_detector.feed(audio)

            # ── Attempt STT for wake word ──────────────────────────────
            try:
                text = recognizer.recognize_google(audio).lower().strip()
                if not text:
                    return
                self._log(f'BG heard: "{text}"', state="SUCCESS")

                triggers = [WAKE_WORD, "then", "them", "send", "ten", "when", "zenn"]
                for t in triggers:
                    if t in text:
                        idx    = text.find(t)
                        prefix = text[:idx].strip().strip(",.!")
                        if not prefix or prefix in ["hey", "hello", "hi", "ok", "okay"]:
                            cmd = text[idx + len(t):].strip().strip(",.! ")
                            self._log(f"Wake word! (matched: '{t}')", state="SUCCESS")
                            self._wake_queue.put(("voice", cmd))
                            return
            except sr.UnknownValueError:
                pass
            except sr.RequestError as e:
                self._log(f"BG STT error: {e}", state="ERROR")
            except Exception as e:
                self._log(f"BG callback error: {e}", state="ERROR")

        return _bg_callback

    # ─────────────────────────────────────────────────────────────────
    # Foreground command session (called when wake is triggered)
    # ─────────────────────────────────────────────────────────────────
    def _command_session(self, mic: sr.Microphone, inline_command: str = ""):
        """Opens mic for foreground command + multi-turn follow-up."""
        self._chime()
        try:
            with mic as source:
                if inline_command:
                    command = inline_command
                else:
                    self._speak("Yes?")
                    time.sleep(0.1)
                    self._log("Waiting for command...", state="LISTENING")
                    command = self._recognize(source, timeout=COMMAND_TIMEOUT,
                                             phrase_limit=COMMAND_PHRASE_LIMIT)

                if not command:
                    self._speak("I didn't catch that. Say Zen or clap twice to try again.")
                    return

                response = self._handle(command)
                self._speak(response)

                # ── Multi-turn follow-up window ────────────────────────
                if CONVO_WINDOW_SEC <= 0:
                    return

                deadline = time.time() + CONVO_WINDOW_SEC
                self._log(f"Follow-up window open ({CONVO_WINDOW_SEC}s)...", state="LISTENING")

                while time.time() < deadline:
                    followup = self._recognize(
                        source, timeout=min(int(deadline - time.time()), 8),
                        phrase_limit=COMMAND_PHRASE_LIMIT
                    )
                    if not followup:
                        break   # silence → close window

                    if any(k in followup for k in ["that's all", "thanks", "thank you", "nothing", "bye"]):
                        self._speak("Got it. I'll be here.")
                        return
                    if self._is_stop_command(followup):
                        self.memory.save()
                        self._speak("Zen going offline. Stay sharp.")
                        sys.exit(0)

                    self._log(f'Follow-up: "{followup}"', state="SUCCESS")
                    response = self._handle(followup)
                    self._speak(response)
                    deadline = time.time() + CONVO_WINDOW_SEC

                self._log("Follow-up window closed.", state="IDLE")
        except Exception as e:
            self._log(f"Command session error: {e}", state="ERROR")

    # ─────────────────────────────────────────────────────────────────
    # Main run loop
    # ─────────────────────────────────────────────────────────────────
    def run(self):
        w = 60
        print(f"\n{C_CYAN}{C_BOLD}" + "═" * w)
        print(f"{'ZEN 2.0 — SUPER AGENT':^{w}}")
        print(f"{'Monarch System Voice Assistant':^{w}}")
        print("═" * w + f"{C_RESET}")
        print(f"  Wake word  : {C_GREEN}{C_BOLD}{WAKE_WORD.upper()}{C_RESET}")
        if CLAP_WAKE_ENABLED:
            print(f"  Clap wake  : {C_MAGENTA}{C_BOLD}ENABLED (double clap){C_RESET}")
        print(f"  App URL    : {C_GRAY}{APP_URL}{C_RESET}")
        print(f"  TTS        : {C_GRAY}ElevenLabs / {ELEVENLABS_MODEL}{C_RESET}")
        ai_color = C_GREEN if self.ai_enabled else C_RED
        ai_label = f"Gemini {GEMINI_MODEL} + function calling" if self.ai_enabled else "Offline"
        print(f"  AI Engine  : {ai_color}{ai_label}{C_RESET}")
        print(f"  Memory     : {C_BLUE}Session #{self.memory.data.get('session_count', 1)}{C_RESET}")
        print(f"  Proactive  : {C_GREEN if PROACTIVE_ENABLED else C_GRAY}{'ON' if PROACTIVE_ENABLED else 'OFF'}{C_RESET}")
        print(f"  Conv. Win  : {C_GRAY}{CONVO_WINDOW_SEC}s follow-up window{C_RESET}")
        print(f"{C_CYAN}" + "═" * w + f"{C_RESET}\n")
        print(f"  Say {C_GREEN}{C_BOLD}'ZEN'{C_RESET}", end="")
        if CLAP_WAKE_ENABLED:
            print(f" or {C_MAGENTA}{C_BOLD}CLAP TWICE{C_RESET}", end="")
        print(f" to activate.  Ctrl+C to quit.\n")

        mic = sr.Microphone(device_index=MIC_INDEX)

        # ── Calibrate once (open then close) ──────────────────────────
        self._log("Calibrating microphone (2 seconds)...", state="IDLE")
        try:
            with mic as source:
                self.r.adjust_for_ambient_noise(source, duration=2)
                threshold = max(self.r.energy_threshold, 200)
                self.r.energy_threshold = threshold
                self._bg_r.energy_threshold = threshold
            self._log(f"Mic calibrated. Energy threshold: {threshold:.0f}", state="SUCCESS")
        except Exception as e:
            self._log(f"Calibration failed: {e} — using defaults.", state="ERROR")

        # ── Boot greeting ──────────────────────────────────────────────
        user      = self.memory.data.get("user_name", "Commander")
        session_n = self.memory.data.get("session_count", 1)
        if session_n > 1:
            boot_msg = (
                f"Zen 2.0 online. Welcome back, {user}. "
                + ("AI connected. " if self.ai_enabled else "")
                + ("Clap twice or say Zen to activate." if CLAP_WAKE_ENABLED else "Say Zen to activate.")
            )
        else:
            boot_msg = (
                "Zen 2.0 online. I am your super agent. "
                + ("Gemini AI ready with function calling. " if self.ai_enabled else "")
                + ("Clap twice or say Zen to activate." if CLAP_WAKE_ENABLED else "Say Zen to activate.")
            )
        self._speak(boot_msg)

        # ── Start background listener ──────────────────────────────────
        bg_callback = self._make_bg_callback()
        stop_bg     = self._bg_r.listen_in_background(mic, bg_callback, phrase_time_limit=3)
        self._log("Background listener active. Waiting for wake...", state="IDLE")

        # ── Main event loop ────────────────────────────────────────────
        while True:
            try:
                # Check for clap wake event (set by ClapDetector from bg callback)
                if self._clap_event.is_set():
                    self._clap_event.clear()
                    self._log("Double clap detected! Activating...", state="CLAP")
                    stop_bg(wait_for_stop=True)           # pause bg listener (closes mic)
                    self._command_session(mic)             # foreground session (reopens mic)
                    stop_bg = self._bg_r.listen_in_background(mic, bg_callback, phrase_time_limit=3)
                    self._log("Background listener resumed.", state="IDLE")
                    continue

                # Check for voice wake event (set by bg callback)
                try:
                    _, cmd = self._wake_queue.get_nowait()
                    stop_bg(wait_for_stop=True)
                    self._command_session(mic, inline_command=cmd)
                    stop_bg = self._bg_r.listen_in_background(mic, bg_callback, phrase_time_limit=3)
                    self._log("Background listener resumed.", state="IDLE")
                except _queue.Empty:
                    pass

                time.sleep(0.05)

            except KeyboardInterrupt:
                self._log("Shutting down...", state="IDLE")
                try:
                    stop_bg(wait_for_stop=False)
                except Exception:
                    pass
                self.memory.save()
                print(f"\n{C_YELLOW}[ZEN] Goodbye, Commander.{C_RESET}")
                break
            except Exception as e:
                self._log(f"Loop error: {e}", state="ERROR")
                time.sleep(0.5)


# ── Entry point ───────────────────────────────────────────────────────────────
def main():
    try:
        if sys.platform.startswith("win"):
            import ctypes
            ctypes.windll.kernel32.SetConsoleMode(
                ctypes.windll.kernel32.GetStdHandle(-11), 7
            )
    except Exception:
        pass

    try:
        ZenAssistant().run()
    except KeyboardInterrupt:
        print(f"\n{C_YELLOW}[ZEN] Shutdown. Goodbye.{C_RESET}")
    except Exception as e:
        print(f"\n{C_RED}{C_BOLD}[FATAL] {e}{C_RESET}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
