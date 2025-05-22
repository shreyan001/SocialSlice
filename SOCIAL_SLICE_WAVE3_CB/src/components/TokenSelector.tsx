import React, { useState } from 'react';
import { ethers } from 'ethers';
import { PaymasterToken } from '@/types';
import { useSignature } from '@/hooks';

interface TokenSelectorProps {
  selectedToken: PaymasterToken | null;
  onSelect: (token: PaymasterToken | null) => void;
  tokens?: PaymasterToken[];
}

const COMMON_TOKENS: PaymasterToken[] = [
  {
    token: '0x4200000000000000000000000000000000000006', // WETH
    symbol: 'WETH',
    decimals: 18,
    price: '0'
  },
  {
    token: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    symbol: 'USDC',
    decimals: 6,
    price: '0'
  },
  {
    token: '0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb', // DAI
    symbol: 'DAI',
    decimals: 18,
    price: '0'
  }
];

const TokenSelector: React.FC<TokenSelectorProps> = ({ 
  selectedToken, 
  onSelect, 
  tokens = COMMON_TOKENS 
}) => {
  const [customToken, setCustomToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { AAaddress } = useSignature();

  const handleCustomTokenAdd = async () => {
    if (!customToken || !ethers.utils.isAddress(customToken)) {
      setError('Invalid token address');
      return;
    }

    try {
      const provider = new ethers.providers.JsonRpcProvider(process.env.NEXT_PUBLIC_RPC_URL);
      const tokenContract = new ethers.Contract(
        customToken,
        [
          'function symbol() view returns (string)',
          'function decimals() view returns (uint8)',
          'function balanceOf(address) view returns (uint256)'
        ],
        provider
      );

      const [symbol, decimals, balance] = await Promise.all([
        tokenContract.symbol(),
        tokenContract.decimals(),
        AAaddress ? tokenContract.balanceOf(AAaddress) : ethers.constants.Zero
      ]);

      if (balance.eq(0)) {
        setError('No balance found for this token');
        return;
      }

      const newToken: PaymasterToken = {
        token: customToken,
        symbol,
        decimals,
        price: '0'
      };

      onSelect(newToken);
      setCustomToken('');
      setError(null);
    } catch (err) {
      setError('Failed to load token info');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {tokens.map((token) => (
          <button
            key={token.token}
            onClick={() => onSelect(token)}
            className={`px-3 py-1.5 text-sm border rounded-none transition-colors ${
              selectedToken?.token === token.token
                ? 'bg-red-600 text-white border-red-700'
                : 'border-gray-300 hover:border-red-600'
            }`}
          >
            {token.symbol}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={customToken}
          onChange={(e) => setCustomToken(e.target.value)}
          placeholder="Enter token address"
          className="flex-1 p-2 border border-gray-300 rounded-none"
        />
        <button
          onClick={handleCustomTokenAdd}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-none"
        >
          Add
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600">
          {error}
        </div>
      )}

      {selectedToken && (
        <div className="p-2 bg-gray-50 rounded-none">
          <div className="text-sm font-medium">{selectedToken.symbol}</div>
          <div className="text-xs text-gray-500">{selectedToken.token}</div>
        </div>
      )}
    </div>
  );
};

export default TokenSelector; 