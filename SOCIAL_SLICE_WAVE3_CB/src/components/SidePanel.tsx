import React from 'react';

interface SidePanelProps {
  onNewWager: () => void;
  isWalletConnected: boolean;
}

const SidePanel: React.FC<SidePanelProps> = ({ onNewWager, isWalletConnected }) => {
  const wagers = [
    { id: 1, name: 'Community Wager #1' },
    { id: 2, name: 'Active Personal Wager' },
    { id: 3, name: 'Completed Wager' },
  ];

  return (
    <div className="w-64 h-full bg-gray-50 p-4 border-r border-gray-300 flex flex-col geist-mono">
      <h2 className="text-xl font-semibold mb-6 text-gray-700">Wagers</h2>
      
      <div className="flex-grow space-y-2 overflow-y-auto">
        {wagers.map((wager) => (
          <div 
            key={wager.id} 
            className="p-2 rounded-none hover:bg-gray-200 cursor-pointer border border-gray-300 text-sm"
          >
            {wager.name}
          </div>
        ))}
        {/* Add more wager items or dynamic loading here */}
      </div>

      <button
        onClick={onNewWager}
        disabled={!isWalletConnected}
        className="w-full mt-6 px-4 py-3 font-medium text-white bg-red-600 rounded-none hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors border border-red-700 text-sm"
      >
        New Wager
      </button>
    </div>
  );
};

export default SidePanel; 