import React, { useState, useEffect } from 'react';
import { getSigner, getAAWalletAddress } from '../utils/aaUtils';
import { ethers } from 'ethers';
 
interface WalletConnectProps {
  onWalletConnected?: (eoaAddress: string, aaAddress: string) => void;
}
 
const WalletConnect: React.FC<WalletConnectProps> = ({ onWalletConnected }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [eoaAddress, setEoaAddress] = useState('');
  const [aaAddress, setAaAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  // Check if wallet is already connected on component mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        if (window.ethereum) {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts && accounts.length > 0) {
            await handleConnectWallet();
          }
        }
      } catch (error) {
        console.error("Error checking wallet connection:", error);
      }
    };
    
    checkWalletConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          handleConnectWallet();
        }
      });
    }
    
    return () => {
      // Clean up event listeners
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {});
      }
    };
  }, []);
 
  const handleConnectWallet = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Get signer from wallet
      const signer = await getSigner();
      if (!signer) {
        throw new Error("Failed to get signer from wallet");
      }
      
      // Get AA wallet address
      const aaWalletAddress = await getAAWalletAddress(signer);
      if (!aaWalletAddress) {
        throw new Error("Failed to get AA wallet address");
      }
      
      // Get EOA address
      const address = await signer.getAddress();
      setEoaAddress(address);
      setAaAddress(aaWalletAddress);
      setIsConnected(true);
      
      // Call callback if provided
      if (onWalletConnected) {
        onWalletConnected(address, aaWalletAddress);
      }
      
    } catch (error: any) {
      console.error("Error connecting wallet:", error);
      setError(error.message || "Failed to connect wallet");
      setIsConnected(false);
      setEoaAddress('');
      setAaAddress('');
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Disconnect wallet
   */
  const disconnectWallet = () => {
    setIsConnected(false);
    setEoaAddress('');
    setAaAddress('');
  };

  return (
    <div className="wallet-container">
      <h2>Account Abstraction Wallet</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="connect-section">
        {!isConnected ? (
          <button 
            onClick={handleConnectWallet}
            disabled={isLoading}
            className="connect-button"
          >
            {isLoading ? "Connecting..." : "Connect Wallet"}
          </button>
        ) : (
          <button
            onClick={disconnectWallet}
            className="disconnect-button"
          >
            Disconnect
          </button>
        )}
      </div>
      
      {isConnected && (
        <div className="wallet-info">
          <div className="address-item">
            <strong>EOA Address:</strong> 
            <span className="address">{eoaAddress}</span>
          </div>
          <div className="address-item">
            <strong>AA Wallet Address:</strong> 
            <span className="address">{aaAddress}</span>
          </div>
          <p className="note">
            This AA wallet is counterfactual and will be deployed on your first transaction.
          </p>
        </div>
      )}
    </div>
  );
};

export default WalletConnect; 