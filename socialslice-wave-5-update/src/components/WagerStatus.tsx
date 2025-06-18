import React from 'react';

interface WagerStatusProps {
  type: 'nft' | 'stablecoin';
  amount?: string;
  tokenSymbol?: string;
  nftAddress?: string;
  tokenId?: string;
  status: 'pending' | 'completed' | 'failed';
  isMatching?: boolean;
}

const WagerStatus: React.FC<WagerStatusProps> = ({
  type,
  amount,
  tokenSymbol,
  nftAddress,
  tokenId,
  status,
  isMatching
}) => {
  return (
    <div className="bg-gray-50 p-6 rounded-none border-2 border-red-600">
      <div className="flex items-center gap-3 mb-4">
        {type === 'nft' ? (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ) : (
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )}
        <h3 className="text-lg font-medium">
          {type === 'nft' ? 'NFT Deposit' : 'Token Deposit'}
          {isMatching && ' (Matching)'}
        </h3>
      </div>

      <div className="space-y-2">
        {type === 'nft' ? (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">NFT Address:</span>
              <span className="font-mono">{nftAddress?.slice(0, 6)}...{nftAddress?.slice(-4)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Token ID:</span>
              <span className="font-mono">{tokenId}</span>
            </div>
          </>
        ) : (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Amount:</span>
            <span className="font-mono">{amount} {tokenSymbol}</span>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              status === 'completed' ? 'bg-green-500' :
              status === 'failed' ? 'bg-red-500' :
              'bg-yellow-500 animate-pulse'
            }`} />
            <span className={`text-sm ${
              status === 'completed' ? 'text-green-600' :
              status === 'failed' ? 'text-red-600' :
              'text-yellow-600'
            }`}>
              {status === 'completed' ? 'Deposit Completed' :
              status === 'failed' ? 'Deposit Failed' :
              'Deposit Pending'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WagerStatus;
