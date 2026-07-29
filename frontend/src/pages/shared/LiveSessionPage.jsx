import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, Users,
  Wifi, WifiOff, AlertTriangle, Loader2, Crown, LogOut,
  RefreshCw, ChevronRight, Volume2, Hand, SmilePlus,
  X, ShieldOff
} from 'lucide-react';
import { useAgora }            from '../../hooks/useAgora';
import { useSessionSignaling } from '../../hooks/useSessionSignaling';
import { useAuth }             from '../../context/AuthContext';
import { fetchParticipants }   from '../../api/agoraApi';
import { sessionApi }          from '../../api/sessionApi';
import { attendanceApi }       from '../../api/attendanceApi';

// ─── Remote Video Tile ────────────────────────────────────────────────────────
function RemoteTile({ user, info, isHost, onMuteAudio, onMuteVideo, onKick, handRaised }) {
  const videoRef = useRef(null);
  const hasVideo = Boolean(user.videoTrack);
  const name     = info?.full_name ?? 'Joining…';
  const initial  = name.charAt(0).toUpperCase();
  const infoIsHost = info?.role === 'teacher' || info?.role === 'admin';

  useEffect(() => {
    if (user.videoTrack && videoRef.current) user.videoTrack.play(videoRef.current);
    return () => { if (user.videoTrack) user.videoTrack.stop(); };
  }, [user.videoTrack]);

  useEffect(() => {
    if (user.audioTrack) user.audioTrack.play();
    return () => { if (user.audioTrack) user.audioTrack.stop(); };
  }, [user.audioTrack]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25 }}
      className="relative rounded-xl overflow-hidden bg-[#0d1f1a] aspect-video shadow-lg border border-white/5 group"
    >
      {hasVideo
        ? <div ref={videoRef} className="w-full h-full" />
        : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-emerald-800/60 flex items-center justify-center">
              <span className="text-2xl text-emerald-200 font-semibold">{initial}</span>
            </div>
          </div>
        )
      }

      {/* Name + status bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-1.5 min-w-0">
          {user.audioTrack
            ? <Volume2 size={11} className="text-emerald-400 shrink-0" />
            : <MicOff size={11} className="text-red-400 shrink-0" />
          }
          <span className="text-white text-[11px] font-medium truncate">{name}</span>
          {infoIsHost && <Crown size={10} className="text-amber-400 shrink-0" />}
        </div>
        {handRaised && (
          <span className="text-base leading-none" title="Hand raised">✋</span>
        )}
      </div>

      {/* Host controls — appear on hover */}
      {isHost && !infoIsHost && (
        <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1.5">
          <button
            onClick={() => onMuteAudio(user)}
            title={user.audioTrack ? 'Mute mic' : 'Mic already off'}
            className="text-white/70 hover:text-white transition-colors"
          >
            {user.audioTrack ? <MicOff size={13} /> : <Mic size={13} className="opacity-40" />}
          </button>
          <button
            onClick={() => onMuteVideo(user)}
            title={user.videoTrack ? 'Turn off camera' : 'Camera already off'}
            className="text-white/70 hover:text-white transition-colors"
          >
            {user.videoTrack ? <VideoOff size={13} /> : <Video size={13} className="opacity-40" />}
          </button>
          <div className="w-px h-3 bg-white/20" />
          <button
            onClick={() => onKick(user, info)}
            title="Remove from session"
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            <ShieldOff size={13} />
          </button>
        </div>
      )}
    </motion.div>
  );
}

