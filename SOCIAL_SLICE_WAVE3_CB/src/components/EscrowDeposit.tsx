import React, { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { TokenSelector } from './TokenSelector'
import { ESCROW_PLATFORM_ADDRESS } from '@/contracts/EscrowPlatform'
import { useEscrowPrepay, useSendUserOp } from '@/hooks'
import { PaymasterToken } from '@/types'
import { PAYMASTER_MODE } from '@/types/Paymaster'

const ERC20_ABI = [
  'function approve(address spender, uint256 amount) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function balanceOf(address account) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)'
]

const styles = {
  approvalSection: {
    margin: '1rem 0',
    padding: '1rem',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    backgroundColor: '#f8f9fa'
  },
  approveButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    marginBottom: '0.5rem',
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: 'none'
  },
  depositButton: {
    padding: '0.75rem 1.5rem',
    fontSize: '1rem',
    fontWeight: 'bold',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    width: '100%',
    backgroundColor: '#51cf66',
    color: 'white',
    border: 'none'
  },
  disabled: {
    opacity: 0.5,
    cursor: 'not-allowed'
  }
}

export const EscrowDeposit = () => {
  const [amount, setAmount] = useState('')
  const [selectedToken, setSelectedToken] = useState<PaymasterToken | null>(null)
  const [selectedMode, setSelectedMode] = useState<number>(PAYMASTER_MODE.FREE_GAS)
  const [estimatedFee, setEstimatedFee] = useState('')
  const [txStatus, setTxStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle')
  const [txHash, setTxHash] = useState<string>('')
  const [isApproved, setIsApproved] = useState(false)
  const { deposit, estimateDepositFee, isLoading, error } = useEscrowPrepay()
  const { execute, sendUserOp } = useSendUserOp()

  const handleApprove = useCallback(async () => {
    if (!selectedToken) return

    setTxStatus('pending')
    try {
      // First set up the approval operation
      await execute({
        contractAddress: selectedToken.token,
        abi: ERC20_ABI,
        function: 'approve',
        params: [ESCROW_PLATFORM_ADDRESS, ethers.constants.MaxUint256],
        value: ethers.constants.Zero
      })

      // Then send it with gasless configuration
      const result = await sendUserOp(true, selectedToken.token, PAYMASTER_MODE.FREE_GAS)
      
      if (result) {
        setTxStatus('success')
        setIsApproved(true)
      } else {
        throw new Error('Approval failed')
      }
    } catch (err) {
      setTxStatus('error')
      console.error('Error approving token:', err)
    }
  }, [selectedToken, execute, sendUserOp])

  const handleTokenSelect = useCallback((token: PaymasterToken | null, mode: number) => {
    setSelectedToken(token)
    setSelectedMode(mode)
    setEstimatedFee('')
    setIsApproved(false) // Reset approval state when token changes
  }, [])

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value)
      setEstimatedFee('')
    }
  }, [])

  const handleEstimateFee = useCallback(async () => {
    if (!selectedToken || !amount) return

    try {
      const fee = await estimateDepositFee(
        selectedToken.token,
        ethers.utils.parseUnits(amount, selectedToken.decimals || 18),
        selectedToken.token
      )
      
      if (fee === '0' || fee === '0.0001') {
        console.warn('Fee estimation may be inaccurate')
      }
      
      setEstimatedFee(fee)
    } catch (err) {
      console.error('Error estimating fee:', err)
      setEstimatedFee('0')
    }
  }, [selectedToken, amount, estimateDepositFee])

  const handleDeposit = useCallback(async () => {
    if (!selectedToken || !amount || !isApproved) return

    setTxStatus('pending')
    try {
      const result = await deposit(
        selectedToken.token,
        ethers.utils.parseUnits(amount, selectedToken.decimals || 18),
        selectedToken.token
      )
      
      setTxStatus('success')
      setTxHash(result.hash)
      setAmount('')
      setSelectedToken(null)
      setSelectedMode(PAYMASTER_MODE.FREE_GAS)
      setEstimatedFee('')
      setIsApproved(false)
    } catch (err) {
      setTxStatus('error')
      console.error('Error depositing:', err)
    }
  }, [selectedToken, amount, deposit, isApproved])

  const isDepositDisabled = !selectedToken || !amount || isLoading || txStatus === 'pending' || !isApproved

  return (
    <div className="escrow-deposit">
      <h2>Deposit to Escrow</h2>
      
      <div className="input-group">
        <input
          type="text"
          value={amount}
          onChange={handleAmountChange}
          placeholder="Amount"
          disabled={txStatus === 'pending'}
          inputMode="decimal"
          autoComplete="off"
          autoCorrect="off"
          pattern="^[0-9]*[.,]?[0-9]*$"
          minLength={1}
          maxLength={79}
          spellCheck="false"
        />
        <TokenSelector
          selectedToken={selectedToken}
          selectedMode={selectedMode}
          onTokenSelect={handleTokenSelect}
        />
      </div>

      {selectedToken && amount && (
        <div className="fee-estimate">
          <button 
            onClick={handleEstimateFee}
            disabled={txStatus === 'pending'}
          >
            Estimate Fee
          </button>
          {estimatedFee && (
            <p className={estimatedFee === '0' ? 'warning' : ''}>
              Estimated Fee: {estimatedFee} {selectedToken.symbol}
            </p>
          )}
        </div>
      )}

      {selectedToken && amount && !isApproved && (
        <div style={styles.approvalSection}>
          <button 
            onClick={handleApprove}
            disabled={txStatus === 'pending'}
            style={{
              ...styles.approveButton,
              ...(txStatus === 'pending' ? styles.disabled : {})
            }}
          >
            {txStatus === 'pending' ? 'Approving...' : `Approve ${selectedToken.symbol} (Gasless)`}
          </button>
        </div>
      )}

      {selectedToken && amount && isApproved && (
        <button 
          onClick={handleDeposit}
          disabled={isDepositDisabled}
          style={{
            ...styles.depositButton,
            ...(isDepositDisabled ? styles.disabled : {})
          }}
        >
          {txStatus === 'pending' ? 'Processing...' : 'Deposit'}
        </button>
      )}

      {txStatus === 'success' && (
        <div className="success-message">
          <p>Transaction successful!</p>
          <p>Transaction Hash: {txHash}</p>
        </div>
      )}

      {error && <p className="error">{error.toString()}</p>}
    </div>
  )
} 