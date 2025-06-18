'use client'

import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import WagerFlow from './WagerFlow';
import { ScrollArea } from '@/components/ui/custom-scroll-area';
import { useSignature } from '@/hooks';

// --- Message Components ---
const AIMessageText: React.FC<{ content: string | React.ReactNode }> = ({ content }) => (
  <div className="max-w-[60%] p-2.5 rounded-none mb-1.5 geist-mono border border-red-600 bg-white text-gray-800 text-sm">
    {typeof content === 'string' ? (
      <ReactMarkdown
        components={{
          // Custom styling for markdown elements
          h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
          h2: ({children}) => <h2 className="text-base font-semibold mb-2">{children}</h2>,
          h3: ({children}) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
          p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({children}) => <strong className="font-semibold">{children}</strong>,
          em: ({children}) => <em className="italic">{children}</em>,
          ul: ({children}) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
          ol: ({children}) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
          li: ({children}) => <li className="mb-1">{children}</li>,
          code: ({children}) => <code className="bg-gray-100 px-1 rounded text-xs">{children}</code>,
          pre: ({children}) => <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mb-2">{children}</pre>,
          blockquote: ({children}) => <blockquote className="border-l-2 border-gray-300 pl-2 italic mb-2">{children}</blockquote>,
        }}
      >
        {content}
      </ReactMarkdown>
    ) : (
      content
    )}
  </div>
);

const HumanMessageText: React.FC<{ content: string }> = ({ content }) => (
  <div className="max-w-[60%] p-2.5 rounded-none mb-1.5 geist-mono border border-red-700 bg-red-600 text-white text-sm ml-auto">
    {content}
  </div>
);

const SmartContractDisplay: React.FC<{ contractCode: string }> = ({ contractCode }) => (
  <pre className="p-2 my-1 text-sm bg-gray-800 rounded-lg text-green-400 self-start max-w-xl overflow-x-auto geist-mono">
    {contractCode}
  </pre>
);

interface ChatInterfaceProps {
  initialInputText?: string;
}

const mapEventToComponent = (id: string, type: string, props: any): React.ReactElement | null => {
  switch (type) {
    case 'AIMessageText':
      return <AIMessageText key={id} {...props} />;
    case 'SmartContractDisplay':
      return <SmartContractDisplay key={id} {...props} />;
    default:
      console.warn('Unknown component type:', type);
      return null;
  }
};

