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
      content: 'Hello! How can I assist you with your wager today?'
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
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="flex-1 overflow-y-auto p-3">
        {messages.map((msg, index) => (
          <div key={index} className="mb-3">
            <div className={`max-w-[70%] p-2.5 rounded-none mb-1.5 geist-mono border text-sm ${ 
              msg.role === 'user' 
                ? 'ml-auto bg-red-600 text-white border-red-700' 
                : 'bg-white text-gray-800 border-red-600'
            }`}>
              <div>{msg.content}</div>
            </div>
            {msg.showOptions && (
              <div className="mt-2">
                <WagerOptions onSelectOption={handleWagerSelect} />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="mb-3">
            <div className="max-w-[70%] p-2.5 rounded-none bg-white text-gray-800 geist-mono border border-gray-200">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:200ms]"></span>
                <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:400ms]"></span>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 p-3 border-t border-gray-200">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={isWalletConnected ? "Type your message..." : "Connect wallet to chat..."}
          disabled={!isWalletConnected || isTyping}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-none focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 disabled:bg-gray-100 disabled:cursor-not-allowed geist-mono text-sm"
        />
        <button 
          onClick={handleSend}
          disabled={!isWalletConnected || !message.trim() || isTyping}
          className="px-4 py-1.5 font-medium text-white bg-red-600 rounded-none hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors geist-mono border border-red-700 text-sm"
        >
          {isTyping ? 'AI is typing...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ChatInterface; 