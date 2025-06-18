import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChatInterface } from '@/components/ChatInterface';
import MainContentHeader from '@/components/MainContentHeader';
import SidePanel from '@/components/SidePanel';

const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [initialMessage, setInitialMessage] = useState<string | undefined>(undefined);

  // Get initial message from URL params
  useEffect(() => {
    const message = searchParams.get('message');
    if (message) {
      setInitialMessage(message);
    } else {
      // Optionally clear it if the param is removed
      setInitialMessage(undefined); 
    }
  }, [searchParams]);

  return (
    <div className="flex h-screen bg-gray-100 geist-mono overflow-hidden"> {/* Added overflow-hidden */}
      <SidePanel />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainContentHeader />
        <main className="flex-1 overflow-hidden bg-white"> {/* Removed padding that was causing issues */}
          <div className="h-full"> {/* Added wrapper div with h-full */}
            <ChatInterface
              initialInputText={initialMessage}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default ChatPage;