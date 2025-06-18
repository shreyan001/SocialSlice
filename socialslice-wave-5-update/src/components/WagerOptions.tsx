import React, { useState, useEffect } from 'react';
import WagerFlow from './WagerFlow'; // Adjust the import path as necessary
interface WagerOptionsProps {
  onSelectOption: (type: 'nft' | 'stablecoin') => void;
}

const WagerOptions: React.FC<WagerOptionsProps> = ({ onSelectOption }) => {
  const [showWagerFlow, setShowWagerFlow] = useState(false);
  const [selectedType, setSelectedType] = useState<'nft' | 'stablecoin' | null>(null);

  // Add useEffect to log when component mounts
  useEffect(() => {
    console.warn('WagerOptions component mounted');
  }, []);

  const handleOptionSelect = (type: 'nft' | 'stablecoin') => {
    console.warn(`Option selected: ${type}`);
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
      {/* Debug info */}
      <div className="text-xs text-gray-500 mb-2">WagerOptions Component Rendered</div>
      
      <div className="flex flex-row gap-4 w-full">
        <button 
          onClick={() => handleOptionSelect('nft')}
          className="flex-1 px-6 py-3 text-base font-medium text-gray-800 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors geist-mono border-2 border-red-600 rounded-none text-center flex items-center justify-center gap-3 shadow-sm"
        >
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          NFT Wager
        </button>
        <button 
          onClick={() => handleOptionSelect('stablecoin')}
          className="flex-1 px-6 py-3 text-base font-medium text-gray-800 bg-white hover:bg-gray-50 active:bg-gray-100 transition-colors geist-mono border-2 border-red-600 rounded-none text-center flex items-center justify-center gap-3 shadow-sm"
        >
          <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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