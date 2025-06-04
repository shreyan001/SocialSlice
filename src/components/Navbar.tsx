import React from 'react';
import { ethers } from 'ethers';

interface NavbarProps {
  isWalletConnected: boolean;
  aaAddress: string;
  onConnectWallet: () => Promise<void>;
}

const Navbar: React.FC<NavbarProps> = ({ isWalletConnected, aaAddress, onConnectWallet }) => {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={process.env.PUBLIC_URL + '/social.png'} alt="SocialSlice" className="navbar-logo" />
        <h1 className="navbar-title">SocialSlice</h1>
      </div>
      <div className="navbar-wallet">
        {!isWalletConnected ? (
          <button onClick={onConnectWallet} className="connect-button">
            Connect Wallet
          </button>
        ) : (
          <div className="wallet-info">
            <span className="wallet-badge">Connected</span>
            <button className="aa-address-button">
              {aaAddress.substring(0, 6)}...{aaAddress.substring(38)}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 