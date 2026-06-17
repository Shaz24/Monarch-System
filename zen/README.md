# Zen — AI Voice Assistant

> Your personal AI voice assistant for the **Monarch System**.  
> Say **"Zen"** — it listens, it responds, it boots your app.

---

## Quick Start (Windows PC)

### Step 1 — Install Python
Make sure Python 3.10+ is installed: https://python.org/downloads  
Check: `python --version`

### Step 2 — Install dependencies

Open a terminal in the `zen/` folder:

```bash
pip install -r requirements.txt
```

> **PyAudio** (for mic access) sometimes needs a special install on Windows:
> ```bash
> pip install pipwin
> pipwin install pyaudio
> ```

### Step 3 — Set your Gemini API key

1. Go to https://aistudio.google.com/app/apikey → **Create API Key** (free)
2. Copy the key (`AIza...`)
3. In the `zen/` folder, create a file called `.env`:
   ```
   GEMINI_API_KEY=AIzaYOUR_KEY_HERE
   ```
   Or just open `config.py` and paste it directly.

### Step 4 — Run Zen

```bash
cd zen
python zen.py
```

You'll hear: *"Zen online. Say Zen to activate."*

---

## Voice Commands

| What you say | What Zen does |
|---|---|
| **"Zen"** | Activates — ready for your command |
| **"Open Monarch"** / **"Boot the app"** | Opens Monarch System in browser |
| **"Go to fitness"** | Navigates to `/fitness` |
| **"Open dashboard"** | Navigates to `/dashboard` |
| **"Go to boss mode"** | Navigates to `/boss-mode` |
| **"Open quest board"** | Navigates to `/todo` |
| **"What time is it?"** | Speaks current time |
| **"What day is today?"** | Speaks current date |
| **"Motivate me"** | Gemini AI motivates you |
| **"Status"** | Confirms Zen is online |
| **"Help"** | Lists what Zen can do |
| **"Shutdown"** / **"Goodbye"** | Zen goes offline |
| **Anything else** | Answered by Gemini AI |

### All navigable pages:
Dashboard, Schedule, Todo, Fitness, Mind, Coding, Creator, Boss Mode, Analytics, Profile, Antigravity

---

## Hardware Build — Make a Real Zen Device

Turn Zen into a physical device you plug in and talk to — like a personal Alexa.

### What you need

| Part | Description | Approx. Cost |
|---|---|---|
| Raspberry Pi 4 (2GB) | The brain | ~$35 |
| MicroSD card (16GB+) | OS storage | ~$8 |
| USB Microphone | "Kinobo Mini USB Mic" or any USB mic | ~$8 |
| Speaker with 3.5mm | Any USB or 3.5mm powered speaker | ~$12 |
| USB-C power supply (5V/3A) | Pi power | ~$8 |
| **Optional:** WS2812B LED ring | Status light (blue = listening, green = speaking) | ~$7 |
| **Optional:** 3D printed case | Custom enclosure | Free to design |
| **Total** | | **~$65–80** |

---

### Raspberry Pi Setup

#### 1. Flash the OS
Download **Raspberry Pi Imager** → flash **Raspberry Pi OS Lite (64-bit)** to your SD card.  
Enable SSH and WiFi during setup.

#### 2. SSH in and install dependencies

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip portaudio19-dev espeak -y
pip3 install -r requirements.txt
```

> On Pi, TTS uses `espeak` instead of pyttsx3 if you prefer. pyttsx3 also works.

#### 3. Set your mic as default input

```bash
arecord -l    # list audio devices, note your USB mic card number
```

Add to `~/.asoundrc`:
```
defaults.pcm.card 1       # replace 1 with your mic card number
defaults.ctl.card 1
```

Test: `arecord -d 3 test.wav && aplay test.wav`

#### 4. Copy the zen folder to the Pi

```bash
scp -r ./zen pi@your-pi-ip:~/zen
```

#### 5. Run Zen on the Pi

```bash
cd ~/zen
python3 zen.py
```

---

### Auto-Start on Boot (Raspberry Pi)

Make Zen start automatically every time the Pi powers on:

```bash
sudo nano /etc/systemd/system/zen.service
```

Paste:
```ini
[Unit]
Description=Zen Voice Assistant
After=network.target sound.target

[Service]
ExecStart=/usr/bin/python3 /home/pi/zen/zen.py
WorkingDirectory=/home/pi/zen
StandardOutput=append:/home/pi/zen/zen.log
StandardError=append:/home/pi/zen/zen.log
Restart=always
RestartSec=5
User=pi
Environment=DISPLAY=:0

[Install]
WantedBy=multi-user.target
```

Enable it:
```bash
sudo systemctl daemon-reload
sudo systemctl enable zen.service
sudo systemctl start zen.service
```

Now Zen boots with the Pi automatically. Just plug it in.

---

### Optional: LED Status Ring (WS2812B)

Wire a WS2812B LED ring to GPIO pin 18 (PWM) for visual feedback:

```
Pi GPIO 18  →  Data In (LED ring)
Pi 5V       →  5V (LED ring)
Pi GND      →  GND (LED ring)
```

Add to `zen.py` (Raspberry Pi only):
```python
import board
import neopixel

pixels = neopixel.NeoPixel(board.D18, 12)  # 12 = number of LEDs

def set_led(color):
    pixels.fill(color)
    pixels.show()

# In _activate():   set_led((0, 0, 255))   # Blue = listening
# In _speak():      set_led((0, 255, 0))   # Green = speaking
# In idle:          set_led((0, 0, 0))     # Off = sleeping
```

Install: `pip3 install adafruit-circuitpython-neopixel`

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `PyAudio` install fails | `pip install pipwin && pipwin install pyaudio` (Windows) |
| Mic not detected | Check Device Manager → USB audio device. Set as default input in Windows sound settings. |
| "No module named speech_recognition" | `pip install speechrecognition` |
| Zen can't hear wake word | Increase mic volume in Windows Sound settings → Recording devices |
| Gemini not responding | Check your `.env` or `config.py` API key. Test with `python -c "import google.genai as g; client = g.Client(api_key='YOUR_KEY'); print(client.models.generate_content(model='gemini-2.0-flash', contents='hi').text)"` |
| App doesn't open | Make sure `npm run dev` is running. Check `APP_URL` in `config.py` |

---

## File Structure

```
zen/
├── zen.py           ← Main assistant script (run this)
├── config.py        ← All settings (API key, wake word, voice, etc.)
├── .env             ← Your secret API key (create this, never commit)
├── .env.example     ← Template for .env
├── requirements.txt ← Python dependencies
└── README.md        ← This file
```

---

## Upgrading Zen

### Add a new voice command

In `zen.py`, inside `_handle()`, add before the AI fallback:

```python
if "set timer" in command:
    # extract minutes from command...
    return "Timer set."
```

### Add a new navigation route

In `ROUTES` at the top of `zen.py`:

```python
"my page": "/my-custom-route",
```

---

*Built for the Monarch System. Stay sharp.*
