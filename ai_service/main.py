"""AI Recitation Memorization-Checker microservice.

Scope: memorization verification only — did the student say the right
words in the right order. NOT Tajweed, Makharij, or pronunciation grading.

Internal service. Must be called only from the Node backend and must
never be reachable from the public internet or the frontend directly.
"""
import os
import tempfile

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, File, Form, HTTPException, UploadFile

from db import get_reference_text
from normalize import tokenize
from align import align_words, score_alignment
from transcribe import transcribe_arabic, load_model

app = FastAPI(title='Tahfeez Memorization-Checker')

MAX_AUDIO_BYTES = 25 * 1024 * 1024  # 25MB


@app.on_event('startup')
def warm_up():
    load_model()


@app.post('/assess')
async def assess(
    audio: UploadFile = File(...),
    surah_id: str = Form(...),
    from_verse: int = Form(...),
    to_verse: int = Form(...),
):
    if from_verse < 1 or to_verse < from_verse:
        raise HTTPException(status_code=400, detail='Invalid verse range')

    audio_bytes = await audio.read()
    if not audio_bytes:
        raise HTTPException(status_code=400, detail='Empty audio file')
    if len(audio_bytes) > MAX_AUDIO_BYTES:
        raise HTTPException(status_code=400, detail='Audio file too large')

    reference_text = get_reference_text(surah_id, from_verse, to_verse)
    if not reference_text:
        raise HTTPException(status_code=404, detail='No verses found for that range')

    suffix = os.path.splitext(audio.filename or '')[1] or '.webm'
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        tmp.write(audio_bytes)
        tmp_path = tmp.name

    try:
        transcribed_text = transcribe_arabic(tmp_path)
    finally:
        os.remove(tmp_path)

    reference_words = tokenize(reference_text)
    hypothesis_words = tokenize(transcribed_text) if transcribed_text else []

    words = align_words(reference_words, hypothesis_words)
    overall_score = score_alignment(words, len(reference_words))

    return {
        'overall_score': overall_score,
        'reference_text': reference_text,
        'transcribed_text': transcribed_text,
        'words': words,
    }
