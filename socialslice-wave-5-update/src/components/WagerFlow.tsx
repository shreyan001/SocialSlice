import React, { useState, useCallback, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { ESCROW_PLATFORM_ABI, ESCROW_PLATFORM_ADDRESS } from '@/contracts/EscrowPlatform';
import { useSendUserOp, useSignature } from '@/hooks';
import { PaymasterToken, UserOperation } from '@/types';
import { PAYMASTER_MODE } from '@/types/Paymaster';
import { getTestnetTokensList } from '@/constants/testnetTokensList';
import TokenSelector from '@/TokenSelector';
import ERC20_ABI from '@/abis/ERC20/ERC20.json';
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
  
  const [approvalStatus, setApprovalStatus] = useState<'not_started' | 'checking' | 'insufficient' | 'approved' | 'failed'>('not_started');
  const [currentAllowance, setCurrentAllowance] = useState<ethers.BigNumber | null>(null);

  // States for transaction handling using useSendUserOp
  const [isLoading, setIsLoading] = useState(false); // General loading for async operations
  const [userOpHash, setUserOpHash] = useState<string | null>(null); // For current operation
  const [txMessage, setTxMessage] = useState<string>(''); // User-facing messages
  const [isPolling, setIsPolling] = useState(false);

  const { execute, waitForUserOpResult, checkUserOpStatus } = useSendUserOp();
  const { AAaddress, isConnected } = useSignature();
  const pollingIntervalRef = useRef<number | null>(null);

  // Moved checkTokenAllowance definition earlier
  const checkTokenAllowance = useCallback(async () => {
    if (!selectedToken || !AAaddress) return;
    setApprovalStatus('checking');
    try {
      const provider = new ethers.providers.JsonRpcProvider('https://rpc-testnet.nerochain.io/');
      const tokenContract = new ethers.Contract(selectedToken.token, ERC20_ABI, provider);
      const allowance = await tokenContract.allowance(AAaddress, ESCROW_PLATFORM_ADDRESS);
      setCurrentAllowance(allowance);
      const parsedAmount = ethers.utils.parseUnits(amount || '0', selectedToken.decimals || 18);
      if (allowance.gte(parsedAmount)) {
        setApprovalStatus('approved');
      } else {
        setApprovalStatus('insufficient');
      }
    } catch (err) {
      console.error('Allowance check error:', err);
      setApprovalStatus('not_started'); // Reset on error to allow retry
    }
  }, [selectedToken, amount, AAaddress]);

  // Unified Polling Logic from Sample.tsx, adapted
  useEffect(() => {
    const pollStatus = async () => {
      if (!userOpHash || !isPolling) return;
      try {
        const status = await checkUserOpStatus(userOpHash);
        if (status === true) {
          setTxMessage(txMessage.startsWith('Approval') ? 'Approval Successful!' : 'Deposit Successful!');
          setIsLoading(false); // Stop general loading on final success
          if (txMessage.startsWith('Approval')) {
            setApprovalStatus('approved');
            checkTokenAllowance(); // Re-check allowance after approval
          } else {
            navigate('/wager/123'); // Navigate on successful deposit
          }
        } else if (status === false) {
          setTxMessage(txMessage.startsWith('Approval') ? 'Approval Failed.' : 'Deposit Failed.');
          if (txMessage.startsWith('Approval')) setApprovalStatus('failed');
          setIsLoading(false);
        } else {
          // Still pending, txMessage should reflect "Processing..."
        }
      } catch (error) {
        console.error('Error checking status:', error);
        setTxMessage('Error checking status.');
        if (txMessage.startsWith('Approval')) setApprovalStatus('failed');
        setIsLoading(false);
      } finally {
        // Only stop polling if status is definitively true or false
        const status = await checkUserOpStatus(userOpHash); // re-check before stopping
        if (status === true || status === false) {
            setIsPolling(false);
        }
      }
    };

    if (isPolling && userOpHash) {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = window.setInterval(pollStatus, 5000) as unknown as number;
      pollStatus(); // Initial check
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [userOpHash, isPolling, checkUserOpStatus, navigate, txMessage, checkTokenAllowance]);

  // checkTokenAllowance was moved above useEffect

  const handleApprove = useCallback(async () => {
    if (!selectedToken || !isConnected) {
      alert('Please select a token and ensure your wallet is connected.');
      return;
    }
    setIsLoading(true);
    setUserOpHash(null);
    setTxMessage('Approval Processing...');
    setApprovalStatus('checking'); // Visually indicates process has started for approval

    try {
      const approvalOperation: UserOperation = {
        contractAddress: selectedToken.token,
        abi: ERC20_ABI,
        function: 'approve',
        params: [ESCROW_PLATFORM_ADDRESS, ethers.constants.MaxUint256],
        value: ethers.constants.Zero,
      };
      const paymentIntent = {
        usePaymaster: true,
        type: PAYMASTER_MODE.FREE_GAS, // 0 for Sponsored/Free gas
      };

      await execute(approvalOperation, paymentIntent);
      const result = await waitForUserOpResult();
      setUserOpHash(result.userOpHash);
      setIsPolling(true); // Start polling
      // Loading will be set to false by poller on final status

    } catch (error) {
      console.error('Approval execution error:', error);
      setTxMessage('Approval Execution Failed.');
      setApprovalStatus('failed');
      setIsLoading(false);
    }
  }, [selectedToken, isConnected, execute, waitForUserOpResult]);

  const handleDeposit = useCallback(async () => {
    if (!isConnected) {
        alert('Please connect your wallet.');
        return;
    }
    if (type === 'nft' && (!nftAddress || !tokenId)) {
      alert('Please provide NFT address and Token ID.');
      return;
    }
    if (type === 'stablecoin' && (!selectedToken || !amount || approvalStatus !== 'approved')) {
      alert('Please select a token, enter an amount, and ensure token approval.');
      return;
    }

    setIsLoading(true);
    setUserOpHash(null);
    setTxMessage('Deposit Processing...');

    try {
      let depositOperation: UserOperation;
      let paymentIntent;

      if (type === 'nft') {
        depositOperation = {
          contractAddress: ESCROW_PLATFORM_ADDRESS,
          abi: ESCROW_PLATFORM_ABI,
          function: 'acceptNFT',
          params: [nftAddress, parseInt(tokenId)],
          value: ethers.constants.Zero,
        };
        paymentIntent = {
          usePaymaster: true, 
          type: PAYMASTER_MODE.PRE_FUND, // Assuming PRE_FUND for NFT deposit (type 1)
          // tokenAddress: undefined, // Or a specific one if paymaster supports it for this type
        };
      } else { // Stablecoin
        depositOperation = {
          contractAddress: ESCROW_PLATFORM_ADDRESS,
          abi: ESCROW_PLATFORM_ABI,
          function: 'acceptERC20',
          params: [selectedToken!.token, ethers.utils.parseUnits(amount, selectedToken!.decimals || 18)],
          value: ethers.constants.Zero,
        };
        paymentIntent = {
          usePaymaster: true,
          type: PAYMASTER_MODE.PRE_FUND, // 1 for Prepay ERC20
          tokenAddress: selectedToken!.token,
        };
      }

      await execute(depositOperation, paymentIntent);
      const result = await waitForUserOpResult();
      setUserOpHash(result.userOpHash);
      setIsPolling(true); // Start polling for deposit
      // Loading will be set to false by poller

    } catch (error) {
      console.error('Deposit execution error:', error);
      setTxMessage('Deposit Execution Failed.');
      setIsLoading(false);
    }
  }, [
    type, nftAddress, tokenId, selectedToken, amount, approvalStatus, isConnected, 
    execute, waitForUserOpResult,
  ]);

  useEffect(() => {
    if (type === 'stablecoin' && selectedToken && amount) {
      checkTokenAllowance();
    } else if (type === 'stablecoin' && (!selectedToken || !amount)) {
      setApprovalStatus('not_started');
      setCurrentAllowance(null);
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
                  tokens={getTestnetTokensList()}
                />
              </div>
            )}
          </div>
        )}

        {type === 'stablecoin' && selectedToken && amount && (
          <div className="mt-4 p-2 bg-gray-50 rounded-none">
            {approvalStatus === 'checking' && <p className="text-blue-600">Checking allowance...</p>}
            {approvalStatus === 'insufficient' && (
              <div>
                <p className="text-red-600">Insufficient allowance</p>
                <p className="text-sm">
                  Current Allowance: {currentAllowance && selectedToken ? 
                    ethers.utils.formatUnits(currentAllowance, selectedToken.decimals) : '0'}
                </p>
                <button
                  onClick={handleApprove}
                  disabled={isLoading}
                  className="w-full mt-2 px-4 py-2 bg-red-600 text-white rounded-none hover:bg-red-700 disabled:opacity-50"
                >
                  {isLoading && txMessage.startsWith('Approval') ? 'Approving...' : 'Approve Token (Gasless)'}
                </button>
              </div>
            )}
            {(approvalStatus === 'approved') && (
              <p className="text-green-600">Allowance approved ✓</p>
            )}
            {approvalStatus === 'failed' && (
                <p className="text-red-600">Approval Failed. Please try again.</p>
            )}
          </div>
        )}

        <button
          onClick={handleDeposit}
          disabled={isLoading || (type === 'stablecoin' && approvalStatus !== 'approved') || (type === 'nft' && (!nftAddress || !tokenId)) || (type==='stablecoin' && (!selectedToken || !amount))}
          className="w-full mt-4 px-4 py-2 bg-red-600 text-white rounded-none hover:bg-red-700 disabled:opacity-50"
        >
          {isLoading && (txMessage.startsWith('Deposit') || txMessage.startsWith('Approval')) ? 'Processing...' : 'Deposit'}
        </button>

        {userOpHash && (
          <div className="mt-4 p-2 bg-gray-50 rounded-none">
            <p className="text-sm">Transaction Hash: <span className="text-xs break-all">{userOpHash}</span></p>
          </div>
        )}
        {txMessage && (
             <div className="mt-2">
                <p className={`text-sm ${txMessage.includes('Success') ? 'text-green-600' : txMessage.includes('Fail') || txMessage.includes('Error') ? 'text-red-600' : 'text-blue-600'}`}>
                    Status: {txMessage}
                </p>
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