import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSignature } from '@/hooks';
import SidePanel from '@/components/SidePanel';
import MainContentHeader from '@/components/MainContentHeader';

const Home: React.FC = () => {
  const { isConnected } = useSignature();
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleNewWager = () => {
    if (isConnected) {
      navigate(`/chat?message=${encodeURIComponent(message)}`);
    } else {
      alert('Please connect your wallet to start a new wager.');
    }
  };

  const handleStartChat = () => {
    if (!message.trim()) return;
    
    if (isConnected) {
      navigate(`/chat?message=${encodeURIComponent(message)}`);
    } else {
      alert('Please connect your wallet to start chatting.');
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 geist-mono">
      <SidePanel onNewWager={handleNewWager} isWalletConnected={isConnected} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainContentHeader />
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          <div className="h-full flex flex-col justify-center items-center">
            <div className="text-center mb-10">
              <h1 className="text-3xl font-semibold text-gray-800 mb-2">How can I help you today?</h1>
              <p className="text-gray-500 max-w-md mx-auto">
                Select a starting point below, or type your request to begin creating your wager.
              </p>
            </div>

            {/* Feature Boxes */}
            <div className="grid grid-cols-3 gap-6 mb-10 w-full max-w-4xl">
              {/* AI Escrow Wagers */}
              <div className="p-6 border border-gray-200 rounded-none hover:border-red-600 transition-colors">
                <div className="w-8 h-8 mb-4 flex items-center justify-center">
                  {/* Shield/escrow icon */}
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4l7 4v4c0 5-3.5 9-7 9s-7-4-7-9V8l7-4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">AI Escrow Wagers</h3>
                <p className="text-gray-600">Secure your wager funds in a smart contract with AI-powered outcome verification. No trust required—just transparency.</p>
              </div>

              {/* Gasless Social Betting */}
              <div className="p-6 border border-gray-200 rounded-none hover:border-red-600 transition-colors">
                <div className="w-8 h-8 mb-4 flex items-center justify-center">
                  {/* Gasless icon */}
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16v-1a4 4 0 014-4h10a4 4 0 014 4v1" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 010 7.75" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Gasless Social Betting</h3>
                <p className="text-gray-600">Place and accept wagers with friends—no gas fees, thanks to NERO's paymaster and account abstraction.</p>
              </div>

              {/* Multi-Token Support */}
              <div className="p-6 border border-gray-200 rounded-none hover:border-red-600 transition-colors">
                <div className="w-8 h-8 mb-4 flex items-center justify-center">
                  {/* Coins icon */}
                  <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <ellipse cx="12" cy="7" rx="8" ry="3" />
                    <path d="M4 7v6c0 1.657 3.582 3 8 3s8-1.343 8-3V7" />
                    <path d="M4 13v4c0 1.657 3.582 3 8 3s8-1.343 8-3v-4" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Multi-Token Support</h3>
                <p className="text-gray-600">Create and settle wagers using your favorite ERC-20 tokens. Flexible, fast, and user-friendly.</p>
              </div>
            </div>

            <div className="w-full max-w-2xl flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={isConnected ? "Type your message..." : "Connect wallet to chat..."}
                disabled={!isConnected}
                onKeyPress={(e) => e.key === 'Enter' && handleStartChat()}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-none focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-red-600 disabled:bg-gray-100 disabled:cursor-not-allowed geist-mono"
              />
              <button 
                onClick={handleStartChat}
                disabled={!isConnected || !message.trim()}
                className="px-6 py-2 font-medium text-white bg-red-600 rounded-none hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors geist-mono border border-red-700"
              >
                Start Chat
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;