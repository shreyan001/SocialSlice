import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { depositERC20, depositNFT, getSupportedTokens, initAAClient, initAABuilder, checkTokenBalance } from '../utils/aaUtils';
import PaymentTypeSelector from './PaymentTypeSelector';

interface WagerDepositProps {
  type: 'nft' | 'stablecoin';
  signer?: ethers.Signer;
  aaWalletAddress?: string;
  onComplete?: () => void;
}

const WagerDeposit: React.FC<WagerDepositProps> = ({ 
  type, 
  signer, 
  aaWalletAddress,
  onComplete 
}) => {
  // Token/NFT selection state
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');

  // Payment type state
  const [paymentType, setPaymentType] = useState(0);
  const [selectedToken, setSelectedToken] = useState('');
  const [supportedTokens, setSupportedTokens] = useState<Array<any>>([]);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isFetchingTokens, setIsFetchingTokens] = useState(false);

  // Load supported tokens for gas payment
  useEffect(() => {
    if (signer) {
      fetchSupportedTokens();
    }
  }, [signer]);

  const fetchSupportedTokens = async () => {
    if (!signer) return;

    try {
      setIsFetchingTokens(true);
      setError(null);

      const client = await initAAClient(signer);
      const builder = await initAABuilder(signer);
      
      const tokens = await getSupportedTokens(client, builder);
      setSupportedTokens(tokens);
    } catch (error: any) {
      console.error("Error fetching supported tokens:", error);
      setError(`Token loading error: ${error.message || "Unknown error"}`);
    } finally {
      setIsFetchingTokens(false);
    }
  };

  const handlePaymentTypeChange = (type: number, token?: string) => {
    setPaymentType(type);
    if (token) {
      setSelectedToken(token);
    } else {
      setSelectedToken('');
    }
  };

  const handleDeposit = async () => {
    if (!signer || !aaWalletAddress) {
      setError("Please connect your wallet first");
      return;
    }

    if (!tokenAddress) {
      setError(`Please enter the ${type === 'nft' ? 'NFT' : 'token'} address`);
      return;
    }

    setError(null);
    setTxHash(null);
    setIsLoading(true);

    try {
      // Check paymaster token balance if using token payment
      if (paymentType > 0 && selectedToken) {
        try {
          const amountForGas = ethers.utils.parseUnits("0.1", 18); // Estimate for gas
          await checkTokenBalance(signer, selectedToken, amountForGas);
        } catch (error: any) {
          throw new Error(`Insufficient balance for gas payment: ${error.message}`);
        }
      }

      let result;
      
      if (type === 'nft') {
        if (!tokenId) {
          throw new Error("Please enter the NFT token ID");
        }
        result = await depositNFT(
          signer,
          tokenAddress,
          ethers.BigNumber.from(tokenId),
          paymentType,
          selectedToken
        );
      } else {
        if (!amount) {
          throw new Error("Please enter the amount to deposit");
        }
        // Get token decimals for proper amount parsing
        const tokenContract = new ethers.Contract(
          tokenAddress,
          ["function decimals() view returns (uint8)"],
          signer
        );
        const decimals = await tokenContract.decimals();
        const amountWei = ethers.utils.parseUnits(amount, decimals);
        
        result = await depositERC20(
          signer,
          tokenAddress,
          amountWei,
          paymentType,
          selectedToken
        );
      }

      setTxHash(result.transactionHash);
      if (onComplete) {
        onComplete();
      }

    } catch (error: any) {
      console.error("Error depositing:", error);
      setError(error.message || "Failed to deposit");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="wager-deposit-container">
      <h2>{type === 'nft' ? 'Deposit NFT' : 'Deposit Tokens'}</h2>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      <div className="form-container">
        <div className="form-group">
          <label htmlFor="token-address">
            {type === 'nft' ? 'NFT Contract Address:' : 'Token Address:'}
          </label>
          <input
            id="token-address"
            type="text"
            value={tokenAddress}
            onChange={(e) => setTokenAddress(e.target.value)}
            placeholder={`Enter ${type === 'nft' ? 'NFT' : 'token'} contract address`}
            disabled={isLoading}
            className="input-field"
          />
        </div>

        {type === 'nft' ? (
          <div className="form-group">
            <label htmlFor="token-id">Token ID:</label>
            <input
              id="token-id"
              type="text"
              value={tokenId}
              onChange={(e) => setTokenId(e.target.value)}
              placeholder="Enter NFT token ID"
              disabled={isLoading}
              className="input-field"
            />
          </div>
        ) : (
          <div className="form-group">
            <label htmlFor="amount">Amount:</label>
            <input
              id="amount"
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to deposit"
              disabled={isLoading}
              className="input-field"
            />
          </div>
        )}

        <div className="form-group">
          <label>Gas Payment Method:</label>
          <PaymentTypeSelector
            paymentType={paymentType}
            setPaymentType={handlePaymentTypeChange}
            selectedToken={selectedToken}
            setSelectedToken={setSelectedToken}
            supportedTokens={supportedTokens}
            isLoading={isFetchingTokens}
          />
        </div>

        <button
          onClick={handleDeposit}
          disabled={isLoading || !tokenAddress || !signer || !aaWalletAddress}
          className="deposit-button"
        >
          {isLoading ? "Depositing..." : "Deposit"}
        </button>
      </div>

      {txHash && (
        <div className="success-message">
          <p>Successfully deposited!</p>
          <a
            href={`https://testnet.neroscan.io/tx/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="explorer-link"
          >
            View on Explorer
          </a>
        </div>
      )}
    </div>
  );
};

export default WagerDeposit; 