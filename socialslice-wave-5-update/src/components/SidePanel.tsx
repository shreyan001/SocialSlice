import React from 'react';
import { useSignature } from '@/hooks';

interface SidePanelProps {
  isWalletConnected?: boolean;
}

const SidePanel: React.FC<SidePanelProps> = () => {
  const { isConnected } = useSignature();
    const menuItems = [
    { name: 'Home', icon: 'home' },
    { name: 'Chat', icon: 'chat' },
    { name: 'History', icon: 'history' },
  ];

  return (
    <div className="hidden md:flex md:w-64 bg-gray-800 text-white flex-col">
      <div className="flex-1">
        <nav className="mt-6">
          {menuItems.map((item) => (
            <a 
              key={item.name}
              href="#" 
              className="flex items-center py-3 px-6 hover:bg-gray-700 transition-colors"
            >
              <span className="mr-3">
                {item.icon === 'home' && (
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )}
                {item.icon === 'chat' && (
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                )}                {item.icon === 'history' && (
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </span>
              <span>{item.name}</span>
            </a>
          ))}
        </nav>
      </div>
      
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center text-sm">
          <div className={`w-2 h-2 ${isConnected ? 'bg-green-500' : 'bg-gray-500'} rounded-full mr-2`}></div>
          <span>{isConnected ? 'Wallet Connected' : 'Wallet Disconnected'}</span>
        </div>
      </div>
    </div>
  );
};

export default SidePanel;