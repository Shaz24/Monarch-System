"""
Zen Configuration
─────────────────
Edit these settings before running zen.py
All secrets go in the .env file, not here.
"""

import os
from dotenv import load_dotenv

load_dotenv()

GEMINI_API_KEY      = os.getenv("GEMINI_API_KEY", "")
ELEVENLABS_API_KEY  = os.getenv("ELEVENLABS_API_KEY", "")

# ── Wake Word ─────────────────────────────────────────────────────────────────
# Zen activates when it hears this word (alongside clap detection)
WAKE_WORD = "zen"

# ── Monarch System App URL ────────────────────────────────────────────────────
APP_URL = "http://localhost:5173"

# ── ElevenLabs Voice Settings ─────────────────────────────────────────────────
# Voice ID — choose from https://api.elevenlabs.io/v1/voices
# Pre-made voices (FREE on all plans):
#   Adam   (deep, authoritative) : pNInz6obpgDQGcFmaJgB  ← default (free)
#   Antoni (warm, clear)         : ErXwobaYiN019PkySvjV  (free)
#   Sam    (strong, clear)       : yoZ06aMxZJJ28mfd3POQ  (free)
# Library voices (require Creator+ plan):
#   Josh   (deep, natural)       : TxGEqnHWrfWFTfGW9XjX
#   Arnold (crisp, strong)       : VR6AewLTigWG4xSOukaG
ELEVENLABS_VOICE_ID = "pNInz6obpgDQGcFmaJgB"   # Adam — deep & authoritative (free tier)

# ElevenLabs model:
#   eleven_turbo_v2_5  → fastest (best for real-time voice assistant)
#   eleven_multilingual_v2 → best quality, slightly slower
ELEVENLABS_MODEL = "eleven_turbo_v2_5"

# Voice style & stability (0.0 – 1.0)
ELEVENLABS_STABILITY        = 0.55   # higher = more consistent tone
ELEVENLABS_SIMILARITY       = 0.80   # higher = closer to original voice
ELEVENLABS_STYLE            = 0.30   # adds expressiveness
ELEVENLABS_SPEAKER_BOOST    = True   # improves clarity

# ── Listening Settings ────────────────────────────────────────────────────────
# How long to wait for a command after wake word (seconds)
COMMAND_TIMEOUT = 8
# Max length of a single spoken command (seconds)
COMMAND_PHRASE_LIMIT = 12
# Ambient noise adjustment duration (seconds)
AMBIENT_DURATION = 0.5
# Microphone device index (None = use system default, or integer for specific mic)
MIC_INDEX = None

# ── Gemini Model ──────────────────────────────────────────────────────────────
# Primary model — fastest that's confirmed working on your API key
GEMINI_MODEL = "gemini-2.5-flash"
# Fallback models tried in order if primary hits rate limits / quota errors
GEMINI_MODEL_FALLBACKS = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-flash-latest",
]

# ── Clap-to-Wake Settings ─────────────────────────────────────────────────────
# Enable waking Zen with two claps instead of (or alongside) the wake word
CLAP_WAKE_ENABLED   = True
# RMS energy threshold to count as a "clap" spike.
# Raise this if background noise triggers false claps; lower if claps aren't detected.
CLAP_SENSITIVITY    = 2500
# Maximum milliseconds between the two claps to count as a double-clap
CLAP_WINDOW_MS      = 900
# Minimum milliseconds between claps (prevents single loud noise counting twice)
CLAP_COOLDOWN_MS    = 150

# ── Conversation Window ───────────────────────────────────────────────────────
# After Zen answers, it stays active for this many seconds to hear follow-ups.
# Set to 0 to disable multi-turn and return to wake-word mode immediately.
CONVO_WINDOW_SEC    = 25

# ── Proactive Features ────────────────────────────────────────────────────────
PROACTIVE_ENABLED       = True
# Warn when battery falls below this percentage
BATTERY_WARN_THRESHOLD  = 20
# Pomodoro work duration in minutes (0 to disable auto Pomodoro)
POMODORO_WORK_MIN       = 0

# ── Weather ───────────────────────────────────────────────────────────────────
# City name for weather lookups, or "auto" to detect by IP
WEATHER_LOCATION    = "auto"

# ── Debug Mode ────────────────────────────────────────────────────────────────
DEBUG = True
