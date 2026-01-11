#!/usr/bin/env python3
"""Generate voice samples for comparison"""
import json
from pathlib import Path

# Get sample text
with open('data/kidsStories.json') as f:
    stories = json.load(f)
adam_scene = stories[0]['scenes'][0]['text']
print(f"Sample text ({len(adam_scene)} chars):")
print(adam_scene)
print()

# F5-TTS sample at 0.65 speed
print("Generating F5-TTS sample at 0.65 speed...")
from f5_tts.api import F5TTS
from pydub import AudioSegment
import tempfile
import os

tts = F5TTS()
ref_wav = "scripts/tts/kids_voice_reference.wav"
ref_text = open("scripts/tts/kids_voice_reference.txt").read().strip()

with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
    tmp_path = tmp.name

tts.infer(
    ref_file=ref_wav,
    ref_text=ref_text,
    gen_text=adam_scene,
    file_wave=tmp_path,
    speed=0.65
)

# Convert to MP3
audio = AudioSegment.from_wav(tmp_path)
output = Path("scripts/tts/voice_samples/f5tts_speed065.mp3")
audio.export(str(output), format="mp3", bitrate="128k")
os.unlink(tmp_path)

duration = len(audio) / 1000
print(f"Generated: {output.name} ({duration:.1f}s)")
