import { useState, useEffect, useRef, useCallback } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { requestAgoraToken, leaveSession, endSession } from '../api/agoraApi';

const CONNECTION_STATES = {
  IDLE: 'idle',
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTING: 'disconnecting',
  FAILED: 'failed',
};

export function useAgora(sessionId, userRole) {
  const clientRef      = useRef(null);
  const localTracksRef = useRef({ audio: null, video: null });
  const joinStartTime  = useRef(null);
  const isCleaningUp   = useRef(false);
  const isJoining      = useRef(false); // hard lock — prevents concurrent join attempts

  const remoteUsersRef = useRef([]);

  const [connectionState, setConnectionState] = useState(CONNECTION_STATES.IDLE);
  const [localVideoTrack, setLocalVideoTrack] = useState(null);
  const [remoteUsers, setRemoteUsers]         = useState([]);
  const [isMuted, setIsMuted]                 = useState(false);
  const [isCameraOff, setIsCameraOff]         = useState(false);
  const [error, setError]                     = useState(null);

  const updateRemoteUsers = useCallback((updater) => {
    remoteUsersRef.current = updater(remoteUsersRef.current);
    setRemoteUsers([...remoteUsersRef.current]);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setConnectionState(CONNECTION_STATES.IDLE);
  }, []);

  const onUserPublished  = useRef(null);
  const onUserUnpublished = useRef(null);
  const onUserLeft       = useRef(null);

  useEffect(() => {
    onUserPublished.current = async (user, mediaType) => {
      if (!clientRef.current) return;
      try {
        await clientRef.current.subscribe(user, mediaType);
        updateRemoteUsers((prev) => {
          const exists = prev.find((u) => u.uid === user.uid);
          return exists
            ? prev.map((u) => (u.uid === user.uid ? user : u))
            : [...prev, user];
        });
      } catch (err) {
        console.error('Failed to subscribe to user:', err);
      }
    };
    onUserUnpublished.current = (user) => {
      updateRemoteUsers((prev) => prev.map((u) => (u.uid === user.uid ? user : u)));
    };
    onUserLeft.current = (user) => {
      updateRemoteUsers((prev) => prev.filter((u) => u.uid !== user.uid));
    };
  }, [updateRemoteUsers]);

  const destroyClient = useCallback(async () => {
    isCleaningUp.current = true;

    const { audio, video } = localTracksRef.current;
    if (audio) { try { audio.stop(); audio.close(); } catch {} }
    if (video) { try { video.stop(); video.close(); } catch {} }
    localTracksRef.current = { audio: null, video: null };
    setLocalVideoTrack(null);

    if (clientRef.current) {
      clientRef.current.removeAllListeners();
      try { await clientRef.current.leave(); } catch {}
      clientRef.current = null;
    }

    remoteUsersRef.current = [];
    setRemoteUsers([]);
    isCleaningUp.current = false;
  }, []);

  const join = useCallback(async () => {
    if (connectionState !== CONNECTION_STATES.IDLE) return;
    if (isCleaningUp.current) return;
    if (isJoining.current) return;

    isJoining.current = true;
    setError(null);
    setConnectionState(CONNECTION_STATES.CONNECTING);

    try {
      const { data } = await requestAgoraToken(sessionId);
      const { token, uid, channelName, appId } = data.data;

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      client.on('user-published',          (user, mt) => onUserPublished.current?.(user, mt));
      client.on('user-unpublished',        (user)     => onUserUnpublished.current?.(user));
      client.on('user-left',               (user)     => onUserLeft.current?.(user));
      client.on('connection-state-change', (state)    => {
        if (state === 'DISCONNECTED') setConnectionState(CONNECTION_STATES.IDLE);
        if (state === 'FAILED') {
          setConnectionState(CONNECTION_STATES.FAILED);
          setError('Connection failed. Please check your network and try again.');
        }
      });

      await client.join(appId, channelName, token, uid);
      joinStartTime.current = Date.now();

      // Try camera + mic; fall back to audio-only if the camera is unavailable
      let audioTrack = null;
      let videoTrack = null;
      try {
        [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks(
          { encoderConfig: 'speech_standard' },
          { encoderConfig: '480p_1' }
        );
      } catch {
        // Camera in use or not found — audio only
        try {
          audioTrack = await AgoraRTC.createMicrophoneAudioTrack({ encoderConfig: 'speech_standard' });
        } catch (micErr) {
          // No mic either — leave and surface the error
          await client.leave();
          throw new Error('Could not access microphone or camera. Please check your device permissions.');
        }
      }

      localTracksRef.current = { audio: audioTrack, video: videoTrack };
      if (videoTrack) setLocalVideoTrack(videoTrack);

      const tracksToPublish = [audioTrack, videoTrack].filter(Boolean);
      await client.publish(tracksToPublish);

      setConnectionState(CONNECTION_STATES.CONNECTED);
    } catch (err) {
      // OPERATION_ABORTED means a leave/destroy was called while joining —
      // silently reset so the user can retry without seeing a confusing error.
      const isAborted =
        err?.code === 'OPERATION_ABORTED' ||
        String(err?.message || '').includes('OPERATION_ABORTED');

      if (isAborted) {
        setConnectionState(CONNECTION_STATES.IDLE);
      } else {
        await destroyClient();
        setConnectionState(CONNECTION_STATES.FAILED);
        setError(err?.response?.data?.message || err?.message || 'Failed to join session');
      }
    } finally {
      isJoining.current = false;
    }
  }, [sessionId, connectionState, destroyClient]);

  const leave = useCallback(async () => {
    if (!clientRef.current) return;
    setConnectionState(CONNECTION_STATES.DISCONNECTING);

    const durationSeconds = joinStartTime.current
      ? Math.floor((Date.now() - joinStartTime.current) / 1000)
      : 0;

    await destroyClient();

    try {
      await leaveSession(sessionId, durationSeconds);
    } catch (err) {
      console.error('Failed to notify backend of leave:', err);
    } finally {
      joinStartTime.current = null;
      setConnectionState(CONNECTION_STATES.IDLE);
    }
  }, [sessionId, destroyClient]);

  const end = useCallback(async () => {
    if (!clientRef.current) return;
    setConnectionState(CONNECTION_STATES.DISCONNECTING);

    await destroyClient();

    try {
      await endSession(sessionId);
    } catch (err) {
      console.error('Failed to end session on backend:', err);
    } finally {
      setConnectionState(CONNECTION_STATES.IDLE);
    }
  }, [sessionId, destroyClient]);

  const toggleMute = useCallback(async () => {
    const { audio } = localTracksRef.current;
    if (!audio) return;
    await audio.setEnabled(isMuted);
    setIsMuted((prev) => !prev);
  }, [isMuted]);

  const toggleCamera = useCallback(async () => {
    const { video } = localTracksRef.current;
    if (!video) return;
    await video.setEnabled(isCameraOff);
    setIsCameraOff((prev) => !prev);
  }, [isCameraOff]);

  useEffect(() => {
    return () => { destroyClient().catch(() => {}); };
  }, [destroyClient]);

  return {
    connectionState,
    CONNECTION_STATES,
    localVideoTrack,
    remoteUsers,
    isMuted,
    isCameraOff,
    error,
    clearError,
    join,
    leave,
    end,
    toggleMute,
    toggleCamera,
    isConnected:  connectionState === CONNECTION_STATES.CONNECTED,
    isConnecting: connectionState === CONNECTION_STATES.CONNECTING,
  };
}
