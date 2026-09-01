import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import UserAvatar from './UserAvatar';
import AiAssistant3DCanvas from './AiAssistant3DCanvas';

export default function AiAssistantWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Namaste Ji! 🙏 Welcome to BharatBuddy!\n\nMain aapka Voice AI Buddy hu. Main aapki madad do tarike se kar sakta hu:\n1️⃣ Automatic Same Interest Buddy find karne me\n2️⃣ Platform Guide & Voice Assistance me\n\n📞 Support Helpline: 345632567",
      actionType: 'GENERAL',
      helpline: '345632567',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

  // Web Speech Synthesis (Text to Speech engine)
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); // Stop current speaking

    if (!text) return;

    // Clean formatting and emojis for smooth English speech synthesis
    const cleanedText = text
      .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E6}-\u{1F1FF}]/gu, '')
      .replace(/[1-9]️⃣/g, '')
      .replace(/[*_#]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanedText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Find English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(
      (v) => v.lang.includes('en-IN') || v.lang.includes('en') || v.name.toLowerCase().includes('english')
    );
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const toggleVoiceGreeting = () => {
    if (isSpeaking) {
      stopSpeech();
    } else {
      speakText("Namaste! Welcome to BharatBuddy! Discover authentic friends and buddies across India. How can I help you today?");
    }
  };

  const copyHelpline = (e) => {
    if (e) e.preventDefault();
    if (navigator.clipboard) {
      navigator.clipboard.writeText('345632567');
    }
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  useEffect(() => {
    if (isOpen) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const sendQuery = async (queryText, type = 'chat') => {
    const userText = queryText || inputValue.trim();
    if (!userText && !type) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInputValue('');
    setLoading(true);

    try {
      const response = await api.post('/ai/assistant', {
        query: userText,
        type: type,
      });

      const aiData = response.data?.data;
      const aiReply = aiData?.reply || 'Sorry, response generate nahi ho paya. Please try again.';
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiReply,
        actionType: aiData?.actionType || 'GENERAL',
        matchedUsers: aiData?.matchedUsers || [],
        matchScores: aiData?.matchScores || {},
        helpline: aiData?.helpline || '345632567',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Automatically speak out the AI reply if voice is enabled
      if (voiceEnabled) {
        speakText(aiReply);
      }
    } catch (err) {
      console.error('AI Assistant Error:', err);
      const fallbackText = '⚠️ Network issue or server error. Aap directly humari Helpline: 345632567 par call kar sakte hain.';
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: fallbackText,
          actionType: 'HELPLINE_INFO',
          helpline: '345632567',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
      if (voiceEnabled) {
        speakText(fallbackText);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendQuery();
    }
  };

  return (
    <div className="ai-widget-wrapper">
      {/* FLOATING TRIGGER BUTTON WITH WELCOME SPEECH BUBBLE */}
      {!isOpen && (
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {/* Welcome Speech Bubble */}
          <div
            onClick={() => {
              setIsOpen(true);
              speakText("Namaste! Welcome to BharatBuddy! Tap to speak with me or find your next buddy!");
            }}
            style={{
              background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
              color: '#ffffff',
              padding: '10px 16px',
              borderRadius: '16px 16px 4px 16px',
              fontSize: '13px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              marginBottom: '10px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              maxWidth: '260px',
              animation: 'float 3s ease-in-out infinite'
            }}
          >
            <span style={{ fontSize: '18px' }}>🎙️</span>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '12px', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>Bharat Voice Buddy</span>
                {isSpeaking && <span style={{ fontSize: '10px', background: '#ef4444', color: 'white', padding: '1px 6px', borderRadius: '10px' }}>Speaking...</span>}
              </div>
              <div style={{ fontSize: '12px', color: '#e2e8f0', marginTop: '2px' }}>
                "Namaste! Click me to hear welcome voice greeting!"
              </div>
            </div>
          </div>

          <button
            className="ai-widget-trigger-btn"
            onClick={() => {
              setIsOpen(true);
              if (voiceEnabled && !isSpeaking) {
                speakText("Namaste! Main aapka Voice AI Buddy hu. Kaise madad karu aapki?");
              }
            }}
            title="Open Bharat Voice AI Assistant"
          >
            <div className="ai-btn-pulse"></div>
            <div className="ai-btn-icon" style={{ width: '52px', height: '52px', position: 'relative' }}>
              <AiAssistant3DCanvas />
            </div>
            <div className="ai-btn-badge">
              <span>Voice AI Buddy</span>
              <span className="helpline-micro-pill">📞 345632567</span>
            </div>
          </button>
        </div>
      )}

      {/* CHAT DRAWER / DIALOG */}
      {isOpen && (
        <div className="ai-chat-window animate-slide-up">
          {/* HEADER */}
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-avatar-icon" style={{ width: '48px', height: '48px', position: 'relative', overflow: 'hidden' }}>
                <AiAssistant3DCanvas />
              </div>
              <div>
                <h4 className="ai-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Bharat Voice AI Buddy
                  {isSpeaking && (
                    <span style={{ fontSize: '11px', background: '#ec4899', color: 'white', padding: '2px 8px', borderRadius: '12px', fontWeight: 'bold' }}>
                      🔊 Speaking
                    </span>
                  )}
                </h4>
                <p className="ai-status">
                  <span className="dot-active"></span> Voice Enabled • 24/7 AI Guidance
                </p>
              </div>
            </div>
            <div className="ai-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {/* Voice Toggle Button */}
              <button
                type="button"
                className="btn-brand outline"
                onClick={() => {
                  if (isSpeaking) stopSpeech();
                  setVoiceEnabled(!voiceEnabled);
                }}
                style={{
                  fontSize: '12px',
                  padding: '4px 10px',
                  background: voiceEnabled ? '#dbeafe' : '#f1f5f9',
                  color: voiceEnabled ? '#1d4ed8' : '#64748b',
                  border: 'none',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
                title={voiceEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
              >
                {voiceEnabled ? '🔊 Voice ON' : '🔇 Mute'}
              </button>

              <button
                type="button"
                className="ai-helpline-pill"
                onClick={copyHelpline}
                title="Click to copy helpline 345632567"
              >
                <i className="fa-solid fa-phone"></i> 345632567
              </button>
              <button className="ai-close-btn" onClick={() => { stopSpeech(); setIsOpen(false); }}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          {/* QUICK PROMPT CHIPS */}
          <div className="ai-quick-chips">
            <button
              className="ai-chip"
              onClick={toggleVoiceGreeting}
              style={{ background: '#fef3c7', color: '#92400e', fontWeight: 'bold' }}
            >
              <i className="fa-solid fa-volume-high text-amber-600"></i> {isSpeaking ? 'Stop Voice' : '🔊 Hear Voice Greeting'}
            </button>
            <button
              className="ai-chip"
              onClick={() => sendQuery('Automatic same person find karo jo mere jaisa ho', 'match')}
            >
              <i className="fa-solid fa-wand-magic-sparkles text-amber-500"></i> Find Same Person
            </button>
            <button
              className="ai-chip"
              onClick={() => sendQuery('Mujhe kuch samajh nahi aa raha help karo', 'help')}
            >
              <i className="fa-solid fa-circle-question text-sky-500"></i> Help & Guidance
            </button>
          </div>

          {/* MESSAGES BODY */}
          <div className="ai-messages-body">
            {copiedToast && (
              <div className="ai-toast-banner animate-fade-in">
                <i className="fa-solid fa-circle-check text-emerald-500"></i> Helpline Number <strong>345632567</strong> Copied to Clipboard!
              </div>
            )}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`ai-message-row ${msg.sender === 'user' ? 'user-row' : 'ai-row'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="ai-msg-avatar" style={{ background: '#4f46e5', color: 'white' }}>
                    <i className="fa-solid fa-robot"></i>
                  </div>
                )}
                <div className="ai-msg-bubble">
                  <div className="ai-msg-text">
                    {msg.text.split('\n').map((line, idx) => (
                      <p key={idx} className={line.trim() === '' ? 'h-2' : 'mb-1'}>
                        {line}
                      </p>
                    ))}
                  </div>

                  {/* Speaker Button on AI Messages */}
                  {msg.sender === 'ai' && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <button
                        type="button"
                        onClick={() => speakText(msg.text)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#3b82f6',
                          fontSize: '12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontWeight: '600'
                        }}
                        title="Listen to this message"
                      >
                        <i className="fa-solid fa-volume-high"></i> Listen Voice
                      </button>
                    </div>
                  )}

                  {/* DISPLAY HELPLINE CALL CARD IF APPLICABLE */}
                  {msg.helpline && (
                    <div className="ai-helpline-box">
                      <div className="helpline-icon">
                        <i className="fa-solid fa-headset"></i>
                      </div>
                      <div className="helpline-details">
                        <span className="label">24/7 Official Helpline Number</span>
                        <button
                          type="button"
                          onClick={copyHelpline}
                          className="phone-link-btn"
                          title="Click to copy number"
                        >
                          📞 {msg.helpline} <span className="copy-badge-inline">Copy</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* MATCHED USERS CARDS */}
                  {msg.matchedUsers && msg.matchedUsers.length > 0 && (
                    <div className="ai-matched-cards-grid">
                      <div className="matched-grid-header">
                        <i className="fa-solid fa-users-viewfinder"></i> Matched Buddy Profiles
                      </div>
                      {msg.matchedUsers.map((user) => {
                        const score = msg.matchScores?.[user.id] || 85;
                        return (
                          <div key={user.id} className="ai-user-match-card">
                            <div className="card-top">
                              <UserAvatar
                                src={user.profileImage}
                                name={user.name}
                                size="md"
                              />
                              <div className="card-info">
                                <h5 className="user-name">{user.name}</h5>
                                <p className="user-sub">
                                  {user.age ? `${user.age} yrs` : 'Age hidden'} • {user.state || 'India'}
                                </p>
                              </div>
                              <div className="score-badge">{score}% Match</div>
                            </div>

                            {user.interests && (Array.isArray(user.interests) ? user.interests.length > 0 : user.interests?.size > 0) && (
                              <div className="card-interests">
                                {Array.from(user.interests).slice(0, 3).map((inst, i) => (
                                  <span key={i} className="mini-interest-tag">
                                    {inst}
                                  </span>
                                ))}
                              </div>
                            )}

                            <button
                              className="ai-connect-btn"
                              onClick={() => {
                                setIsOpen(false);
                                navigate('/find');
                              }}
                            >
                              <i className="fa-solid fa-user-plus"></i> Connect & Chat
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <span className="ai-msg-time">{msg.timestamp}</span>
                </div>
              </div>
            ))}

            {loading && (
              <div className="ai-message-row ai-row">
                <div className="ai-msg-avatar">
                  <i className="fa-solid fa-robot"></i>
                </div>
                <div className="ai-msg-bubble loading-bubble">
                  <span className="dot-typing"></span>
                  <span className="dot-typing"></span>
                  <span className="dot-typing"></span>
                  <span className="ml-2 text-xs text-gray-500">Finding buddy & voice guidance...</span>
                </div>
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* INPUT FOOTER */}
          <div className="ai-chat-footer">
            <input
              type="text"
              className="ai-input"
              placeholder="Ask Voice AI: Find same person, help guide, or questions..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              className="ai-send-btn"
              onClick={() => sendQuery()}
              disabled={loading || !inputValue.trim()}
            >
              <i className="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
