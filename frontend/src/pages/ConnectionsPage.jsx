import { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/useAuth';
import { wsService } from '../services/websocket';
import callSoundService from '../services/callSoundService';
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
  const [replyTo, setReplyTo] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
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
  const remoteAudioRef = useRef(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const iceCandidatesQueueRef = useRef([]);

  // Modals & Attachments
  const [selectedProfileUser, setSelectedProfileUser] = useState(null);
  const [reportUserTarget, setReportUserTarget] = useState(null);
  const [blockUserTarget, setBlockUserTarget] = useState(null);
  const [selectedAttachment, setSelectedAttachment] = useState(null); // { file, previewUrl, fileName, attachmentType }
  const [previewImageModalUrl, setPreviewImageModalUrl] = useState(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordingChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

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
                await flushIceCandidatesQueue();
                setCallStatus('CONNECTED');
              } catch (e) {
                console.error('Failed to set remote answer:', e);
              }
            }
          } else if (incomingMsg.signalType === 'ICE_CANDIDATE') {
            if (incomingMsg.candidate) {
              if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
                try {
                  await pcRef.current.addIceCandidate(new RTCIceCandidate(incomingMsg.candidate));
                } catch (e) {
                  console.error('Failed to add ICE candidate:', e);
                }
              } else {
                iceCandidatesQueueRef.current.push(incomingMsg.candidate);
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

  // Handle WebRTC Call Audio Ringtone Sounds (Outgoing, Incoming, Connected, Ended)
  useEffect(() => {
    if (callStatus === 'CALLING') {
      callSoundService.startOutgoingRingtone();
    } else if (callStatus === 'INCOMING') {
      callSoundService.startIncomingRingtone();
    } else if (callStatus === 'CONNECTED') {
      callSoundService.playConnectChime();
    } else if (callStatus === 'IDLE') {
      callSoundService.stopRingtones();
    }

    return () => {
      callSoundService.stopRingtones();
    };
  }, [callStatus]);
  const flushIceCandidatesQueue = async () => {
    if (pcRef.current && pcRef.current.remoteDescription && pcRef.current.remoteDescription.type) {
      while (iceCandidatesQueueRef.current.length > 0) {
        const candidate = iceCandidatesQueueRef.current.shift();
        try {
          await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) {
          console.error('Error adding queued ICE candidate:', e);
        }
      }
    }
  };

  // Ensure remote audio/video elements play stream when connected
  useEffect(() => {
    if (callStatus === 'CONNECTED') {
      const attachStreams = () => {
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          localVideoRef.current.muted = true;
          localVideoRef.current.play().catch((e) => console.warn('Local video play warning:', e));
        }

        if (remoteStreamRef.current) {
          if (remoteAudioRef.current) {
            remoteAudioRef.current.srcObject = remoteStreamRef.current;
            remoteAudioRef.current.muted = false;
            remoteAudioRef.current.volume = 1.0;
            remoteAudioRef.current.play().catch((e) => console.warn('Remote audio play warning:', e));
          }
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamRef.current;
            remoteVideoRef.current.play().catch((e) => console.warn('Remote video play warning:', e));
          }
        }
      };

      attachStreams();
      const timer = setTimeout(attachStreams, 300);
      return () => clearTimeout(timer);
    }
  }, [callStatus, callType]);

  // --- WEBRTC CALL HANDLERS ---
  const cleanupCall = () => {
    callSoundService.playEndCallSound();
    callSoundService.stopRingtones();
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
    if (pcRef.current) {
      pcRef.current.close();
      pcRef.current = null;
    }
    remoteStreamRef.current = null;
    iceCandidatesQueueRef.current = [];
    setCallStatus('IDLE');
    setPendingOffer(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
      ],
    });

    pc.ontrack = (event) => {
      console.log('WebRTC ontrack received:', event.track.kind, event.streams);

      if (!remoteStreamRef.current) {
        remoteStreamRef.current = new MediaStream();
      }

      if (event.streams && event.streams[0]) {
        event.streams[0].getTracks().forEach((track) => {
          if (!remoteStreamRef.current.getTracks().some((t) => t.id === track.id)) {
            remoteStreamRef.current.addTrack(track);
          }
        });
      } else if (event.track) {
        if (!remoteStreamRef.current.getTracks().some((t) => t.id === event.track.id)) {
          remoteStreamRef.current.addTrack(event.track);
        }
      }

      const fullStream = remoteStreamRef.current;

      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = fullStream;
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.play().catch((err) => console.warn('Audio auto-play blocked:', err));
      }

      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = fullStream;
        remoteVideoRef.current.play().catch((err) => console.warn('Video auto-play blocked:', err));
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

  // Robust Media Stream Fetcher with Automatic Fallbacks
  const getMediaStream = async (type) => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Your browser does not support WebRTC media devices.');
    }

    // Attempt 1: Advanced constraints (Echo Cancellation + Video)
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === 'video',
      });
    } catch (err1) {
      console.warn('Advanced getUserMedia failed, trying basic constraints:', err1);
    }

    // Attempt 2: Simple basic constraints
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
    } catch (err2) {
      console.warn('Basic getUserMedia failed, checking audio fallback:', err2);
    }

    // Attempt 3: Voice-only fallback if camera is busy or unavailable
    if (type === 'video') {
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setActionNotice('⚠️ Camera unavailable or in use by another app. Switching to Voice Call.');
        setCallType('audio');
        return audioOnlyStream;
      } catch (err3) {
        console.warn('Audio-only fallback failed:', err3);
      }
    }

    throw new Error('Microphone or Camera access blocked. Please check browser permissions (🔒 icon in address bar) and ensure no other application is using your camera.');
  };

  const startCall = async (type) => {
    if (!selectedMatch) return;
    setCallType(type);
    setCallStatus('CALLING');

    try {
      const stream = await getMediaStream(type);
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
      setActionNotice(err.message || 'Microphone / Camera access required to place calls.');
      cleanupCall();
    }
  };

  const answerCall = async () => {
    if (!pendingOffer || !selectedMatch) return;
    setCallStatus('CONNECTED');

    try {
      const stream = await getMediaStream(callType);
      localStreamRef.current = stream;
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(pendingOffer));
      await flushIceCandidatesQueue();
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
      setActionNotice(err.message || 'Could not access microphone/camera.');
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

  const handleImageSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setActionNotice('Photo size must be under 10MB.');
      return;
    }
    const previewUrl = URL.createObjectURL(file);
    setSelectedAttachment({
      file,
      previewUrl,
      fileName: file.name,
      attachmentType: 'IMAGE',
    });
    e.target.value = '';
  };

  const handleFileSelected = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      setActionNotice('File size must be under 15MB.');
      return;
    }
    const isImg = file.type.startsWith('image/');
    const previewUrl = isImg ? URL.createObjectURL(file) : null;
    setSelectedAttachment({
      file,
      previewUrl,
      fileName: file.name,
      attachmentType: isImg ? 'IMAGE' : 'DOCUMENT',
    });
    e.target.value = '';
  };

  const clearSelectedAttachment = () => {
    if (selectedAttachment?.previewUrl) {
      URL.revokeObjectURL(selectedAttachment.previewUrl);
    }
    setSelectedAttachment(null);
  };

  const startVoiceRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setActionNotice('Voice recording is not supported by this browser.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordingChunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) recordingChunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        const extension = blob.type.includes('mp4') ? 'm4a' : 'webm';
        setSelectedAttachment({
          file: new File([blob], `voice-note-${Date.now()}.${extension}`, { type: blob.type }),
          previewUrl: URL.createObjectURL(blob),
          fileName: 'Voice note',
          attachmentType: 'VOICE',
        });
        stream.getTracks().forEach((track) => track.stop());
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecordingSeconds(0);
      setIsRecording(true);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((seconds) => seconds + 1), 1000);
    } catch {
      setActionNotice('Microphone permission is required to record a voice note.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
  };

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if ((!inputText.trim() && !selectedAttachment) || !selectedMatch || sending) return;

    const text = inputText.trim();
    const pendingAttachment = selectedAttachment;

    setInputText('');
    setSelectedAttachment(null);
    setSending(true);

    try {
      let attachmentUrl = null;
      let attachmentType = null;
      let fileName = null;

      if (pendingAttachment?.file) {
        const formData = new FormData();
        formData.append('file', pendingAttachment.file);
        const uploadRes = await api.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (uploadRes.data?.data) {
          attachmentUrl = uploadRes.data.data.url;
          attachmentType = pendingAttachment.attachmentType === 'VOICE'
            ? 'VOICE'
            : uploadRes.data.data.attachmentType;
          fileName = uploadRes.data.data.fileName;
        }
      }

      const { data } = await api.post('/messages', {
        match: { id: selectedMatch.id },
          message: replyTo
          ? `↪ ${replyTo.senderName}: ${replyTo.message}\n${text || (attachmentType === 'IMAGE' ? '📷 Photo Attachment' : attachmentType === 'VOICE' ? '🎙️ Voice Note' : '📁 File Attachment')}`
          : text || (attachmentType === 'IMAGE' ? '📷 Photo Attachment' : attachmentType === 'VOICE' ? '🎙️ Voice Note' : '📁 File Attachment'),
        attachmentUrl,
        attachmentType,
        fileName,
      });

      if (data.data) {
        const savedMsg = data.data;
        setMessages((prev) => {
          if (prev.some((m) => m.id === savedMsg.id)) return prev;
          return [...prev, savedMsg];
        });
      }
      setReplyTo(null);
    } catch (err) {
      setActionNotice('Failed to send message/attachment: ' + (err?.response?.data?.message || err.message));
    } finally {
      setSending(false);
    }
  };

  const handleReply = (msg) => {
    setReplyTo({
      senderName: msg.sender?.name || 'Buddy',
      message: msg.message || msg.fileName || 'Attachment',
    });
    requestAnimationFrame(() => document.querySelector('.composer-input')?.focus());
  };

  const handleSaveAttachment = (msg) => {
    if (!msg.attachmentUrl) return;
    const saved = JSON.parse(localStorage.getItem('bharat-buddy-saved-attachments') || '[]');
    if (!saved.some((item) => item.url === msg.attachmentUrl)) {
      saved.push({ url: msg.attachmentUrl, fileName: msg.fileName || 'Attachment', savedAt: new Date().toISOString() });
      localStorage.setItem('bharat-buddy-saved-attachments', JSON.stringify(saved));
    }
    setActionNotice('Attachment saved in this browser.');
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
                    <h3 className="chat-header-name">
                      {activeOtherUser.name}
                      {activeOtherUser.verified !== false && (
                        <span style={{ fontSize: '11px', color: '#059669', background: '#d1fae5', padding: '2px 6px', borderRadius: '10px', marginLeft: '6px' }}>
                          <i className="fa-solid fa-shield-check"></i> Verified
                        </span>
                      )}
                    </h3>
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
                      const isImage = msg.attachmentType === 'IMAGE' || (msg.attachmentUrl && (msg.attachmentUrl.match(/\.(jpeg|jpg|gif|png|webp)/i) || msg.attachmentUrl.startsWith('data:image')));
                      const isVoice = msg.attachmentType === 'VOICE' || msg.attachmentType === 'AUDIO';

                    return (
                      <div key={msg.id || Math.random()} className={`message-row ${isMe ? 'me' : 'other'}`}>
                        <div className={`message-bubble ${isMe ? 'bubble-me' : 'bubble-other'}`}>
                          {/* ATTACHMENT DISPLAY */}
                          {msg.attachmentUrl && (
                            <div className="message-attachment-box" style={{ marginBottom: '6px' }}>
                              {isVoice ? (
                                <audio controls src={msg.attachmentUrl} className="voice-note-player" />
                              ) : isImage ? (
                                <div
                                  className="chat-image-thumbnail"
                                  onClick={() => setPreviewImageModalUrl(msg.attachmentUrl)}
                                  style={{ cursor: 'pointer', borderRadius: '12px', overflow: 'hidden', maxWidth: '280px', maxHeight: '280px', border: '1px solid rgba(255,255,255,0.2)' }}
                                >
                                  <img
                                    src={msg.attachmentUrl}
                                    alt={msg.fileName || 'Shared photo'}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                                  />
                                </div>
                              ) : (
                                <a
                                  href={msg.attachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="chat-file-card"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 14px',
                                    background: isMe ? 'rgba(255,255,255,0.18)' : '#f1f5f9',
                                    color: isMe ? '#ffffff' : '#0f172a',
                                    borderRadius: '10px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '13px'
                                  }}
                                >
                                  <i className="fa-solid fa-file-lines text-lg" style={{ fontSize: '20px' }}></i>
                                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                                    <div>{msg.fileName || 'Attachment Document'}</div>
                                    <span style={{ fontSize: '11px', opacity: 0.8 }}>Click to download/view</span>
                                  </div>
                                  <i className="fa-solid fa-download" style={{ marginLeft: 'auto' }}></i>
                                </a>
                              )}
                            </div>
                          )}
                              {isImage && (
                                <div className="photo-emoji-reactions">
                                  {['❤️', '😂', '🔥', '👏', '😍'].map((emoji) => (
                                    <button key={emoji} type="button" onClick={() => { setReplyTo({ senderName: msg.sender?.name || 'Buddy', message: 'Photo' }); setInputText(emoji); }} title={`Reply with ${emoji}`}>
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              )}

                          {msg.message && msg.message !== '📷 Photo Attachment' && msg.message !== '📁 File Attachment' && (
                            <p style={{ whiteSpace: 'pre-line' }}>{msg.message}</p>
                          )}
                          <div className="message-actions">
                            <button type="button" onClick={() => handleReply(msg)} title="Reply to this message">
                              <i className="fa-solid fa-reply"></i> Reply
                            </button>
                            {msg.attachmentUrl && (
                              <button type="button" onClick={() => handleSaveAttachment(msg)} title="Save this attachment">
                                <i className="fa-solid fa-bookmark"></i> Save
                              </button>
                            )}
                          </div>
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

                  {replyTo && (
                    <div className="reply-preview">
                      <div>
                        <strong>Replying to {replyTo.senderName}</strong>
                        <span>{replyTo.message}</span>
                      </div>
                      <button type="button" onClick={() => setReplyTo(null)} title="Cancel reply">
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  )}

                  {/* Selected Attachment Preview Box */}
                  {selectedAttachment && (
                    <div style={{ padding: '8px 16px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {selectedAttachment.attachmentType === 'IMAGE' && selectedAttachment.previewUrl ? (
                        <img
                          src={selectedAttachment.previewUrl}
                          alt="Selected preview"
                          style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ width: '48px', height: '48px', borderRadius: '8px', background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#475569' }}>
                          📄
                        </div>
                      )}
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {selectedAttachment.fileName}
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>Ready to send</span>
                      </div>
                      <button
                        type="button"
                        onClick={clearSelectedAttachment}
                        style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '18px', cursor: 'pointer', padding: '4px' }}
                        title="Remove attachment"
                      >
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  )}

                  <form onSubmit={handleSendMessage} className="composer-form-row">
                    {/* Hidden File Inputs */}
                    <input
                      type="file"
                      ref={imageInputRef}
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleImageSelected}
                    />
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,.doc,.docx,.txt,.zip,.png,.jpg,.jpeg"
                      style={{ display: 'none' }}
                      onChange={handleFileSelected}
                    />

                    {/* Attachment Action Buttons */}
                    <button
                      type="button"
                      className="composer-attach-btn"
                      onClick={() => imageInputRef.current?.click()}
                      title="Send Photo"
                      style={{ background: 'none', border: 'none', fontSize: '20px', color: '#f59e0b', cursor: 'pointer', padding: '6px 8px' }}
                    >
                      <i className="fa-solid fa-image"></i>
                    </button>
                    <button
                      type="button"
                      className="composer-attach-btn"
                      onClick={() => fileInputRef.current?.click()}
                      title="Send Document File"
                      style={{ background: 'none', border: 'none', fontSize: '20px', color: '#3b82f6', cursor: 'pointer', padding: '6px 8px' }}
                    >
                      <i className="fa-solid fa-paperclip"></i>
                    </button>

                    <button
                      type="button"
                      className={`composer-attach-btn ${isRecording ? 'recording' : ''}`}
                      onClick={isRecording ? stopVoiceRecording : startVoiceRecording}
                      title={isRecording ? 'Stop voice recording' : 'Record voice note'}
                    >
                      <i className={`fa-solid ${isRecording ? 'fa-stop' : 'fa-microphone'}`}></i>
                    </button>

                    {isRecording && <span className="recording-status">Recording {recordingSeconds}s</span>}

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
                      disabled={(!inputText.trim() && !selectedAttachment) || sending}
                    >
                      {sending ? 'Sending...' : 'Send'}
                    </button>
                  </form>
                  <div className="composer-emoji-row" aria-label="Add emoji">
                    {['😀', '😊', '❤️', '😂', '🔥', '👏', '🙏', '🇮🇳'].map((emoji) => (
                      <button key={emoji} type="button" onClick={() => setInputText((value) => `${value}${emoji}`)} title={`Add ${emoji}`}>
                        {emoji}
                      </button>
                    ))}
                  </div>
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
          {/* ALWAYS RENDER AUDIO ELEMENT TO PLAY REMOTE VOICE FOR AUDIO & VIDEO CALLS */}
          <audio ref={remoteAudioRef} autoPlay playsInline style={{ display: 'none' }} />

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

      {/* FULL SCREEN PHOTO LIGHTBOX MODAL */}
      {previewImageModalUrl && (
        <div
          onClick={() => setPreviewImageModalUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              type="button"
              onClick={() => setPreviewImageModalUrl(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                fontSize: '18px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <i className="fa-solid fa-xmark"></i>
            </button>
            <img
              src={previewImageModalUrl}
              alt="Enlarged photo view"
              style={{ maxWidth: '100%', maxHeight: '85vh', borderRadius: '12px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', objectFit: 'contain' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
