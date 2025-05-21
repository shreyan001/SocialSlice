import React, { useCallback } from 'react';
import { useSignature } from '@/hooks';
import ChatInterface from '@/components/ChatInterface';

const Home: React.FC = () => {
  const { isConnected } = useSignature();

  const handleSendMessage = useCallback(async (message: string) => {
    if (!isConnected) {
      alert('not connected');
      return;
    }

    try {
      // TODO: Implement actual message handling logic
      console.warn('Message received:', message);
    } catch (error) {
      console.error('Execution error:', error);
    }
  }, [isConnected]);

  const handleWagerSelect = useCallback(async (type: 'nft' | 'stablecoin') => {
    if (!isConnected) {
      alert('not connected');
      return;
    }

    try {
      // TODO: Implement wager selection logic
      console.warn('Wager type selected:', type);
    } catch (error) {
      console.error('Execution error:', error);
    }
  }, [isConnected]);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">AI Wagers</h1>
      </div>

      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        <ChatInterface
          isWalletConnected={isConnected}
          onSendMessage={handleSendMessage}
          onSelectWagerOption={handleWagerSelect}
        />
      </div>
    </div>
  );
};

export default Home;