import React from 'react';
import { useParams } from 'react-router-dom';
import MainContentHeader from '@/components/MainContentHeader';
import SidePanel from '@/components/SidePanel';
import { useSignature } from '@/hooks';

interface WagerDetailsProps {
  type: 'nft' | 'stablecoin';
  amount?: string;
  tokenSymbol?: string;
  nftAddress?: string;
  tokenId?: string;
  status: 'pending' | 'completed' | 'failed';
}

const PlayerContainer: React.FC<{
  title: string;
  details: WagerDetailsProps;
  isPlayer2?: boolean;
}> = ({ title, details, isPlayer2 }) => {
  return (
    <div className={`p-6 ${isPlayer2 ? '' : 'border-r'} border-gray-200`}>
      <h2 className="text-xl font-semibold mb-4 text-gray-800">{title}</h2>
      <div className="bg-gray-50 p-6 rounded-none border-2 border-red-600">
        <div className="flex items-center gap-3 mb-4">
          {details.type === 'nft' ? (
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
          <h3 className="text-lg font-medium">
            {details.type === 'nft' ? 'NFT Wager' : 'Token Wager'}
          </h3>
        </div>

        <div className="space-y-2">
          {details.type === 'nft' ? (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">NFT Address:</span>
                <span className="font-mono">{details.nftAddress?.slice(0, 6)}...{details.nftAddress?.slice(-4)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Token ID:</span>
                <span className="font-mono">{details.tokenId}</span>
              </div>
            </>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Amount:</span>
              <span className="font-mono">{details.amount} {details.tokenSymbol}</span>
            </div>
          )}
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                details.status === 'completed' ? 'bg-green-500' :
                details.status === 'failed' ? 'bg-red-500' :
                'bg-yellow-500 animate-pulse'
              }`} />
              <span className={`text-sm ${
                details.status === 'completed' ? 'text-green-600' :
                details.status === 'failed' ? 'text-red-600' :
                'text-yellow-600'
              }`}>
                {details.status === 'completed' ? 'Deposit Completed' :
                details.status === 'failed' ? 'Deposit Failed' :
                'Deposit Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WagerPage: React.FC = () => {
  const { wagerId } = useParams();
  const { isConnected } = useSignature();

  // Mock data - in real app, fetch this based on wagerId
  const wagerDetails: WagerDetailsProps = {
    type: 'stablecoin',
    amount: '100',
    tokenSymbol: 'SLICE',
    status: 'completed'
  };

  const player2Details: WagerDetailsProps = {
    ...wagerDetails,
    status: 'pending'
  };

  return (
    <div className="flex h-screen bg-gray-100 geist-mono">
      <SidePanel />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <MainContentHeader onBack={() => window.history.back()} />
        
        <div className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto py-8">
            <div className="bg-white rounded-none shadow-sm">
              <div className="border-b border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-2xl font-bold text-gray-900">Wager #{wagerId}</h1>
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-500'}`} />
                    <span className="text-sm text-gray-600">
                      {isConnected ? 'Connected to Wallet' : 'Wallet Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2">
                <PlayerContainer 
                  title="Player 1" 
                  details={wagerDetails} 
                />
                <PlayerContainer 
                  title="Player 2" 
                  details={player2Details}
                  isPlayer2 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WagerPage;
