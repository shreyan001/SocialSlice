import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { getSigner, getAAWalletAddress } from './utils/aaUtils';
import Navbar from './components/Navbar';
import ChatInterface from './components/ChatInterface';
import './App.css';

const App: React.FC = () => {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [aaAddress, setAaAddress] = useState('');

  const handleConnectWallet = async () => {
    try {
      const signer = await getSigner();
      const aaWalletAddress = await getAAWalletAddress(signer);
      
      setAaAddress(aaWalletAddress);
      setIsWalletConnected(true);
      toast.success('Wallet connected successfully!');
    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      toast.error(error.message || 'Failed to connect wallet');
    }
  };

  const handleMessage = async (message: string) => {
    // For now, just acknowledge the message
    console.log('Message received:', message);
  };

  const handleWagerOption = (type: 'nft' | 'stablecoin') => {
    // For now, just show a toast
    toast.info(`Selected ${type} wager. Setting up deposit...`);
  };

  return (
    <div className="app">
      <Navbar 
        isWalletConnected={isWalletConnected}
        aaAddress={aaAddress}
        onConnectWallet={handleConnectWallet}
      />
      
      <main className="main-content">
        <ChatInterface 
          isWalletConnected={isWalletConnected}
          onSendMessage={handleMessage}
          onSelectWagerOption={handleWagerOption}
        />
      </main>

      <ToastContainer position="bottom-right" />
    </div>
  );
};

export default App; 