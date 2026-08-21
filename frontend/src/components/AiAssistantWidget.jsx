import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import UserAvatar from './UserAvatar';
import AiAssistant3DCanvas from './AiAssistant3DCanvas';

export default function AiAssistantWidget() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'ai',
      text: "Namaste! 🙏 Main aapka Bharat AI Assistant hu.\n\nMain aapki help do mukhya tariko se kar sakta hu:\n1️⃣ Automatic Same Person / Buddy Find karna\n2️⃣ App Guide & Help (Agar kuch samajh nahi aa raha ho)\n\n📞 Support Helpline: 345632567",
      actionType: 'GENERAL',
      helpline: '345632567',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const chatBottomRef = useRef(null);

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
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: aiData?.reply || 'Sorry, response generate nahi ho paya. Please try again.',
        actionType: aiData?.actionType || 'GENERAL',
        matchedUsers: aiData?.matchedUsers || [],
        matchScores: aiData?.matchScores || {},
        helpline: aiData?.helpline || '345632567',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error('AI Assistant Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'ai',
          text: '⚠️ Network issue or server error. Aap Directly humari Help Line: 345632567 par sampark kar sakte hain.',
          actionType: 'HELPLINE_INFO',
          helpline: '345632567',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
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
      {/* FLOATING TRIGGER BUTTON */}
      {!isOpen && (
        <button
          className="ai-widget-trigger-btn"
          onClick={() => setIsOpen(true)}
          title="Open Bharat AI Assistant"
        >
          <div className="ai-btn-pulse"></div>
          <div className="ai-btn-icon" style={{ width: '48px', height: '48px', position: 'relative' }}>
            <AiAssistant3DCanvas />
          </div>
          <div className="ai-btn-badge">
            <span>AI Assistant</span>
            <span className="helpline-micro-pill">📞 345632567</span>
          </div>
        </button>
      )}

      {/* CHAT DRAWER / DIALOG */}
      {isOpen && (
        <div className="ai-chat-window animate-slide-up">
          {/* HEADER */}
          <div className="ai-chat-header">
            <div className="ai-header-info">
              <div className="ai-avatar-icon" style={{ width: '44px', height: '44px', position: 'relative', overflow: 'hidden' }}>
                <AiAssistant3DCanvas />
              </div>
              <div>
                <h4 className="ai-title">Bharat AI Buddy</h4>
                <p className="ai-status">
                  <span className="dot-active"></span> Always Ready • Support & Auto Matching
                </p>
              </div>
            </div>
            <div className="ai-header-actions">
              <button
                type="button"
                className="ai-helpline-pill"
                onClick={copyHelpline}
                title="Click to copy helpline 345632567"
              >
                <i className="fa-solid fa-phone"></i> 345632567
              </button>
              <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>
          </div>

          {/* QUICK PROMPT CHIPS */}
          <div className="ai-quick-chips">
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
            <button
              className="ai-chip"
              onClick={() => sendQuery('Helpline number kya hai support ka?', 'helpline')}
            >
              <i className="fa-solid fa-headset text-emerald-500"></i> Helpline: 345632567
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
                  <div className="ai-msg-avatar">
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

                  {/* MATCHED USERS CARDS (AUTOMATIC SAME PERSON FIND RESULTS) */}
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
                  <span className="ml-2 text-xs text-gray-500">Finding buddy & guidance...</span>
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
              placeholder="Ask AI: Find same person, help guide, or questions..."
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
