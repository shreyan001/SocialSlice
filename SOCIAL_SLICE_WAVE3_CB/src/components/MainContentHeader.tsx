import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MainContentHeaderProps {
  // Props if needed in the future, e.g., for dynamic titles or icons
}

const MainContentHeader: React.FC<MainContentHeaderProps> = () => {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <div className="h-16 flex items-center justify-between px-6 border-b border-gray-300 bg-white geist-mono">
      <div className="flex items-center cursor-pointer" onClick={handleLogoClick}>
        <div className="w-10 h-10">
          <img src="/sociallogo.png" alt="SocialSlice" className="w-full h-full " />
        </div>
        <span className="text-xl font-semibold text-red-600 ml-2">SocialSlice</span>
      </div>
      <div className="flex items-center space-x-3">
        <button className="p-1.5 rounded-none hover:bg-gray-100 border border-transparent hover:border-gray-300">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
          </svg>
        </button>
        <button className="p-1.5 rounded-none hover:bg-gray-100 border border-transparent hover:border-gray-300">
         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-600">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.75h16.5m-16.5 4.5h16.5m-16.5 4.5h16.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MainContentHeader; 