export function ChatInterface({ initialInputText }: ChatInterfaceProps) {
  const initialAIMessage = `Hi Iam **SocialSlice AI**, a trustless social wager platform assistant. I help people create secure peer-to-peer bets on verifiable events! 🎯

**What I Do:**
I facilitate trustless wagers between friends using smart contracts. Whether it's sports, politics, or custom events - I'll help you set up fair, automated betting.

💡 **Quick Examples:**
- "I want to bet $10 with Sarah on tomorrow's soccer match"
- "Can Mike and I wager on the election results?"
- "Set up a bet on tonight's basketball game"

Is there something specific you'd like to know about creating wagers, or would you like to set up a bet right now?`;

  const [input, setInput] = useState<string>(initialInputText || "");
  const [history, setHistory] = useState<[role: string, content: string][]>([
    ["ai", initialAIMessage]
  ]);
  const [elements, setElements] = useState<React.JSX.Element[]>(() => [
    <div key="init-ai" className="flex flex-col gap-1 w-full max-w-fit mr-auto">
      <AIMessageText content={initialAIMessage} />
    </div>
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showWagerFlow, setShowWagerFlow] = useState(false);
  const [wagerFlowType] = useState<'nft' | 'stablecoin'>('stablecoin');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentStreamRef = useRef<string>(''); // Use ref to avoid stale closures
  const { isConnected, AAaddress } = useSignature();

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (initialInputText !== undefined) {
      setInput(initialInputText);
    }
  }, [initialInputText]);

  useEffect(() => {
    scrollToBottom();
  }, [elements, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const currentInput = input;
    setInput("");
    setIsTyping(true);
    
    // Reset streaming ref
    currentStreamRef.current = '';

    const newHumanMessageKey = `human-${Date.now()}`;
    const humanMessageElement = (
      <div className="flex flex-col items-end w-full gap-1 mt-auto" key={newHumanMessageKey}>
        <HumanMessageText content={currentInput} />
      </div>
    );

    setElements(prev => [...prev, humanMessageElement]);

    const updatedHistory: [string, string][] = [...history, ["human", currentInput]];
    setHistory(updatedHistory);

    scrollToBottom();

    try {
      const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      
      // Build URL with wallet address parameter
      const baseUrl = `${VITE_API_BASE_URL}/api/agent`;
      const params = new URLSearchParams({
        input: currentInput,
        chat_history: JSON.stringify(updatedHistory)
      });
      
      // Add wallet address if available and user is connected
      if (isConnected && AAaddress) {
        params.append('wallet_address', AAaddress);
        console.warn('Sending wallet address to API:', AAaddress);
      } else {
        console.warn('No wallet address available - user not connected or address not set');
      }
      
      const eventSource = new EventSource(`${baseUrl}?${params.toString()}`);
      
      let accumulatedAiContent = "";
      let currentStreamingElementKey: string | null = null;

      eventSource.onmessage = (event: MessageEvent) => {
        try {
          const streamData = JSON.parse(event.data);
          
          console.warn('Chat Response:', {
            type: streamData.type,
            action: streamData.action,
            payload: streamData.payload,
            timestamp: new Date().toISOString(),
            rawData: event.data
          });

          if (streamData.type === 'streamEnd') {
            eventSource.close();

            setIsTyping(false);
            
            if (accumulatedAiContent) {
              // Clean content by removing any wager node markers
              const cleanContent = accumulatedAiContent.replace(/\[\/WAGER_NODE\]/g, '').trim();

              // Update the final message with clean content
              if (currentStreamingElementKey) {
                setElements(prev => prev.map(el => 
                  el.key === currentStreamingElementKey 
                    ? <div key={currentStreamingElementKey} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
                        <AIMessageText content={cleanContent} />
                      </div>
                    : el
                ));
              }

              setHistory(prevHistory => [...prevHistory, ["ai", cleanContent]]);

              // Removed wager options display
              console.warn('AI response completed');
            }
            
            accumulatedAiContent = "";
            currentStreamingElementKey = null;
            scrollToBottom();
            return;
          }

          if (streamData.type === 'error') {
            const errorElement = (
              <div key={`error-${Date.now()}`} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
                <div className="text-red-400 p-2 my-1 self-start geist-mono">
                  Error: {streamData.payload?.message || "Agent error."}
                </div>
              </div>
            );
            setElements(prev => [...prev, errorElement]);
            setIsTyping(false);
            return;
          }

          if (!streamData.action || !streamData.payload || !streamData.payload.type) {
            console.warn('Invalid stream data structure:', streamData);
            return;
          }

          const content = streamData.payload.props.content;

          if (streamData.payload.type === 'AIMessageText') {
            accumulatedAiContent = content;
            currentStreamRef.current = content;
            
            // Clean content by removing any wager node markers
            const cleanContent = content.replace(/\[\/WAGER_NODE\]/g, '').trim();

            // Update or create streaming message element
            setElements(prev => {
              if (currentStreamingElementKey) {
                // Update existing streaming element
                return prev.map(el => 
                  el.key === currentStreamingElementKey 
                    ? <div key={currentStreamingElementKey} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
                        <AIMessageText content={cleanContent} />
                      </div>
                    : el
                );
              } else {
                // Create new streaming element
                currentStreamingElementKey = `ai-stream-${Date.now()}`;
                return [...prev, 
                  <div key={currentStreamingElementKey} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
                    <AIMessageText content={cleanContent} />
                  </div>
                ];
              }
            });
          } else {
            // Handle other component types (like SmartContractDisplay)
            const newElementKey = `ai-stream-${streamData.payload.type}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
            const component = mapEventToComponent(newElementKey, streamData.payload.type, streamData.payload.props);

            if (component) {
              setElements(prev => [...prev,
                <div className="flex flex-col gap-1 w-full max-w-fit mr-auto" key={newElementKey}>
                  {component}
                </div>
              ]);
              setTimeout(() => scrollToBottom(), 100);
            }
          }
        } catch (error) {
          console.error("Error processing stream message:", error, "Raw data:", event.data);
          setIsTyping(false);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        setIsTyping(false);
        const errorElement = (
          <div key={`connection-error-${Date.now()}`} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
            <div className="max-w-[70%] p-2.5 rounded-none mb-1.5 geist-mono border border-red-700 bg-red-100 text-red-700 text-sm">
              Error connecting to the agent. Please try again.
            </div>
          </div>
        );
        setElements(prev => [...prev, errorElement]);
      };
    } catch (error) {
      console.error("Error in chat:", error);
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      <ScrollArea className="flex-1 h-[calc(100vh-116px)]">
        <div className="px-4 pt-4 pb-4 pr-12">
          <div className="flex flex-col space-y-3">
            {elements.map((el, index) => (
              <div key={el.key || `msg-wrapper-${index}`}>
                {el}
              </div>
            ))}
            

            
            {isTyping && (
              <div>
                <div className="max-w-[70%] p-2.5 rounded-none bg-white text-gray-800 geist-mono border border-gray-200">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce"></span>
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:200ms]"></span>
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-bounce [animation-delay:400ms]"></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-px" />
          </div>
        </div>
      </ScrollArea>
      
      {/* WagerFlow Modal */}
      {showWagerFlow && (
        <WagerFlow 
          type={wagerFlowType}
          onClose={() => setShowWagerFlow(false)}
          //@ts-ignore
          onDepositComplete={() => {
            setShowWagerFlow(false);
            const successKey = `wager-success-${Date.now()}`;
            setElements(prev => [...prev,
              <div key={successKey} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
                <AIMessageText content="Wager deposited successfully! Your wager is now active." />
              </div>
            ]);
            setTimeout(scrollToBottom, 100);
          }}
          onDepositFailed={() => {
            setShowWagerFlow(false);
            const failedKey = `wager-failed-${Date.now()}`;
            setElements(prev => [...prev,
              <div key={failedKey} className="flex flex-col gap-1 w-full max-w-fit mr-auto">
                <AIMessageText content="Wager deposit failed. Please try again." />
              </div>
            ]);
            setTimeout(scrollToBottom, 100);
          }}
        />
      )}
      
      <div className="flex gap-2 p-3 border-t border-gray-800 w-full">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={isTyping}
          onKeyPress={(e) => e.key === 'Enter' && !isTyping && handleSend()}
          className="flex-1 px-3 py-1.5 border border-gray-300 rounded-none focus:outline-none focus:ring-1 focus:ring-red-600 focus:border-red-600 disabled:bg-gray-100 disabled:cursor-not-allowed geist-mono text-sm bg-white text-gray-900"
        />
        <div className="relative group">
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isTyping || !isConnected}
            className={`px-4 py-1.5 font-medium text-white rounded-none transition-colors geist-mono border text-sm flex items-center gap-2
              ${!isConnected 
                ? 'bg-gray-500 hover:bg-gray-600 border-gray-600' 
                : 'bg-red-600 hover:bg-red-700 border-red-700'} 
              disabled:bg-gray-400 disabled:cursor-not-allowed`}
          >
            {!isConnected && (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
            )}
            {isTyping ? 'AI is typing...' : 'Send'}
          </button>
          {!isConnected && (
            <div className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Please connect your wallet to interact with the chat
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
