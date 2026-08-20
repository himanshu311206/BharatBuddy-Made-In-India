import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import { wsService } from '../services/websocket';
import UserAvatar from '../components/UserAvatar';
import UserProfileModal from '../components/UserProfileModal';
import { ReportModal, BlockModal } from '../components/Modals';

const quickIcebreakers = [
  'Namaste! What is your favorite food from your city? 🍛',
  'Hey buddy! What are you currently learning? 💻',
  'Hello! Have you traveled anywhere fun recently in India? ✈️',
  'Chai or Coffee? Let’s settle this! ☕',
];

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [connections, setConnections] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [actionNotice, setActionNotice] = useState('');

  // WebRTC Call States
  const [callStatus, setCallStatus] = useState('IDLE'); // IDLE, CALLING, INCOMING, CONNECTED
  const [callType, setCallType] = useState('audio'); // audio or video
  const [pendingOffer, setPendingOffer] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  // Modals
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [reportUserTarget, setReportUserTarget] = useState(null);
  const [blockUserTarget, setBlockUserTarget] = useState(null);

  const messagesEndRef = useRef(null);
  const queryMatchId = searchParams.get('matchId');

  // Connect to STOMP WebSocket on page load
  useEffect(() => {
    wsService.connect(
      () => setWsConnected(true),
      () => setWsConnected(false)
    );

    return () => {};
  }, []);

  const loadConnections = async () => {
    try {
      const { data } = await api.get('/matches');
      const list = data.data || [];
      setConnections(list);
      if (list.length > 0) {
        if (queryMatchId) {
          const match = list.find((m) => String(m.id) === String(queryMatchId));
          setSelectedMatch(match || list[0]);
        } else if (!selectedMatch) {
          setSelectedMatch(list[0]);
        }
      }
    } catch {
      setConnections([]);
    }
  };

  useEffect(() => {
    loadConnections();
  }, [queryMatchId]);

  // Load messages and subscribe to STOMP topic for current match
  useEffect(() => {
    if (!selectedMatch) return;

    let unsubscribe = null;

    const fetchAndSubscribe = async () => {
      setLoadingMessages(true);
      try {
        const { data } = await api.get(`/messages/${selectedMatch.id}`);
        setMessages(data.data || []);
      } catch {
        setMessages([]);
      } finally {
        setLoadingMessages(false);
      }

      // Subscribe to real-time STOMP topic: /topic/matches/{matchId}
      unsubscribe = wsService.subscribe(`/topic/matches/${selectedMatch.id}`, async (incomingMsg) => {
        if (!incomingMsg) return;

        // Handle WebRTC Call Signal
        if (incomingMsg.isCallSignal) {
          if (incomingMsg.senderId === user?.id) return; // Skip self

          if (incomingMsg.signalType === 'CALL_OFFER') {
            setCallType(incomingMsg.callType || 'audio');
            setPendingOffer(incomingMsg.offer);
            setCallStatus('INCOMING');
          } else if (incomingMsg.signalType === 'CALL_ANSWER') {
            if (pcRef.current) {
              try {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(incomingMsg.answer));
                setCallStatus('CONNECTED');
              } catch (e) {
                console.error('Failed to set remote answer:', e);
              }
            }
          } else if (incomingMsg.signalType === 'ICE_CANDIDATE') {
            if (pcRef.current && incomingMsg.candidate) {
              try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(incomingMsg.candidate));
              } catch (e) {
                console.error('Failed to add ICE candidate:', e);
              }
            }
          } else if (incomingMsg.signalType === 'END_CALL' || incomingMsg.signalType === 'REJECT_CALL') {
            cleanupCall();
          }
          return;
        }

        if (incomingMsg.id) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === incomingMsg.id)) return prev;
            return [...prev, incomingMsg];
          });
        }
      });
    };

    fetchAndSubscribe();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [selectedMatch?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // --- WEBRTC CALL HANDLERS ---
  const cleanupCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    setCallStatus('IDLE');
    setPendingOffer(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate && selectedMatch) {
        wsService.send(`/topic/matches/${selectedMatch.id}`, {
          isCallSignal: true,
          signalType: 'ICE_CANDIDATE',
          senderId: user?.id,
          candidate: event.candidate,
        });
      }
    };

    pcRef.current = pc;
    return pc;
  };

  const startCall = async (type) => {
    if (!selectedMatch) return;
    setCallType(type);
    setCallStatus('CALLING');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      wsService.send(`/topic/matches/${selectedMatch.id}`, {
        isCallSignal: true,
        signalType: 'CALL_OFFER',
        senderId: user?.id,
        callType: type,
        offer: offer,
      });
    } catch (err) {
      console.error('Error starting call:', err);
      setActionNotice('Microphone / Camera access required to place calls.');
      cleanupCall();
    }
  };

  const answerCall = async () => {
    if (!pendingOffer || !selectedMatch) return;
    setCallStatus('CONNECTED');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: callType === 'video',
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      wsService.send(`/topic/matches/${selectedMatch.id}`, {
        isCallSignal: true,
        signalType: 'CALL_ANSWER',
        senderId: user?.id,
        answer: answer,
      });
    } catch (err) {
      console.error('Error answering call:', err);
      setActionNotice('Could not access microphone/camera.');
      cleanupCall();
    }
  };

  const endCall = () => {
    if (selectedMatch) {
      wsService.send(`/topic/matches/${selectedMatch.id}`, {
        isCallSignal: true,
        signalType: 'END_CALL',
        senderId: user?.id,
      });
    }
    cleanupCall();
  };

  const rejectCall = () => {
    if (selectedMatch) {
      wsService.send(`/topic/matches/${selectedMatch.id}`, {
        isCallSignal: true,
        signalType: 'REJECT_CALL',
        senderId: user?.id,
      });
    }
    cleanupCall();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedMatch || sending) return;

    const text = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const { data } = await api.post('/messages', {
        match: { id: selectedMatch.id },
        message: text,
      });

      if (data.data) {
        const savedMsg = data.data;
        setMessages((prev) => {
          if (prev.some((m) => m.id === savedMsg.id)) return prev;
          return [...prev, savedMsg];
        });
      }
    } catch (err) {
      setActionNotice('Failed to send message: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  };

  const handleEndMatch = async () => {
    if (!selectedMatch) return;
    try {
      await api.post(`/matches/${selectedMatch.id}/end`);
      setActionNotice('Match ended.');
      await loadConnections();
      setSelectedMatch((prev) => (prev ? { ...prev, status: 'ENDED' } : null));
    } catch (err) {
      setActionNotice('Could not end match: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleReportSubmit = async (userId, reason) => {
    try {
      await api.post('/reports', {
        reportedUser: { id: userId },
        reason,
      });
      setActionNotice('Report submitted.');
    } catch (err) {
      setActionNotice('Failed to submit report: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleBlockConfirm = async (userId) => {
    try {
      await api.post(`/users/${userId}/block`);
      setActionNotice('User blocked.');
      await loadConnections();
      setSelectedMatch(null);
    } catch (err) {
      setActionNotice('Failed to block user: ' + (err?.response?.data?.message || err.message));
    }
  };

  const getOtherUser = (match) => {
    if (!match) return null;
    return match.user1?.id === user?.id ? match.user2 : match.user1;
  };

  const activeOtherUser = getOtherUser(selectedMatch);

  const filteredConnections = connections.filter((match) => {
    const other = getOtherUser(match);
    return (other?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="chat-console-container">
      {actionNotice && (
        <div className="toast-banner success" onClick={() => setActionNotice('')}>
          <span>{actionNotice}</span>
          <i className="fa-solid fa-xmark text-xs opacity-75"></i>
        </div>
      )}

      <div className="chat-console-layout">
        {/* SIDEBAR */}
        <aside className="chat-sidebar">
          <div className="sidebar-header">
            <h3>Conversations</h3>
            <span className={`ws-status-badge ${wsConnected ? 'connected' : 'connecting'}`}>
              <span className="dot"></span> {wsConnected ? 'Live WS' : 'Connecting'}
            </span>
          </div>

          <div className="sidebar-search">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input
              type="text"
              placeholder="Search buddies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="conversations-list">
            {filteredConnections.length === 0 ? (
              <div className="empty-sidebar-text">No matches found.</div>
            ) : (
              filteredConnections.map((match) => {
                const other = getOtherUser(match);
                const isSelected = selectedMatch?.id === match.id;

                return (
                  <div
                    key={match.id}
                    className={`conversation-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => setSelectedMatch(match)}
                  >
                    <UserAvatar
                      src={other?.profileImage}
                      name={other?.name}
                      size="md"
                      showOnline={true}
                      isOnline={other?.online !== false}
                    />
                    <div className="conversation-info">
                      <div className="conversation-title-row">
                        <strong className="conversation-name">{other?.name || 'Buddy'}</strong>
                        <span className={`status-micro ${match.status === 'ACTIVE' ? 'active' : 'ended'}`}>
                          {match.status === 'ACTIVE' ? '● Active' : 'Ended'}
                        </span>
                      </div>
                      <p className="conversation-subtext">{other?.state || 'India'}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* MAIN CHAT PANE */}
        <section className="chat-main-pane">
          {selectedMatch && activeOtherUser ? (
            <>
              {/* CHAT HEADER */}
              <header className="chat-pane-header">
                <div className="chat-header-user">
                  <UserAvatar
                    src={activeOtherUser.profileImage}
                    name={activeOtherUser.name}
                    size="md"
                    showOnline={true}
                    isOnline={activeOtherUser.online !== false}
                  />
                  <div>
                    <h3 className="chat-header-name">{activeOtherUser.name}</h3>
                    <p className="chat-header-sub">
                      📍 {activeOtherUser.state || 'India'} • {selectedMatch.status === 'ACTIVE' ? '🟢 Online' : 'Archived'}
                    </p>
                  </div>
                </div>

                <div className="chat-header-actions">
                  {selectedMatch.status === 'ACTIVE' && (
                    <>
                      <button
                        className="btn-brand primary text-xs call-btn-voice"
                        onClick={() => startCall('audio')}
                        title="Start Voice Call"
                      >
                        <i className="fa-solid fa-phone"></i> Voice
                      </button>

                      <button
                        className="btn-brand primary text-xs call-btn-video"
                        onClick={() => startCall('video')}
                        title="Start Video Call"
                      >
                        <i className="fa-solid fa-video"></i> Video
                      </button>
                    </>
                  )}

                  <button
                    className="btn-brand outline text-xs"
                    onClick={() => setSelectedProfileUser(activeOtherUser)}
                  >
                    <i className="fa-solid fa-user"></i> Profile
                  </button>

                  {selectedMatch.status === 'ACTIVE' && (
                    <button
                      className="btn-brand outline text-xs"
                      onClick={handleEndMatch}
                    >
                      <i className="fa-solid fa-flag-checkered"></i> End Match
                    </button>
                  )}

                  <button
                    className="btn-brand text danger text-xs"
                    onClick={() => setBlockUserTarget(activeOtherUser)}
                  >
                    <i className="fa-solid fa-ban"></i> Block
                  </button>

                  <button
                    className="btn-brand text text-muted text-xs"
                    onClick={() => setReportUserTarget(activeOtherUser)}
                  >
                    <i className="fa-solid fa-flag"></i> Report
                  </button>
                </div>
              </header>

              {/* MESSAGES AREA */}
              <div className="chat-messages-scroll-area">
                {loadingMessages ? (
                  <div className="chat-loading-state">
                    <i className="fa-solid fa-spinner fa-spin"></i> Loading conversation...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="chat-empty-conversation">
                    <div className="empty-chat-icon">🇮🇳 ✨</div>
                    <h4>Say Namaste to {activeOtherUser.name}!</h4>
                    <p>Start the conversation using a quick icebreaker question below.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.sender?.id === user?.id;
                    const timestamp = msg.createdAt
                      ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                      : '';

                    return (
                      <div key={msg.id || Math.random()} className={`message-row ${isMe ? 'me' : 'other'}`}>
                        <div className={`message-bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                          <p>{msg.message}</p>
                          {timestamp && <span className="message-time">{timestamp}</span>}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* COMPOSER */}
              {selectedMatch.status === 'ACTIVE' ? (
                <div className="chat-composer-section">
                  <div className="quick-icebreakers-row">
                    {quickIcebreakers.map((starter, i) => (
                      <button
                        key={i}
                        type="button"
                        className="icebreaker-starter-chip"
                        onClick={() => setInputText(starter)}
                      >
                        {starter}
                      </button>
                    ))}
                  </div>

                  <form onSubmit={handleSendMessage} className="composer-form-row">
                    <input
                      type="text"
                      className="composer-input"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Type a message to ${activeOtherUser.name.split(' ')[0]}...`}
                    />
                    <button
                      type="submit"
                      className="btn-brand primary"
                      disabled={!inputText.trim() || sending}
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                </div>
              ) : (
                <div className="chat-ended-notice">
                  🔒 This connection has ended. History is preserved in read-only mode.
                </div>
              )}
            </>
          ) : (
            <div className="no-chat-selected">
              <i className="fa-solid fa-comments text-3xl text-gray-300"></i>
              <p>Select a buddy from the left sidebar to open real-time chat.</p>
            </div>
          )}
        </section>
      </div>

      {/* WEBRTC CALL OVERLAY / MODAL */}
      {callStatus !== 'IDLE' && (
        <div className="call-overlay-backdrop">
          <div className="call-modal-card">
            {/* INCOMING CALL */}
            {callStatus === 'INCOMING' && (
              <div className="incoming-call-box">
                <div className="calling-avatar-pulse">
                  <UserAvatar
                    src={activeOtherUser?.profileImage}
                    name={activeOtherUser?.name || 'Buddy'}
                    size="xl"
                  />
                </div>
                <h3>Incoming {callType === 'video' ? 'Video' : 'Voice'} Call</h3>
                <p>{activeOtherUser?.name || 'Your Buddy'} is calling you...</p>

                <div className="call-action-row">
                  <button className="call-btn-circle accept" onClick={answerCall}>
                    <i className="fa-solid fa-phone"></i> Accept
                  </button>
                  <button className="call-btn-circle decline" onClick={rejectCall}>
                    <i className="fa-solid fa-phone-slash"></i> Decline
                  </button>
                </div>
              </div>
            )}

            {/* OUTGOING CALL (CALLING...) */}
            {callStatus === 'CALLING' && (
              <div className="incoming-call-box">
                <div className="calling-avatar-pulse outgoing">
                  <UserAvatar
                    src={activeOtherUser?.profileImage}
                    name={activeOtherUser?.name || 'Buddy'}
                    size="xl"
                  />
                </div>
                <h3>Calling {activeOtherUser?.name || 'Buddy'}...</h3>
                <p>Ringing {callType === 'video' ? 'Video' : 'Voice'} call</p>

                <div className="call-action-row">
                  <button className="call-btn-circle decline" onClick={endCall}>
                    <i className="fa-solid fa-phone-slash"></i> End Call
                  </button>
                </div>
              </div>
            )}

            {/* ACTIVE CALL (CONNECTED) */}
            {callStatus === 'CONNECTED' && (
              <div className="active-call-box">
                {callType === 'video' ? (
                  <div className="video-streams-grid">
                    <video
                      ref={remoteVideoRef}
                      autoPlay
                      playsInline
                      className="remote-video-full"
                    />
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="local-video-pip"
                    />
                  </div>
                ) : (
                  <div className="voice-call-display">
                    <div className="calling-avatar-pulse active">
                      <UserAvatar
                        src={activeOtherUser?.profileImage}
                        name={activeOtherUser?.name || 'Buddy'}
                        size="xl"
                      />
                    </div>
                    <h3>Connected in Voice Call</h3>
                    <p>Talking with {activeOtherUser?.name || 'Buddy'}</p>
                  </div>
                )}

                {/* CONTROLS */}
                <div className="call-controls-bar">
                  <button
                    className={`call-ctrl-btn ${isMuted ? 'muted' : ''}`}
                    onClick={toggleMute}
                    title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
                  >
                    <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                  </button>

                  {callType === 'video' && (
                    <button
                      className={`call-ctrl-btn ${isVideoOff ? 'muted' : ''}`}
                      onClick={toggleVideo}
                      title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
                    >
                      <i className={`fa-solid ${isVideoOff ? 'fa-video-slash' : 'fa-video'}`}></i>
                    </button>
                  )}

                  <button
                    className="call-ctrl-btn end-call"
                    onClick={endCall}
                    title="End Call"
                  >
                    <i className="fa-solid fa-phone-slash"></i>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODALS */}
      <UserProfileModal
        isOpen={Boolean(selectedProfileUser)}
        user={selectedProfileUser}
        currentUser={user}
        onClose={() => setSelectedProfileUser(null)}
        onReport={(u) => setReportUserTarget(u)}
        onBlock={(u) => setBlockUserTarget(u)}
      />

      <ReportModal
        isOpen={Boolean(reportUserTarget)}
        user={reportUserTarget}
        onClose={() => setReportUserTarget(null)}
        onSubmit={handleReportSubmit}
      />

      <BlockModal
        isOpen={Boolean(blockUserTarget)}
        user={blockUserTarget}
        onClose={() => setBlockUserTarget(null)}
        onConfirm={handleBlockConfirm}
      />
    </div>
  );
}
