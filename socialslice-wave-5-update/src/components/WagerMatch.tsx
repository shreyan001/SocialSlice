import React, { useState } from 'react';
import WagerStatus from './WagerStatus';
import { useSignature } from '@/hooks';

interface WagerMatchProps {
  wagerType: 'nft' | 'stablecoin';
  user1Deposit: {
    type: 'nft' | 'stablecoin';
    amount?: string;
    tokenSymbol?: string;
    nftAddress?: string;
    tokenId?: string;
  };
}

const WagerMatch: React.FC<WagerMatchProps> = ({ wagerType, user1Deposit }) => {
  const { isConnected } = useSignature();
  const [user2DepositStatus] = useState<
    'pending' | 'completed' | 'failed' | null
  >(null);

  const handleMatchWager = () => {
    if (!isConnected) {
      console.warn('Wallet not connected');
      return;
    }
  };



  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="min-h-[400px] w-full max-w-4xl bg-white rounded-none p-6">
        <div className="grid grid-cols-2 gap-8">
          {/* Left side: User 1's deposit status */}
          <div className="border-r border-gray-200 pr-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">User 1's Deposit</h2>
            <WagerStatus
              type={user1Deposit.type}
              amount={user1Deposit.amount}
              tokenSymbol={user1Deposit.tokenSymbol}
              nftAddress={user1Deposit.nftAddress}
              tokenId={user1Deposit.tokenId}
              status="completed"
            />
          </div>

          {/* Right side: User 2's options */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Match This Wager</h2>
            {user2DepositStatus ? (
              <WagerStatus
                type={user1Deposit.type}
                amount={user1Deposit.amount}
                tokenSymbol={user1Deposit.tokenSymbol}
                nftAddress={user1Deposit.nftAddress}
                tokenId={user1Deposit.tokenId}
                status={user2DepositStatus}
              />
            ) : (
              <div className="bg-gray-50 p-6 rounded-none border-2 border-red-600">
                <p className="text-gray-600 mb-4">
                  {wagerType === 'nft' 
                    ? 'Match this NFT wager by depositing your NFT'
                    : 'Match this token wager by depositing the same amount'}
                </p>
                <button
                  onClick={handleMatchWager}
                  disabled={!isConnected}
                  className="w-full px-6 py-3 text-base font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors geist-mono border border-red-700 rounded-none flex items-center justify-center gap-3"
                >
                  {!isConnected && (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                  {isConnected ? 'Match This Wager' : 'Connect Wallet to Match'}
                </button>
                {!isConnected && (
                  <p className="text-sm text-red-600 mt-2 text-center">
                    Please connect your wallet to match this wager
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* WagerFlow for User 2's deposit */}
    
      </div>
    </div>
  );
};

export default WagerMatch;
