import { useState, useEffect, useRef, useCallback } from 'react';
import { sendSignal, fetchSignals, clearHandRaise } from '../api/agoraApi';

const POLL_INTERVAL_MS = 3000;

const REACTIONS = ['👍', '❤️', '🤲', '😊', '⭐'];

export function useSessionSignaling(sessionId, userId, userRole, onKicked) {
  const [handRaises, setHandRaises]       = useState([]);  // [{ user_id, full_name }]
  const [reactions, setReactions]         = useState([]);  // [{ id, user_id, full_name, payload }] — ephemeral
  const [isHandRaised, setIsHandRaised]   = useState(false);
  const lastPollTime                      = useRef(new Date().toISOString());
  const pollRef                           = useRef(null);
  const isHost = userRole === 'teacher' || userRole === 'admin';

  const poll = useCallback(async () => {
    try {
      const { data } = await fetchSignals(sessionId, lastPollTime.current);
      lastPollTime.current = data.data.server_time;

      setHandRaises(data.data.hand_raises ?? []);

      // Append new reactions, then auto-clear them after 3s
      const newReactions = (data.data.reactions ?? []).map((r) => ({
        ...r,
        id: `${r.user_id}-${r.created_at}`,
      }));

      if (newReactions.length > 0) {
        setReactions((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const fresh = newReactions.filter((r) => !existingIds.has(r.id));
          return [...prev, ...fresh];
        });

        // Remove each reaction from display after 3 seconds
        newReactions.forEach((r) => {
          setTimeout(() => {
            setReactions((prev) => prev.filter((x) => x.id !== r.id));
          }, 3000);
        });
      }

      // Handle kick
      if (data.data.kicked) {
        onKicked?.();
      }
    } catch {
      // Polling errors are non-fatal — just wait for the next cycle
    }
  }, [sessionId, onKicked]);

  // Start polling when the hook mounts, stop on unmount
  useEffect(() => {
    poll(); // immediate first poll
    pollRef.current = setInterval(poll, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [poll]);

  const raiseHand = useCallback(async () => {
    try {
      await sendSignal(sessionId, 'hand', 'raised');
      setIsHandRaised(true);
    } catch (err) {
      console.error('Failed to raise hand:', err);
    }
  }, [sessionId]);

  const lowerHand = useCallback(async () => {
    try {
      await sendSignal(sessionId, 'hand', 'lowered');
      setIsHandRaised(false);
    } catch (err) {
      console.error('Failed to lower hand:', err);
    }
  }, [sessionId]);

  const sendReaction = useCallback(async (emoji) => {
    try {
      await sendSignal(sessionId, 'reaction', emoji);
    } catch (err) {
      console.error('Failed to send reaction:', err);
    }
  }, [sessionId]);

  const kickUser = useCallback(async (targetUserId) => {
    if (!isHost) return;
    try {
      await sendSignal(sessionId, 'kick', targetUserId);
    } catch (err) {
      console.error('Failed to kick user:', err);
    }
  }, [sessionId, isHost]);

  const dismissHandRaise = useCallback(async (targetUserId) => {
    if (!isHost) return;
    try {
      await clearHandRaise(sessionId, targetUserId);
      setHandRaises((prev) => prev.filter((h) => h.user_id !== targetUserId));
    } catch (err) {
      console.error('Failed to clear hand raise:', err);
    }
  }, [sessionId, isHost]);

  return {
    handRaises,
    reactions,
    isHandRaised,
    raiseHand,
    lowerHand,
    sendReaction,
    kickUser,
    dismissHandRaise,
    REACTIONS,
  };
}