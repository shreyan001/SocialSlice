import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import ChatInterface from '@/components/ChatInterface';
import MainContentHeader from '@/components/MainContentHeader';
import SidePanel from '@/components/SidePanel';
import { useSignature } from '@/hooks';

const ChatPage: React.FC = () => {
  const { isConnected } = useSignature();
  const [searchParams] = useSearchParams();

  const handleSendMessage = async (message: string) => {
    if (!isConnected) {
      alert('Not connected');
      return;
    }
    console.warn('Message received:', message);
    // Actual send logic here
  };

  const handleWagerSelect = async (type: 'nft' | 'stablecoin') => {
    if (!isConnected) {
      alert('Not connected');
      return;
    }
    console.warn('Wager type selected:', type);
    // Actual wager selection logic here
  };

  // Send initial message from URL if present
  useEffect(() => {
    const message = searchParams.get('message');
    if (message && isConnected) {
      handleSendMessage(message);
    }
  }, [isConnected, searchParams, handleSendMessage]);

  return (
    <div className="flex h-screen bg-gray-100 geist-mono">
      <SidePanel onNewWager={() => {}} isWalletConnected={isConnected} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainContentHeader />
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          <ChatInterface
            isWalletConnected={isConnected}
            onSendMessage={handleSendMessage}
            onSelectWagerOption={handleWagerSelect}
          />
        </main>
      </div>
    </div>
  );
};

export default ChatPage; 