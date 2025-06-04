import React, { useState } from 'react';
import { ethers } from 'ethers';
import WagerModal from './WagerModal';

interface WagerOptionsProps {
  onSelectOption: (type: 'nft' | 'stablecoin') => void;
  signer?: ethers.Signer;
  aaWalletAddress?: string;
}

const WagerOptions: React.FC<WagerOptionsProps> = ({ 
  onSelectOption,
  signer,
  aaWalletAddress
}) => {
  const [modalType, setModalType] = useState<'nft' | 'stablecoin' | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSelect = (type: 'nft' | 'stablecoin') => {
    setModalType(type);
    setIsModalOpen(true);
    onSelectOption(type);
  };

  return (
    <div className="wager-options">
      <h2>Choose Your Wager Type</h2>
      <div className="options-container">
        <div className="option-card" onClick={() => handleSelect('nft')}>
          <div className="option-icon">🖼️</div>
          <h3>NFT Wager</h3>
          <p>Stake your NFT in this wager</p>
          <button className="option-button">Select NFT</button>
        </div>
        <div className="option-card" onClick={() => handleSelect('stablecoin')}>
          <div className="option-icon">💰</div>
          <h3>Stablecoin Wager</h3>
          <p>Stake USDC or other stablecoins</p>
          <button className="option-button">Select Token</button>
        </div>
      </div>
      <div className="info-box">
        <p>✨ Gas fees are sponsored by the platform!</p>
      </div>

      {modalType && (
        <WagerModal
          type={modalType}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setModalType(null);
          }}
          signer={signer}
          aaWalletAddress={aaWalletAddress}
        />
      )}
    </div>
  );
};

export default WagerOptions; 