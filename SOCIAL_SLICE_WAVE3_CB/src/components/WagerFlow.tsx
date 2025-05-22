import React, { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { useEscrowPrepay, useSignature } from '@/hooks';
import { useSendUserOp } from '@/hooks';
import { ESCROW_PLATFORM_ADDRESS } from '@/contracts/EscrowPlatform';
import { PaymasterToken } from '@/types';
import { PAYMASTER_MODE } from '@/types/Paymaster';
import TokenSelector from './TokenSelector';
import ERC20_ABI from '@/abis/ERC20/ERC20.json';

// Define token addresses
const TOKEN_ADDRESSES = {
  USDT: '0x1da998cfaa0c044d7205a17308b20c7de1bdcf74',
  DAI: '0x5d0e342ccd1ad86a16bfba26f404486940dbe345',
  USDC: '0xc86fed58edf0981e927160c50ecb8a8b05b32fed'
};

interface WagerFlowProps {
  type: 'nft' | 'stablecoin';
  onClose: () => void;
}

const WagerFlow: React.FC<WagerFlowProps> = ({ type, onClose }) => {
  const navigate = useNavigate();
  const [nftAddress, setNftAddress] = useState('');
  const [tokenId, setTokenId] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedToken, setSelectedToken] = useState<PaymasterToken | null>(null);
  const [approvalStatus, setApprovalStatus] = useState<'not_started' | 'checking' | 'insufficient' | 'approved'>('not_started');
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [userOpHash, setUserOpHash] = useState<string | null>(null);
  const [currentAllowance, setCurrentAllowance] = useState<ethers.BigNumber | null>(null);

  const { execute, sendUserOp, waitForUserOpResult, checkUserOpStatus } = useSendUserOp();
  const { deposit } = useEscrowPrepay();
  const { AAaddress } = useSignature();

  // Check token allowance
  const checkTokenAllowance = useCallback(async () => {
    if (!selectedToken) return;

    setApprovalStatus('checking');
    setError(null);

    try {
      // Create provider for testnet
      const provider = new ethers.providers.JsonRpcProvider('https://rpc-testnet.nerochain.io/');
      
      // Create token contract instance
      const tokenContract = new ethers.Contract(selectedToken.token, ERC20_ABI, provider);
      
      // Use AAaddress from context
      const userAddress = AAaddress;

      // Check allowance
      const allowance = await tokenContract.allowance(userAddress, ESCROW_PLATFORM_ADDRESS);
      
      setCurrentAllowance(allowance);
      
      // Parse amount to check against allowance
      const parsedAmount = ethers.utils.parseUnits(amount || '0', selectedToken.decimals || 18);
      
      if (allowance.gte(parsedAmount)) {
        setApprovalStatus('approved');
      } else {
        setApprovalStatus('insufficient');
      }
    } catch (err) {
      console.error('Allowance check error:', err);
      setError('Failed to check allowance. Please check the token address and network.');
      setApprovalStatus('not_started');
    }
  }, [selectedToken, amount, AAaddress]);

  // Approve token for spending (gasless, robust)
  const handleApprove = useCallback(async () => {
    if (!selectedToken) return;

    setTxStatus('pending');
    setError(null);
    setUserOpHash(null);

    try {
      // Step 1: Prepare approval operation
      await execute({
        contractAddress: selectedToken.token,
        abi: ERC20_ABI,
        function: 'approve',
        params: [ESCROW_PLATFORM_ADDRESS, ethers.constants.MaxUint256],
        value: ethers.constants.Zero
      });

      // Step 2: Send gasless user operation (paymaster)
      await sendUserOp(true, selectedToken.token, PAYMASTER_MODE.FREE_GAS);
      // Step 3: Wait for userOp result
      const userOpResult = await waitForUserOpResult();
      if (userOpResult && userOpResult.userOpHash) {
        setUserOpHash(userOpResult.userOpHash);
        // Step 4: Poll for status (optional, but robust)
        let status = false;
        let pollCount = 0;
        while (!status && pollCount < 20) { // poll up to 20 times (60s)
          const pollResult = await checkUserOpStatus(userOpResult.userOpHash);
          status = !!pollResult;
          if (status) break;
          await new Promise(res => setTimeout(res, 3000));
          pollCount++;
        }
        if (status) {
          setTxStatus('success');
          await checkTokenAllowance();
        } else {
          setTxStatus('error');
          setError('Approval not confirmed after waiting.');
          setApprovalStatus('not_started');
        }
      } else {
        setTxStatus('error');
        setError('Approval failed');
        setApprovalStatus('not_started');
      }
    } catch (err) {
      setTxStatus('error');
      setError(err instanceof Error ? err.message : 'Approval failed');
      setApprovalStatus('not_started');
    }
  }, [selectedToken, execute, sendUserOp, waitForUserOpResult, checkUserOpStatus, checkTokenAllowance]);

  // Deposit tokens
  const handleDeposit = useCallback(async () => {
    if (type === 'nft') {
      if (!nftAddress || !tokenId) return;
    } else {
      if (!selectedToken || !amount || approvalStatus !== 'approved') return;
    }

    setTxStatus('pending');
    setError(null);

    try {
      if (type === 'nft') {
        // NFT deposit with prepay mode
        await execute({
          contractAddress: ESCROW_PLATFORM_ADDRESS,
          abi: ['function acceptNFT(address token, uint256 tokenId) external'],
          function: 'acceptNFT',
          params: [nftAddress, parseInt(tokenId)],
          value: ethers.constants.Zero
        });

        // Send prepay user operation for NFT
        const result = await sendUserOp(true, undefined, PAYMASTER_MODE.PRE_FUND);
        
        if (result) {
          const userOpResult = await waitForUserOpResult();
          if (userOpResult.result) {
            setTxStatus('success');
            setUserOpHash(userOpResult.userOpHash);
            navigate('/wager/123');
          } else {
            throw new Error('NFT deposit failed');
          }
        }
      } else if (selectedToken) {
        // ERC20 deposit with prepay mode
        const parsedAmount = ethers.utils.parseUnits(amount, selectedToken.decimals || 18);
        // Execute deposit
        const result = await deposit(
          selectedToken.token,
          parsedAmount,
          selectedToken.token
        );
        if (result && result.userOpHash) {
          // Wait for confirmation if possible
          const userOpResult = await waitForUserOpResult();
          if (userOpResult?.result) {
            setTxStatus('success');
            setUserOpHash(userOpResult.userOpHash);
            navigate('/wager/123');
          } else {
            throw new Error('Deposit failed');
          }
        } else {
          throw new Error('Deposit failed');
        }
      }
    } catch (err) {
      setTxStatus('error');
      setError(err instanceof Error ? err.message : 'Deposit failed');
    }
  }, [
    type,
    nftAddress,
    tokenId,
    selectedToken,
    amount,
    approvalStatus,
    execute,
    deposit,
    navigate,
    sendUserOp,
    waitForUserOpResult
  ]);

  // Trigger allowance check when token or amount changes
  useEffect(() => {
    if (type === 'stablecoin' && selectedToken && amount) {
      checkTokenAllowance();
    }
  }, [selectedToken, amount, type, checkTokenAllowance]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-none max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">
          {type === 'nft' ? 'NFT Wager' : 'Stablecoin Wager'}
        </h2>

        {type === 'nft' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">NFT Contract Address</label>
              <input
                type="text"
                value={nftAddress}
                onChange={(e) => setNftAddress(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-none"
                placeholder="0x..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Token ID</label>
              <input
                type="text"
                value={tokenId}
                onChange={(e) => setTokenId(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-none"
                placeholder="Enter token ID"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Amount</label>
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-none"
                placeholder="Enter amount"
              />
            </div>
            {type === 'stablecoin' && (
              <div className="mt-4">
                <label className="block text-sm font-medium mb-1">Select Token</label>
                <TokenSelector
                  selectedToken={selectedToken}
                  onSelect={setSelectedToken}
                  tokens={[
                    { token: TOKEN_ADDRESSES.USDT, symbol: 'USDT', decimals: 6, price: '0' },
                    { token: TOKEN_ADDRESSES.DAI, symbol: 'DAI', decimals: 18, price: '0' },
                    { token: TOKEN_ADDRESSES.USDC, symbol: 'USDC', decimals: 6, price: '0' }
                  ]}
                />
              </div>
            )}
          </div>
        )}

        {type === 'stablecoin' && selectedToken && amount && (
          <div className="mt-4 p-2 bg-gray-50 rounded-none">
            {approvalStatus === 'checking' && (
              <p className="text-blue-600">Checking allowance...</p>
            )}
            {approvalStatus === 'insufficient' && (
              <div>
                <p className="text-red-600">Insufficient allowance</p>
                <p className="text-sm">
                  Current Allowance: {currentAllowance ? 
                    ethers.utils.formatUnits(currentAllowance, selectedToken.decimals) : '0'}
                </p>
                <button
                  onClick={handleApprove}
                  disabled={txStatus === 'pending'}
                  className="w-full mt-2 px-4 py-2 bg-red-600 text-white rounded-none hover:bg-red-700 disabled:opacity-50"
                >
                  {txStatus === 'pending' ? 'Approving...' : 'Approve Token (Gasless)'}
                </button>
              </div>
            )}
            {approvalStatus === 'approved' && (
              <p className="text-green-600">Allowance approved ✓</p>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 p-2 bg-red-100 text-red-700 rounded-none">
            {error}
          </div>
        )}

        <button
          onClick={handleDeposit}
          disabled={
            txStatus === 'pending' || 
            (type === 'nft' && (!nftAddress || !tokenId)) || 
            (type === 'stablecoin' && (approvalStatus !== 'approved' || !amount))
          }
          className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-none hover:bg-red-700 disabled:opacity-50"
        >
          {txStatus === 'pending' ? 'Processing...' : 'Deposit'}
        </button>

        {userOpHash && (
          <div className="mt-4 p-2 bg-gray-50 rounded-none">
            <p className="text-sm">Transaction Hash:</p>
            <p className="text-xs break-all">{userOpHash}</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-none hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default WagerFlow; 