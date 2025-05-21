import React from 'react';

interface WagerOptionsProps {
  onSelectOption: (type: 'nft' | 'stablecoin') => void;
}

const WagerOptions: React.FC<WagerOptionsProps> = ({ onSelectOption }) => {
  return (
    <div className="flex gap-4">
      <button 
        onClick={() => onSelectOption('nft')}
        className="px-4 py-2 font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
      >
        NFT Wager
      </button>
      <button 
        onClick={() => onSelectOption('stablecoin')}
        className="px-4 py-2 font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
      >
        Stablecoin Wager
      </button>
    </div>
  );
};

export default WagerOptions; 