import React from 'react';
import SidePanel from '@/components/SidePanel';
import MainContentHeader from '@/components/MainContentHeader';
import { ChatInterface } from '@/components/ChatInterface';

const Home: React.FC = () => {
  return (
    <div className="flex h-screen bg-gray-100 geist-mono">
      <SidePanel />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainContentHeader />
        <ChatInterface />
      </div>
    </div>
  );
};

export default Home; 