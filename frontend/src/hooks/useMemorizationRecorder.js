import { useState, useRef, useCallback, useEffect } from 'react';
import { assessmentApi } from '../api/assessmentApi';

export const PHASES = {
  IDLE:       'idle',
  RECORDING:  'recording',
  RECORDED:   'recorded',
  UPLOADING:  'uploading',
  PROCESSING: 'processing',
  COMPLETE:   'complete',
  ERROR:      'error',
};

const POLL_INTERVAL_MS = 2500;

const getAudioMimeType = () => {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
};

export const useMemorizationRecorder = () => {
  const [phase, setPhase]             = useState(PHASES.IDLE);
  const [assessment, setAssessment]   = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const recorderRef  = useRef(null);
  const streamRef    = useRef(null);
  const chunksRef     = useRef([]);
  const audioBlobRef  = useRef(null);
  const pollTimerRef  = useRef(null);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const cleanupStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => () => { cleanupStream(); stopPolling(); }, [cleanupStream, stopPolling]);

  const startRecording = useCallback(async () => {
    setErrorMessage(null);
    chunksRef.current = [];
    audioBlobRef.current = null;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = getAudioMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : {});
      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        audioBlobRef.current = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' });
        cleanupStream();
        setPhase(PHASES.RECORDED);
      };

      recorder.start();
      setPhase(PHASES.RECORDING);
    } catch {
      setPhase(PHASES.ERROR);
      setErrorMessage('Microphone access denied. Please allow microphone access and try again.');
    }
  }, [cleanupStream]);

  const stopRecording = useCallback(() => {
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop();
    }
  }, []);

  const pollAssessment = useCallback((id) => {
    pollTimerRef.current = setTimeout(async () => {
      try {
        const { data } = await assessmentApi.getAssessmentById(id);
        const updated = data.data.assessment;
        if (updated.status === 'completed') {
          setAssessment(updated);
          setPhase(PHASES.COMPLETE);
        } else if (updated.status === 'failed') {
          setAssessment(updated);
          setPhase(PHASES.ERROR);
          setErrorMessage('The AI service could not process this recitation. Please try again.');
        } else {
          pollAssessment(id);
        }
      } catch {
        setPhase(PHASES.ERROR);
        setErrorMessage('Lost connection while checking assessment status.');
      }
    }, POLL_INTERVAL_MS);
  }, []);

  const submit = useCallback(async (surahId, fromVerse, toVerse) => {
    if (!audioBlobRef.current) return;
    setPhase(PHASES.UPLOADING);
    setErrorMessage(null);

    const form = new FormData();
    form.append('audio', audioBlobRef.current, 'recitation.webm');
    form.append('surah_id', surahId);
    form.append('from_verse', String(fromVerse));
    form.append('to_verse', String(toVerse));

    try {
      const { data } = await assessmentApi.submitMemorizationCheck(form);
      setAssessment(data.data.assessment);
      setPhase(PHASES.PROCESSING);
      pollAssessment(data.data.assessment.id);
    } catch (err) {
      setPhase(PHASES.ERROR);
      setErrorMessage(err?.response?.data?.message || 'Failed to submit recitation.');
    }
  }, [pollAssessment]);

  const reset = useCallback(() => {
    cleanupStream();
    stopPolling();
    chunksRef.current = [];
    audioBlobRef.current = null;
    setAssessment(null);
    setErrorMessage(null);
    setPhase(PHASES.IDLE);
  }, [cleanupStream, stopPolling]);

  return {
    phase,
    assessment,
    errorMessage,
    startRecording,
    stopRecording,
    submit,
    reset,
    isIdle:       phase === PHASES.IDLE,
    isRecording:  phase === PHASES.RECORDING,
    isRecorded:   phase === PHASES.RECORDED,
    isBusy:       phase === PHASES.UPLOADING || phase === PHASES.PROCESSING,
    isComplete:   phase === PHASES.COMPLETE,
    isError:      phase === PHASES.ERROR,
  };
};