// ─── Local Video Tile ─────────────────────────────────────────────────────────
function LocalTile({ track, isCameraOff, isMuted, name, isHandRaised }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (track && videoRef.current && !isCameraOff) track.play(videoRef.current);
    return () => { if (track) track.stop(); };
  }, [track, isCameraOff]);

  return (
    <div className="relative rounded-xl overflow-hidden bg-[#0d1f1a] aspect-video border border-white/5">
      {track && !isCameraOff
        ? <div ref={videoRef} className="w-full h-full" />
        : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-emerald-700/50 flex items-center justify-center">
              <span className="text-xl text-emerald-200 font-semibold">
                {name?.charAt(0)?.toUpperCase() ?? '?'}
              </span>
            </div>
          </div>
        )
      }
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-3 py-2 flex items-center gap-1.5">
        {isMuted
          ? <MicOff size={11} className="text-red-400" />
          : <Mic size={11} className="text-emerald-400" />
        }
        <span className="text-white text-[11px] font-medium truncate">You</span>
        {isCameraOff && <VideoOff size={11} className="text-red-400 ml-1" />}
        {isHandRaised && (
          <span className="ml-auto text-base leading-none animate-bounce" title="Hand raised">✋</span>
        )}
      </div>
    </div>
  );
}

// ─── Floating Reaction ────────────────────────────────────────────────────────
function FloatingReaction({ reaction }) {
  return (
    <motion.div
      key={reaction.id}
      initial={{ opacity: 0, y: 0, x: Math.random() * 40 - 20 }}
      animate={{ opacity: 1, y: -80 }}
      exit={{ opacity: 0, y: -120 }}
      transition={{ duration: 2.5, ease: 'easeOut' }}
      className="pointer-events-none absolute bottom-24 right-8 text-3xl select-none"
    >
      {reaction.payload}
    </motion.div>
  );
}

