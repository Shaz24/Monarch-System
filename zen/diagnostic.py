# -*- coding: utf-8 -*-
"""
Zen Audio Diagnostic Script
Use this to check if your microphone is working and what Google STT hears.
Usage: python diagnostic.py
"""

import sys
import time

try:
    import speech_recognition as sr
    import pyaudio
except ImportError:
    sys.exit("[ERROR] Run: pip install speechrecognition pyaudio")

def main():
    print("=" * 60)
    print("           ZEN ASSISTANT AUDIO DIAGNOSTIC TOOL")
    print("=" * 60)
    
    # 1. List Microphones
    print("\n1. Listing available microphone devices:")
    mic_names = sr.Microphone.list_microphone_names()
    for idx, name in enumerate(mic_names):
        print(f"   [{idx}] {name}")
        
    print("\nSelect the index of your active physical microphone.")
    print("For example, 'Microphone Array (Realtek(R) Audio)' or similar.")
    user_input = input("Enter device index to test (or press Enter for default): ").strip()
    
    device_idx = None
    if user_input.isdigit():
        device_idx = int(user_input)
        print(f"\nUsing Microphone index [{device_idx}]: {mic_names[device_idx]}")
    else:
        print(f"\nUsing Default Microphone.")
    
    r = sr.Recognizer()
    r.dynamic_energy_threshold = False
    
    try:
        with sr.Microphone(device_index=device_idx) as source:
            print("\n2. Calibrating ambient noise (2 seconds)... Stay quiet!")
            r.adjust_for_ambient_noise(source, duration=2)
            print(f"   Ambient calibration complete.")
            print(f"   Recommended Energy Threshold: {r.energy_threshold:.1f}")
            
            # Use a sensible minimum
            r.energy_threshold = max(r.energy_threshold, 150)
            print(f"   Final Energy Threshold set to: {r.energy_threshold:.1f}")
            
            print("\n3. Listening test (5 seconds)...")
            print("   --> SAY SOMETHING NOW (e.g. 'Zen open Monarch' or 'Hey Zen')!")
            
            try:
                audio = r.listen(source, timeout=5, phrase_time_limit=6)
                print("\n4. Audio captured! Sending to Google STT for transcription...")
                
                try:
                    text = r.recognize_google(audio)
                    print(f"\n   SUCCESS! Google STT heard:")
                    print(f"   >> \"{text}\" <<")
                    
                    # Check for wake word
                    text_lower = text.lower()
                    if "zen" in text_lower:
                        print("\n   [RESULT] Wake word 'Zen' detected successfully!")
                    else:
                        print("\n   [RESULT] Wake word 'Zen' NOT detected in transcript.")
                        print("   Common homophones: if you heard 'then', 'them', or 'send', we can add leniency.")
                        
                except sr.UnknownValueError:
                    print("\n   [STT ERROR] Google STT could not understand the audio.")
                    print("   Try speaking closer to the mic or increasing mic input volume.")
                except sr.RequestError as e:
                    print(f"\n   [STT ERROR] Google request failed: {e}")
                    
            except sr.WaitTimeoutError:
                print("\n   [TIMEOUT] No audio detected during the 5-second window.")
                print("   Is your microphone muted or volume too low?")
                
    except Exception as e:
        print(f"\n[FATAL ERROR] Could not open microphone: {e}")
        print("Please check Windows privacy settings to ensure apps are allowed to access your microphone.")

if __name__ == "__main__":
    main()
