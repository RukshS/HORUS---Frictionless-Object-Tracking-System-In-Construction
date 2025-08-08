import { useState, useRef, useEffect } from 'react';
import './ChatBot.css';
import backgroundImg from '../../assets/close-up-texture-stainless-steel.jpg';
import botIcon from '../../assets/bot.jpeg';

// Fallback to a simple icon if assets are not available
const defaultBotIcon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiMzQjgyRjYiLz4KPHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTkgMTJIMTVNOSAxNkgxM00xNyAyMUw5IDIxSDNWM0gyMVYyMUgxN1oiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIi8+Cjwvc3ZnPgo8L3N2Zz4=";

export default function ChatBot() {
  const [input, setInput] = useState('');
  const [prediction, setPrediction] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isPredicting, setIsPredicting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Use environment variable or fallback to localhost
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);

    try {
      // Updated API endpoint to use the chatagent backend
      const res = await fetch(`${API_BASE_URL}/chatagent/chat?query=${encodeURIComponent(input)}`);
      const data = await res.text();

      const botMessage = { role: 'bot', content: data };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const botMessage = { role: 'bot', content: "Sorry, I encountered an error. Please make sure the backend server is running." };
      setMessages((prev) => [...prev, botMessage]);
    }
    
    setInput('');
    setPrediction('');
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickReplies = [
    'What is HORUS?',
    'How does it work?',
    'What are the features?',
    'How to get started?',
  ];

  const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newInput = e.target.value;
    setInput(newInput);

    if (newInput.trim()) {
      setIsPredicting(true);
      try {
        // Updated API endpoint for prediction
        const res = await fetch(`${API_BASE_URL}/chatagent/predict`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: newInput }),
        });
        const data = await res.json();
        setPrediction(data.next_word || '');
      } catch (error) {
        console.error('Prediction error:', error);
        setPrediction('');
      } finally {
        setIsPredicting(false);
      }
    } else {
      setPrediction('');
    }
  };

  return (
    <div className="chatbot-container">
      {/* Floating Chat Button - Fixed position with high z-index to stay on top while scrolling */}
      <div className="fixed bottom-6 right-6 z-[9999] pointer-events-auto">
        <button
          className="chatbot-button w-20 h-16 bg-blue-500 rounded-full shadow-xl flex items-center justify-center hover:bg-blue-600 transition-all duration-300 hover:scale-110 active:scale-95"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Open chat"
        >
          <img 
            src={botIcon || defaultBotIcon} 
            alt="Chat Bot" 
            className="w-20 h-9 rounded-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = defaultBotIcon;
            }}
          />
        </button>
      </div>

      {/* Chat Popup - Fixed position that stays on top while scrolling */}
      {isOpen && (
        <div
          className="chatbot-popup fixed bottom-24 right-6 z-[9998] w-[450px] max-w-[calc(100vw-1rem)] h-[700px] max-h-[calc(100vh-6rem)] rounded-3xl shadow-2xl overflow-hidden border border-white/30 backdrop-blur-lg pointer-events-auto
                     sm:w-[400px] sm:h-[650px] 
                     md:w-[450px] md:h-[700px] 
                     lg:w-[500px] lg:h-[750px]
                     xl:w-[550px] xl:h-[800px]"
          style={{
            backgroundImage: backgroundImg ? `url(${backgroundImg})` : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          <div className="backdrop-blur-xl bg-black/20 p-6 flex flex-col h-full"
               style={{
                 backdropFilter: 'blur(20px) saturate(180%)',
                 WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                 background: 'rgba(255, 255, 255, 0.1)'
               }}>
            {/* Header with Close Button */}
            <div className="flex justify-between items-center mb-4">
              <div className="text-xl sm:text-2xl font-semibold text-white leading-tight">
                Hi, Welcome to HORUS<br />
                <span className="text-sm sm:text-base text-gray-300">How can I help you?</span>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-300 text-2xl sm:text-3xl font-bold w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                aria-label="Close chat"
              >
                ×
              </button>
            </div>

            {/* Quick Replies */}
            <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-2 gap-2 p-3 sm:p-4 rounded-xl mb-4"
                 style={{
                   backdropFilter: 'blur(12px) saturate(150%)',
                   WebkitBackdropFilter: 'blur(12px) saturate(150%)',
                   background: 'rgba(255, 255, 255, 0.15)',
                   border: '1px solid rgba(255, 255, 255, 0.2)'
                 }}>
              {quickReplies.map((text, idx) => (
                <button
                  key={idx}
                  className="bg-blue-300 text-black rounded-xl py-2 px-3 text-xs sm:text-sm hover:bg-blue-400 transition-colors active:bg-blue-500"
                  onClick={() => {
                    setInput(text);
                    // Auto-send the message
                    const userMessage = { role: 'user', content: text };
                    setMessages((prev) => [...prev, userMessage]);
                    
                    // Send to backend
                    fetch(`${API_BASE_URL}/chatagent/chat?query=${encodeURIComponent(text)}`)
                      .then(res => res.text())
                      .then(data => {
                        const botMessage = { role: 'bot', content: data };
                        setMessages((prev) => [...prev, botMessage]);
                      })
                      .catch(error => {
                        console.error('Error sending quick reply:', error);
                        const botMessage = { role: 'bot', content: "Sorry, I encountered an error. Please make sure the backend server is running." };
                        setMessages((prev) => [...prev, botMessage]);
                      });
                    
                    setInput('');
                  }}
                >
                  {text}
                </button>
              ))}
            </div>

            {/* Chat Messages */}
            <div className="chat-messages flex-1 overflow-y-auto space-y-3 px-1 sm:px-2 text-white mb-4">
              {messages.length === 0 && (
                <div className="text-center text-gray-300 mt-8 text-sm sm:text-base">
                  Ask me anything about HORUS!
                </div>
              )}
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`rounded-xl px-3 sm:px-4 py-2 max-w-xs sm:max-w-sm break-words text-sm sm:text-base ${
                      msg.role === 'user'
                        ? 'bg-blue-500 text-white ml-4'
                        : 'bg-white/30 text-white mr-4'
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input with Prediction */}
            <div className="flex relative">
              <div className="flex-1 relative">
                <input
                  className="w-full rounded-l-full px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-white placeholder-gray-300 caret-white focus:outline-none focus:ring-2 focus:ring-blue-400"
                  style={{
                    backdropFilter: 'blur(10px) saturate(120%)',
                    WebkitBackdropFilter: 'blur(10px) saturate(120%)',
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}
                  placeholder="Write your message here..."
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      sendMessage();
                    } else if (e.key === 'Tab' && prediction) {
                      e.preventDefault();
                      setInput(prev => `${prev}${prev.endsWith(' ') ? '' : ' '}${prediction}`);
                      setPrediction('');
                    }
                  }}
                />
                
                {/* Prediction hint */}
                {prediction && (
                  <div className="absolute inset-y-0 left-0 flex items-center pointer-events-none pl-4 w-full">
                    <span className="text-transparent">
                      {input}
                      {input && !input.endsWith(' ') && ' '}
                      <span className="text-gray-400">{prediction}</span>
                    </span>
                  </div>
                )}
              </div>

              <button
                className="bg-blue-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-r-full hover:bg-blue-600 transition-colors disabled:opacity-50 text-sm sm:text-base"
                onClick={sendMessage}
                disabled={!input.trim()}
              >
                {isPredicting ? '...' : '▶'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
