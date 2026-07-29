"""Whisper large-v3 loader and transcription, self-hosted.

Model is loaded once at process start and reused across requests —
loading it per-request would add tens of seconds to every assessment.
"""
import glob
import os
import shutil

# whisper shells out to ffmpeg via subprocess; if it's not on PATH (e.g. PATH
# was updated after this process's parent shell started), fall back to the
# winget-installed copy so the service doesn't depend on a terminal restart.
if shutil.which('ffmpeg') is None:
    candidates = glob.glob(os.path.expandvars(
        r'%LOCALAPPDATA%\Microsoft\WinGet\Packages\Gyan.FFmpeg_*\ffmpeg-*\bin'
    ))
    if candidates:
        os.environ['PATH'] += os.pathsep + candidates[0]

import whisper

_MODEL_NAME = os.getenv('WHISPER_MODEL', 'large-v3')
_model = None


def load_model():
    global _model
    if _model is None:
        _model = whisper.load_model(_MODEL_NAME)
    return _model


def transcribe_arabic(audio_path: str) -> str:
    model = load_model()
    result = model.transcribe(audio_path, language='ar')
    return result['text'].strip()
