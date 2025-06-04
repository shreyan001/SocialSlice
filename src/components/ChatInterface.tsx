import React, { useState } from 'react';
import WagerOptions from './WagerOptions';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  showOptions?: boolean;
}

interface ChatInterfaceProps {
  isWalletConnected: boolean;
  onSendMessage: (message: string) => Promise<void>;
  onSelectWagerOption: (type: 'nft' | 'stablecoin') => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  isWalletConnected, 
  onSendMessage,
  onSelectWagerOption 
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hi! I can help you create and manage wagers. What kind of wager would you like to create?'
    }
  ]);

  // Simulate AI typing with random delay
  const simulateTyping = async (text: string) => {
    const minDelay = 1000; // Minimum 1 second
    const charsPerSecond = 20;
    const naturalDelay = Math.max(
      minDelay,
      (text.length / charsPerSecond) * 1000
    );
    
    return new Promise(resolve => setTimeout(resolve, naturalDelay));
  };

  const handleSend = async () => {
    if (!message.trim() || isTyping) return;

    // Add user message
    const userMessage: Message = { role: 'user', content: message };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');

    // Show typing indicator
    setIsTyping(true);

    // Simulate AI response for now
    await onSendMessage(message);
    
    // First response with delay
    await simulateTyping('I understand you want to create a wager. Please select your preferred type:');
    
    // Add mock AI response with wager options
    const mockResponse: Message = {
      role: 'assistant',
      content: 'I understand you want to create a wager. Please select your preferred type:',
      showOptions: true
    };
    setMessages(prev => [...prev, mockResponse]);
    setIsTyping(false);
  };

  const handleWagerSelect = async (type: 'nft' | 'stablecoin') => {
    onSelectWagerOption(type);
    setIsTyping(true);
    
    // Simulate thinking about the selection
    await simulateTyping(`Great! Let's set up your ${type === 'nft' ? 'NFT' : 'stablecoin'} wager.`);
    
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `Great! Let's set up your ${type === 'nft' ? 'NFT' : 'stablecoin'} wager.`
    }]);
    setIsTyping(false);
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.map((msg, index) => (
          <div key={index} className="message-wrapper">
            <div className={`message ${msg.role}`}>
              <div className="message-content">
                {msg.content}
              </div>
            </div>
            {msg.showOptions && (
              <div className="inline-wager-options">
                <WagerOptions onSelectOption={handleWagerSelect} />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="message-wrapper">
            <div className="message assistant typing">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="chat-input">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isWalletConnected ? "Type your message..." : "Connect wallet to chat..."}
          disabled={!isWalletConnected || isTyping}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          disabled={!isWalletConnected || !message.trim() || isTyping}
          className="send-button"
        >
          {isTyping ? 'AI is typing...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface; 