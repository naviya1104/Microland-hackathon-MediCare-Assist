import { useState, useRef, useEffect } from 'react';

export default function Chatbot() {
  const [messages, setMessages] = useState([{ role: 'assistant', text: "Hello! I am your MediBot AI Assistant. How can I help you regarding your medicines today?" }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMsg = input.trim();
    setInput('');
    const newHistory = [...messages, { role: 'user', text: userMsg }];
    setMessages(newHistory);
    setIsLoading(true);

    // Get current status context
    let schedule = null;
    let takenDoses = {};
    try {
      const sched = localStorage.getItem('medicare_schedule_cache');
      if (sched) schedule = JSON.parse(sched);
      const taken = localStorage.getItem('medicare_doses_taken');
      if (taken) takenDoses = JSON.parse(taken);
    } catch (e) {}

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg, 
          chatHistory: messages,
          schedule: schedule,
          takenDoses: takenDoses,
          currentTime: new Date().toISOString()
        })
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.action === "UPDATE_SCHEDULE") {
          localStorage.setItem('medicare_schedule_cache', JSON.stringify(data.scheduleData));
        }
        setMessages(prev => [...prev, { role: 'assistant', text: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', text: "I'm sorry, I'm having trouble connecting to my brain right now." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Network error. Is the backend server running?" }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page chatbot-page">
      <div className="page-header">
        <h1>MediBot AI</h1>
        <p>Your personal medical assistant</p>
      </div>

      <div className="chatbot-window">
        <div className="chatbot-messages">
          {messages.map((msg, i) => (
            <div key={i} className={`chat-bubble ${msg.role}`}>
              {msg.text}
            </div>
          ))}
          {isLoading && (
            <div className="chat-bubble assistant loading">
              <span className="dot"></span><span className="dot"></span><span className="dot"></span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chatbot-input">
          <input 
            type="text" 
            className="form-control" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about your medicines..."
          />
          <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={isLoading || !input.trim()}>
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
