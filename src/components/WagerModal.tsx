import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { depositERC20, depositNFT, checkTokenBalance } from '../utils/aaUtils';

interface WagerModalProps {
  type: 'nft' | 'stablecoin';
  isOpen: boolean;
  onClose: () => void;
  signer?: ethers.Signer;
  aaWalletAddress?: string;
}

interface TokenInfo {
  address: string;
  symbol: string;
  balance: ethers.BigNumber;
  decimals: number;
  formattedBalance: string;
}

// ERC20 ABI for token interactions
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
];

const SUPPORTED_TOKENS = {
  USDT: '0x1da998cfaa0c044d7205a17308b20c7de1bdcf74',
  DAI: '0x5d0e342ccd1ad86a16bfba26f404486940dbe345',
  USDC: '0xc86fed58edf0981e927160c50ecb8a8b05b32fed'
};

const WagerModal: React.FC<WagerModalProps> = ({
  type,
  isOpen,
  onClose,
  signer,
  aaWalletAddress
}) => {
  // Token state
  const [tokens, setTokens] = useState<TokenInfo[]>([]);
  const [selectedToken, setSelectedToken] = useState<string>('');
  const [amount, setAmount] = useState<string>('');

  // NFT state
  const [nftAddress, setNftAddress] = useState<string>('');
  const [tokenId, setTokenId] = useState<string>('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [wagerLink, setWagerLink] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'confirm' | 'complete'>('select');

  // Format balance with proper decimals
  const formatBalance = (balance: ethers.BigNumber, decimals: number): string => {
    try {
      const formatted = ethers.utils.formatUnits(balance, decimals);
      // Format to max 6 decimal places
      return parseFloat(formatted).toFixed(6);
    } catch (error) {
      console.error('Error formatting balance:', error);
      return '0.00';
    }
  };

  // Fetch token balances
  useEffect(() => {
    if (signer && aaWalletAddress && isOpen && type === 'stablecoin') {
      fetchTokenBalances();
    }
  }, [signer, aaWalletAddress, isOpen, type]);

  const fetchTokenBalances = async () => {
    if (!signer || !aaWalletAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use AA wallet address instead of EOA
      const tokenPromises = Object.entries(SUPPORTED_TOKENS).map(async ([symbol, tokenAddress]) => {
        try {
          const contract = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
          
          // Fetch token details in parallel, using AA wallet address
          const [balance, decimals, tokenSymbol] = await Promise.all([
            contract.balanceOf(aaWalletAddress), // Changed from userAddress to aaWalletAddress
            contract.decimals(),
            contract.symbol()
          ]);

          return {
            address: tokenAddress,
            symbol: tokenSymbol || symbol,
            balance,
            decimals,
            formattedBalance: formatBalance(balance, decimals)
          };
        } catch (error) {
          console.error(`Error fetching token ${symbol}:`, error);
          return null;
        }
      });

      const tokenResults = (await Promise.all(tokenPromises)).filter((token): token is TokenInfo => token !== null);
      setTokens(tokenResults);
    } catch (error: any) {
      console.error('Error fetching token balances:', error);
      setError('Failed to load token balances. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!signer || !aaWalletAddress) {
      setError('Wallet not connected');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let result;
      
      if (type === 'nft') {
        if (!nftAddress || !tokenId) {
          throw new Error('Please enter both NFT address and token ID');
        }

        result = await depositNFT(
          signer,
          nftAddress,
          ethers.BigNumber.from(tokenId),
          0, // Using sponsored transactions
          '' // No token payment
        );
      } else {
        if (!selectedToken || !amount) {
          throw new Error('Please select a token and enter an amount');
        }

        const token = tokens.find(t => t.address === selectedToken);
        if (!token) throw new Error('Selected token not found');

        // Convert amount to Wei with proper decimals
        const amountWei = ethers.utils.parseUnits(amount, token.decimals);

        // Validate amount against balance
        if (amountWei.gt(token.balance)) {
          throw new Error(`Insufficient ${token.symbol} balance`);
        }

        // Execute deposit with sponsored gas
        result = await depositERC20(
          signer,
          selectedToken,
          amountWei,
          0, // Using sponsored transactions
          '', // No token payment
          {
            gasMultiplier: 1.2 // Add 20% buffer for gas estimation
          }
        );
      }

      if (!result.success) {
        throw new Error('Transaction failed');
      }

      // Generate wager link
      const wagerUrl = `${window.location.origin}/wager/${result.transactionHash}`;
      setWagerLink(wagerUrl);
      setStep('complete');

    } catch (error: any) {
      console.error('Error in handleDeposit:', error);
      setError(error.message || 'Failed to complete deposit');
      setStep('select'); // Reset to selection step on error
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>×</button>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {step === 'select' && (
          <div className="asset-selection">
            <h3>{type === 'nft' ? 'Enter NFT Details' : 'Select Token'}</h3>
            
            {type === 'stablecoin' ? (
              <div className="token-list">
                {isLoading ? (
                  <div className="loading">Loading token balances...</div>
                ) : tokens.length === 0 ? (
                  <div className="no-tokens">No supported tokens found in your wallet</div>
                ) : (
                  tokens.map(token => (
                    <div
                      key={token.address}
                      className={`token-item ${selectedToken === token.address ? 'selected' : ''}`}
                      onClick={() => setSelectedToken(token.address)}
                    >
                      <div className="token-info">
                        <span className="token-symbol">{token.symbol}</span>
                        <span className="token-balance">{token.formattedBalance}</span>
                      </div>
                    </div>
                  ))
                )}
                
                {selectedToken && (
                  <div className="amount-input">
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => {
                        const newAmount = e.target.value;
                        const token = tokens.find(t => t.address === selectedToken);
                        if (token) {
                          try {
                            const amountWei = ethers.utils.parseUnits(newAmount || '0', token.decimals);
                            if (amountWei.gt(token.balance)) {
                              setError(`Amount exceeds your ${token.symbol} balance`);
                            } else {
                              setError(null);
                            }
                          } catch (error) {
                            setError('Invalid amount');
                          }
                        }
                        setAmount(newAmount);
                      }}
                      placeholder={`Enter amount (max: ${tokens.find(t => t.address === selectedToken)?.formattedBalance || '0'})`}
                      min="0"
                      step="0.000001"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="nft-input">
                <div className="form-group">
                  <label>NFT Contract Address</label>
                  <input
                    type="text"
                    value={nftAddress}
                    onChange={(e) => setNftAddress(e.target.value)}
                    placeholder="Enter NFT contract address"
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label>Token ID</label>
                  <input
                    type="text"
                    value={tokenId}
                    onChange={(e) => setTokenId(e.target.value)}
                    placeholder="Enter NFT token ID"
                    className="input-field"
                  />
                </div>
              </div>
            )}

            <button
              className="confirm-button"
              disabled={
                type === 'stablecoin' 
                  ? !selectedToken || !amount || isLoading || !!error
                  : !nftAddress || !tokenId
              }
              onClick={() => setStep('confirm')}
            >
              Continue
            </button>
          </div>
        )}

        {step === 'confirm' && (
          <div className="confirm-step">
            <h3>Confirm Deposit</h3>
            <div className="deposit-details">
              {type === 'stablecoin' ? (
                <p>Deposit {amount} {tokens.find(t => t.address === selectedToken)?.symbol}</p>
              ) : (
                <p>Deposit NFT #{tokenId}</p>
              )}
              <p className="gas-note">✨ Gas fees are sponsored by the platform!</p>
            </div>
            <button
              className="deposit-button"
              onClick={handleDeposit}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Confirm Deposit'}
            </button>
          </div>
        )}

        {step === 'complete' && wagerLink && (
          <div className="complete-step">
            <h3>🎉 Deposit Complete!</h3>
            <p>Share this link with your opponent:</p>
            <div className="wager-link">
              <input type="text" readOnly value={wagerLink} />
              <button onClick={() => navigator.clipboard.writeText(wagerLink)}>
                Copy
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WagerModal; 