// ─── Connection Overlay ───────────────────────────────────────────────────────
function ConnectionOverlay({ state, error, onRetry, onLeave, states }) {
  if (state === states.CONNECTED) return null;
  const isConnecting    = state === states.CONNECTING;
  const isFailed        = state === states.FAILED;
  const isDisconnecting = state === states.DISCONNECTING;

  return (
    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-[#071410]/90 backdrop-blur-sm">
      {isConnecting && (
        <>
          <Loader2 size={40} className="text-emerald-400 animate-spin mb-4" />
          <p className="text-emerald-100 text-lg font-medium">Joining session…</p>
          <p className="text-emerald-400/70 text-sm mt-1">Establishing secure connection</p>
        </>
      )}
      {isDisconnecting && (
        <>
          <Loader2 size={40} className="text-amber-400 animate-spin mb-4" />
          <p className="text-emerald-100 text-lg font-medium">Leaving session…</p>
        </>
      )}
      {isFailed && (
        <>
          <div className="w-16 h-16 rounded-full bg-red-900/40 flex items-center justify-center mb-4">
            <WifiOff size={28} className="text-red-400" />
          </div>
          <p className="text-white text-lg font-semibold mb-2">Connection Failed</p>
          {error && (
            <p className="text-red-300/80 text-sm text-center max-w-xs mb-6 px-4">{error}</p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onRetry}
              className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              <RefreshCw size={15} /> Try Again
            </button>
            <button
              onClick={onLeave}
              className="flex items-center gap-2 bg-white/10 hover:bg-white/15 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
            >
              Leave
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Control Button ───────────────────────────────────────────────────────────
function ControlBtn({ icon: Icon, label, onClick, danger = false, active = true, pulse = false }) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={`
        flex flex-col items-center gap-1.5 px-4 py-3 rounded-xl transition-all duration-150 select-none relative
        ${danger
          ? 'bg-red-600 hover:bg-red-500 text-white'
          : active
            ? 'bg-white/10 hover:bg-white/20 text-white'
            : 'bg-white/5 hover:bg-white/10 text-white/50'
        }
      `}
    >
      {pulse && (
        <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
      )}
      <Icon size={20} />
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LiveSessionPage() {
  const { id: sessionId } = useParams();
  const navigate          = useNavigate();
  const { user }          = useAuth();

  const [session, setSession]               = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);
  const [sessionError, setSessionError]     = useState(null);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showReactions, setShowReactions]   = useState(false);
  const [endConfirm, setEndConfirm]         = useState(false);
  const [kickConfirm, setKickConfirm]       = useState(null); // { uid, name }
  const [participantMap, setParticipantMap] = useState({});

  // Attendance modal (teacher only)
  const [showAttendance, setShowAttendance] = useState(false);
  const [attendStudents, setAttendStudents] = useState([]);
  const [attendDraft, setAttendDraft]       = useState({});
  const [attendLoading, setAttendLoading]   = useState(false);
  const [attendSaving, setAttendSaving]     = useState({});

  const isTeacher = user?.role === 'teacher';
  const isAdmin   = user?.role === 'admin';
  const isHost    = isTeacher || isAdmin;

  // Set whenever the call is deliberately ended (leave/end/kicked) so the
  // auto-join effect below doesn't try to rejoin once connectionState cycles
  // back to IDLE — without this, leaving after the teacher already ended the
  // session (status flips to 'completed' server-side, but the `session` state
  // here is stale) immediately re-triggers join(), which fails against the
  // now-completed session and leaves the page stuck on a connection error.
  const intentionalExitRef = useRef(false);

  // Fallback destination when there's no browser history to go back to
  // (e.g. the live page was opened directly) — avoids leaving the user
  // stuck on a dead /live route with no way out except switching tabs.
  const exitRoute = isAdmin ? '/admin/sessions' : isTeacher ? '/teacher/sessions' : '/student/sessions';
  const exitToSessions = useCallback(() => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(exitRoute, { replace: true });
  }, [navigate, exitRoute]);

  const {
    connectionState, CONNECTION_STATES,
    localVideoTrack, remoteUsers,
    isMuted, isCameraOff,
    error: agoraError,
    clearError, join, leave, end,
    toggleMute, toggleCamera,
    isConnected,
  } = useAgora(sessionId, user?.role);

  // ── Kicked handler ──────────────────────────────────────────────────────
  const handleKicked = useCallback(async () => {
    intentionalExitRef.current = true;
    await leave();
    exitToSessions();
  }, [leave, exitToSessions]);

  // ── Signaling ───────────────────────────────────────────────────────────
  const {
    handRaises, reactions,
    isHandRaised, raiseHand, lowerHand,
    sendReaction, kickUser, dismissHandRaise,
    REACTIONS,
  } = useSessionSignaling(sessionId, user?.id, user?.role, handleKicked);

  // ── Live attendance helpers ──────────────────────────────────────────────
  const openAttendanceModal = useCallback(async () => {
    setShowAttendance(true);
    setAttendLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const res = await attendanceApi.getSessionAttendance(sessionId, today);
      const students = res.data.data.students || [];
      setAttendStudents(students);
      const draft = {};
      students.forEach((s) => { draft[s.student_id] = s.present ?? false; });
      setAttendDraft(draft);
    } catch {
      // keep modal open, show error inline
    } finally {
      setAttendLoading(false);
    }
  }, [sessionId]);

  const toggleLiveAttendance = async (studentId, present) => {
    setAttendDraft((prev) => ({ ...prev, [studentId]: present }));
    setAttendSaving((prev) => ({ ...prev, [studentId]: true }));
    try {
      await attendanceApi.upsertAttendance(sessionId, studentId, { present });
    } catch {
      // revert on failure
      setAttendDraft((prev) => ({ ...prev, [studentId]: !present }));
    } finally {
      setAttendSaving((prev) => ({ ...prev, [studentId]: false }));
    }
  };

  // ── uidFromUuid — mirrors backend logic ─────────────────────────────────
  const uidFromUuid = (uuid) => {
    const hex = uuid.replace(/-/g, '').slice(-8);
    return (parseInt(hex, 16) >>> 0);
  };

  const refreshParticipantMap = useCallback(async () => {
    try {
      const { data } = await fetchParticipants(sessionId);
      const participants = data.data ?? [];
      const map = {};
      participants.forEach((p) => { map[uidFromUuid(p.id)] = p; });
      if (user?.id) {
        map[uidFromUuid(user.id)] = {
          full_name:  user.full_name,
          role:       user.role,
          avatar_url: user.avatar_url ?? null,
        };
      }
      setParticipantMap(map);
    } catch (err) {
      console.error('Could not load participant info:', err);
    }
  }, [sessionId, user]);

  // ── Load session ────────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const loadSession = async () => {
      const MAX_ATTEMPTS  = 5;
      const RETRY_DELAY   = 1000;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const { data } = await sessionApi.getSessionById(sessionId);
          if (cancelled) return;
          const s = data.data?.session ?? data.data;
          setSession(s);
          if (s?.status === 'live') { setSessionLoading(false); return; }
          if (attempt < MAX_ATTEMPTS) {
            await new Promise((r) => setTimeout(r, RETRY_DELAY));
            if (cancelled) return;
          } else {
            setSessionError('This session is not currently live.');
            setSessionLoading(false);
          }
        } catch (err) {
          if (cancelled) return;
          setSessionError(err?.response?.data?.message || 'Failed to load session details.');
          setSessionLoading(false);
          return;
        }
      }
    };
    loadSession();
    return () => { cancelled = true; };
  }, [sessionId]);

  // ── Auto-join ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (
      session?.status === 'live' &&
      connectionState === CONNECTION_STATES.IDLE &&
      !intentionalExitRef.current
    ) {
      join();
    }
  }, [session, connectionState, CONNECTION_STATES.IDLE, join]);

  // ── Refresh participant map on remote user changes ──────────────────────
  useEffect(() => {
    if (isConnected) refreshParticipantMap();
  }, [remoteUsers, isConnected, refreshParticipantMap]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleLeave = useCallback(async () => {
    intentionalExitRef.current = true;
    await leave();
    exitToSessions();
  }, [leave, exitToSessions]);

  const handleEnd = useCallback(async () => {
    intentionalExitRef.current = true;
    await end();
    exitToSessions();
  }, [end, exitToSessions]);

  const handleRetry = useCallback(() => {
    intentionalExitRef.current = false;
    clearError();
    join();
  }, [clearError, join]);

  const handleMuteAudio = useCallback((remoteUser) => {
    // Mute from host side — we unsubscribe from their audio track locally
    // and send a signal so their own UI reflects it
    if (remoteUser.audioTrack) remoteUser.audioTrack.stop();
    const info = participantMap[remoteUser.uid];
    if (info?.id) kickUser(info.id); // reuse kick signal type for mute isn't ideal —
    // For a proper remote mute we'd need RTM; this is a UI-level local mute only
  }, [participantMap, kickUser]);

  const handleKickConfirm = useCallback(async () => {
    if (!kickConfirm) return;
    await kickUser(kickConfirm.userId);
    setKickConfirm(null);
  }, [kickConfirm, kickUser]);

  // ── Loading / error states ──────────────────────────────────────────────
  if (sessionLoading) {
    return (
      <div className="h-screen bg-[#071410] flex items-center justify-center">
        <Loader2 size={36} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="h-screen bg-[#071410] flex flex-col items-center justify-center gap-4 px-4">
        <div className="w-16 h-16 rounded-full bg-amber-900/30 flex items-center justify-center">
          <AlertTriangle size={28} className="text-amber-400" />
        </div>
        <p className="text-white text-lg font-semibold text-center">{sessionError}</p>
        <button
          onClick={exitToSessions}
          className="text-sm text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
        >
          <LogOut size={14} /> Go back
        </button>
      </div>
    );
  }

  const totalInCall = remoteUsers.length + (isConnected ? 1 : 0);

  const allTiles = [
    { type: 'local', key: 'local' },
    ...remoteUsers.map((u) => ({ type: 'remote', key: u.uid, user: u })),
  ];

  const gridCols =
    allTiles.length === 1 ? 'grid-cols-1 max-w-2xl' :
    allTiles.length <= 4  ? 'grid-cols-2' : 'grid-cols-3';

  return (
    <div className="h-screen bg-[#071410] flex flex-col overflow-hidden font-sans">

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-5 py-3 border-b border-white/5 bg-[#0a1c17]/80 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">Live</span>
          </div>
          <span className="text-white/80 text-sm font-medium truncate max-w-[200px]">
            {session?.title}
          </span>
          {/* Hand raise alert for host */}
          {isHost && handRaises.length > 0 && (
            <div className="flex items-center gap-1.5 bg-amber-500/20 border border-amber-500/30 rounded-full px-2.5 py-1">
              <span className="text-sm">✋</span>
              <span className="text-amber-300 text-xs font-medium">
                {handRaises.length} hand{handRaises.length > 1 ? 's' : ''} raised
              </span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isHost && (
            <button
              onClick={openAttendanceModal}
              className="flex items-center gap-1.5 text-white/70 hover:text-white
                         text-xs bg-white/10 hover:bg-white/15 rounded-lg px-2.5 py-1.5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Attendance
            </button>
          )}
          <button
            onClick={() => setShowParticipants((p) => !p)}
            className="flex items-center gap-1.5 text-white/60 hover:text-white text-xs transition-colors"
          >
            <Users size={15} />
            <span>{totalInCall}</span>
          </button>
          {isConnected && (
            <div className="flex items-center gap-1 text-emerald-400/80 text-xs">
              <Wifi size={13} />
              <span>Connected</span>
            </div>
          )}
        </div>
      </header>

      {/* ── Main area ───────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Video area */}
        <div className="flex-1 relative flex flex-col">
          <ConnectionOverlay
            state={connectionState}
            error={agoraError}
            onRetry={handleRetry}
            onLeave={handleLeave}
            states={CONNECTION_STATES}
          />

          {/* Floating reactions */}
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            <AnimatePresence>
              {reactions.map((r) => <FloatingReaction key={r.id} reaction={r} />)}
            </AnimatePresence>
          </div>

          {/* Video grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className={`grid ${gridCols} gap-3 mx-auto w-full h-full`}>
              <AnimatePresence mode="popLayout">
                {allTiles.map((tile) =>
                  tile.type === 'local' ? (
                    <LocalTile
                      key="local"
                      track={localVideoTrack}
                      isCameraOff={isCameraOff}
                      isMuted={isMuted}
                      name={user?.full_name}
                      isHandRaised={isHandRaised}
                    />
                  ) : (
                    <RemoteTile
                      key={tile.key}
                      user={tile.user}
                      info={participantMap[tile.user.uid]}
                      isHost={isHost}
                      handRaised={handRaises.some((h) => {
                        const p = participantMap[tile.user.uid];
                        return (p?.id && h.user_id === p.id) ||
                               (p?.full_name && h.full_name === p.full_name);
                      })}
                      onMuteAudio={(u) => {
                        const info = participantMap[u.uid];
                        if (info?.id) {
                          // Local mute — stop their audio track on our end
                          if (u.audioTrack) u.audioTrack.stop();
                        }
                      }}
                      onMuteVideo={(u) => {
                        if (u.videoTrack) u.videoTrack.stop();
                      }}
                      onKick={(u, info) => {
                        setKickConfirm({ userId: info?.id, name: info?.full_name ?? 'this user' });
                      }}
                    />
                  )
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ── Controls bar ──────────────────────────────────────────── */}
          <div className="shrink-0 flex items-center justify-center gap-2 py-4 px-6 bg-[#0a1c17]/60 border-t border-white/5 backdrop-blur-sm flex-wrap">
            <ControlBtn
              icon={isMuted ? MicOff : Mic}
              label={isMuted ? 'Unmute' : 'Mute'}
              onClick={toggleMute}
              active={!isMuted}
            />
            <ControlBtn
              icon={isCameraOff ? VideoOff : Video}
              label={isCameraOff ? 'Start Cam' : 'Stop Cam'}
              onClick={toggleCamera}
              active={!isCameraOff}
            />

            {/* Hand raise — students only (hosts don't need to raise hand) */}
            {!isHost && (
              <ControlBtn
                icon={Hand}
                label={isHandRaised ? 'Lower Hand' : 'Raise Hand'}
                onClick={isHandRaised ? lowerHand : raiseHand}
                active={!isHandRaised}
                pulse={isHandRaised}
              />
            )}

            {/* Reactions */}
            <div className="relative">
              <ControlBtn
                icon={SmilePlus}
                label="React"
                onClick={() => setShowReactions((p) => !p)}
              />
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#0f2620] border border-white/10 rounded-2xl px-3 py-2.5 flex gap-2 shadow-xl"
                  >
                    {REACTIONS.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => { sendReaction(emoji); setShowReactions(false); }}
                        className="text-2xl hover:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <ControlBtn
              icon={LogOut}
              label="Leave"
              onClick={handleLeave}
            />

            {isHost && (
              <ControlBtn
                icon={PhoneOff}
                label="End for All"
                onClick={() => setEndConfirm(true)}
                danger
              />
            )}
          </div>
        </div>

        {/* ── Participants panel ─────────────────────────────────────────── */}
        <AnimatePresence>
          {showParticipants && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 270, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              className="bg-[#0a1c17] border-l border-white/5 overflow-hidden shrink-0 flex flex-col"
            >
              <div className="p-4 flex-1 overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white text-sm font-semibold">
                    Participants · {totalInCall}
                  </h3>
                  <button
                    onClick={() => setShowParticipants(false)}
                    className="text-white/40 hover:text-white/70 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>

                {/* Local (you) */}
                <ParticipantRow
                  name={user?.full_name}
                  role={user?.role}
                  avatarUrl={user?.avatar_url}
                  isYou
                  isHost={isHost}
                  handRaised={!isHost && isHandRaised}
                />

                {/* Divider */}
                {remoteUsers.length > 0 && (
                  <div className="border-t border-white/5 my-3" />
                )}

                {remoteUsers.length === 0 && (
                  <p className="text-white/30 text-xs text-center mt-6">
                    No other participants yet
                  </p>
                )}

                {remoteUsers.map((u) => {
                  const info     = participantMap[u.uid];
                  const name     = info?.full_name ?? 'Joining…';
                  const role     = info?.role ?? '';
                  const infoHost = role === 'teacher' || role === 'admin';
                  // Match by user_id (from participantMap) or full_name fallback
                  const raised = handRaises.some(
                    (h) => (info?.id && h.user_id === info.id) ||
                           (info?.full_name && h.full_name === info.full_name)
                  );

                  return (
                    <ParticipantRow
                      key={u.uid}
                      name={name}
                      role={role}
                      avatarUrl={info?.avatar_url}
                      isHost={infoHost}
                      hasMic={Boolean(u.audioTrack)}
                      hasVideo={Boolean(u.videoTrack)}
                      handRaised={raised}
                      showHostControls={isHost && !infoHost}
                      onDismissHand={() => info?.id && dismissHandRaise(info.id)}
                      onKick={() => setKickConfirm({ userId: info?.id, name })}
                    />
                  );
                })}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── End session modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {endConfirm && (
          <ConfirmModal
            icon={<PhoneOff size={18} className="text-red-400" />}
            iconBg="bg-red-900/40"
            title="End Session?"
            description="This will disconnect all participants."
            confirmLabel="End for Everyone"
            confirmClass="bg-red-600 hover:bg-red-500"
            onCancel={() => setEndConfirm(false)}
            onConfirm={handleEnd}
          />
        )}
      </AnimatePresence>

      {/* ── Kick confirm modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {kickConfirm && (
          <ConfirmModal
            icon={<ShieldOff size={18} className="text-red-400" />}
            iconBg="bg-red-900/40"
            title="Remove Participant?"
            description={`${kickConfirm.name} will be removed from the session.`}
            confirmLabel="Remove"
            confirmClass="bg-red-600 hover:bg-red-500"
            onCancel={() => setKickConfirm(null)}
            onConfirm={handleKickConfirm}
          />
        )}
      </AnimatePresence>

      {/* ── Live attendance modal (teacher only) ─────────────────────────── */}
      <AnimatePresence>
        {showAttendance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
            onClick={() => setShowAttendance(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 16 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-[#0f2820] border border-white/10 rounded-2xl p-5 w-full max-w-sm shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <p className="text-white font-semibold">Mark Attendance</p>
                <button onClick={() => setShowAttendance(false)} className="text-white/40 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>

              {attendLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 size={24} className="text-emerald-400 animate-spin" />
                </div>
              ) : attendStudents.length === 0 ? (
                <p className="text-white/50 text-sm text-center py-4">No approved students enrolled.</p>
              ) : (
                <div className="space-y-2">
                  {attendStudents.map((s) => {
                    const isPresent = attendDraft[s.student_id] ?? false;
                    const saving    = attendSaving[s.student_id] ?? false;
                    return (
                      <div key={s.student_id}
                           className="flex items-center justify-between px-3 py-2.5
                                      bg-white/5 rounded-xl">
                        <p className="text-sm text-white/80 truncate flex-1">{s.full_name}</p>
                        <button
                          disabled={saving}
                          onClick={() => toggleLiveAttendance(s.student_id, !isPresent)}
                          className={`ml-3 flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors
                            ${saving ? 'opacity-50 cursor-wait' :
                              isPresent
                                ? 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
                                : 'bg-white/10 hover:bg-white/20 text-white/60'}`}
                        >
                          {saving ? '…' : isPresent ? '✓ Present' : 'Absent'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Participant Row ──────────────────────────────────────────────────────────
function ParticipantRow({
  name, role, avatarUrl, isYou, isHost,
  hasMic, hasVideo, handRaised,
  showHostControls, onDismissHand, onKick,
}) {
  const initial = name?.charAt(0)?.toUpperCase() ?? '?';
  const roleColors = {
    teacher: 'text-amber-400/80',
    admin:   'text-purple-400/80',
    student: 'text-emerald-400/70',
  };

  return (
    <div className={`flex items-center gap-2.5 mb-1.5 px-2 py-2 rounded-lg transition-colors ${isYou ? 'bg-white/5' : 'hover:bg-white/5'}`}>
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full bg-emerald-800/50 flex items-center justify-center shrink-0 overflow-hidden">
        {avatarUrl
          ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          : <span className="text-xs text-white font-semibold">{initial}</span>
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <p className="text-white text-xs font-medium truncate">{name}</p>
          {isYou && <span className="text-white/30 text-[10px]">· You</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <p className={`text-[10px] capitalize ${roleColors[role] ?? 'text-white/30'}`}>{role}</p>
          {handRaised && (
            <span className="text-xs leading-none" title="Hand raised">✋</span>
          )}
        </div>
      </div>

      {/* Status + controls */}
      <div className="flex items-center gap-1.5 shrink-0">
        {hasMic !== undefined && (
          hasMic
            ? <Mic size={11} className="text-emerald-400" />
            : <MicOff size={11} className="text-red-400/70" />
        )}
        {isHost && <Crown size={11} className="text-amber-400" />}

        {showHostControls && (
          <>
            {handRaised && (
              <button
                onClick={onDismissHand}
                title="Dismiss hand raise"
                className="text-white/40 hover:text-white/80 transition-colors ml-1"
              >
                <X size={11} />
              </button>
            )}
            <button
            
              onClick={onKick}
              title="Remove from session"
              className="text-red-400/60 hover:text-red-400 transition-colors"
            >
              <ShieldOff size={11} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────
function ConfirmModal({ icon, iconBg, title, description, confirmLabel, confirmClass, onCancel, onConfirm }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.18 }}
        className="bg-[#0f2620] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg}`}>
            {icon}
          </div>
          <div>
            <h3 className="text-white font-semibold text-base">{title}</h3>
            <p className="text-white/50 text-xs mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg bg-white/8 hover:bg-white/12 text-white/80 text-sm font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${confirmClass}`}
          >
            {confirmLabel}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}