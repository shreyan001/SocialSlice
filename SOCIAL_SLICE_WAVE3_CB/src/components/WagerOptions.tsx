import React, { useState } from 'react';
import WagerFlow from './WagerFlow';

interface WagerOptionsProps {
  onSelectOption: (type: 'nft' | 'stablecoin') => void;
}

const WagerOptions: React.FC<WagerOptionsProps> = ({ onSelectOption }) => {
  const [showWagerFlow, setShowWagerFlow] = useState(false);
  const [selectedType, setSelectedType] = useState<'nft' | 'stablecoin' | null>(null);

  const handleOptionSelect = (type: 'nft' | 'stablecoin') => {
    setSelectedType(type);
    setShowWagerFlow(true);
    onSelectOption(type);
  };

  const handleClose = () => {
    setShowWagerFlow(false);
    setSelectedType(null);
  };

  return (
    <>
      <div className="flex gap-4">
        <button 
          onClick={() => handleOptionSelect('nft')}
          className="px-4 py-2 font-medium text-white bg-red-600 rounded-none hover:bg-red-700 transition-colors geist-mono border border-red-700"
        >
          NFT Wager
        </button>
        <button 
          onClick={() => handleOptionSelect('stablecoin')}
          className="px-4 py-2 font-medium text-white bg-red-600 rounded-none hover:bg-red-700 transition-colors geist-mono border border-red-700"
        >
          Stablecoin Wager
        </button>
      </div>

      {showWagerFlow && selectedType && (
        <WagerFlow type={selectedType} onClose={handleClose} />
      )}
    </>
  );
};

export default WagerOptions; 