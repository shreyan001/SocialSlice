import { ESCROW_PLATFORM_ABI, ESCROW_PLATFORM_ADDRESS } from '@/contracts/EscrowPlatform'
import { useCallback, useContext } from 'react'
import { ethers } from 'ethers'
import { ClientContext, SignatureContext } from '@/contexts'
import { useEstimateUserOpFee, useSendUserOp } from '@/hooks'
import { useEthersSigner, useTransaction, useSignature } from '@/hooks'
import { OperationData } from '@/types/hooks'
import { PAYMASTER_MODE } from '@/types/Paymaster'
import { useBuilderWithPaymaster } from '@/utils'

const handlePaymasterError = (error: any): string => {
  if (!error) return 'Unknown error occurred'

  // Handle JSON-RPC error codes
  if (error.code === -32500) {
    return 'Transaction rejected by entryPoint validation'
  }
  if (error.code === -32501) {
    return 'Transaction rejected by paymaster validation'
  }
  if (error.code === -32502) {
    return 'Transaction rejected due to opcode validation'
  }
  if (error.code === -32503) {
    return 'Transaction expired or will expire soon'
  }
  if (error.code === -32504) {
    return 'Paymaster is throttled or banned'
  }
  if (error.code === -32505) {
    return 'Paymaster stake or unstake-delay is too low'
  }

  // Handle specific error messages
  if (typeof error === 'string') {
    if (error.includes('NeroPaymaster: insufficient balance')) {
      return 'Paymaster service has insufficient balance. Please try again later.'
    }
    if (error.includes('AA33 reverted')) {
      return 'Transaction was rejected by the paymaster. Please try again later.'
    }
  }

  // Handle error objects
  if (error.data?.Reason) {
    return error.data.Reason
  }

  if (error.message) {
    return error.message
  }

  return 'An unexpected error occurred'
}

export const useEscrowPrepay = () => {
  const signer = useEthersSigner()
  const client = useContext(ClientContext)
  const { simpleAccountInstance } = useContext(SignatureContext)!
  const { AAaddress } = useSignature()
  const { initBuilder } = useBuilderWithPaymaster(signer)
  const { estimateUserOpFee, ensurePaymasterApproval } = useEstimateUserOpFee()
  const { execute } = useSendUserOp()

  const checkTokenBalance = useCallback(async (
    tokenAddress: string,
    amount: ethers.BigNumber
  ) => {
    if (!signer || !AAaddress) {
      throw new Error('Signer or AA address not available')
    }

    const tokenContract = new ethers.Contract(tokenAddress, [
      'function balanceOf(address) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
      'function allowance(address,address) view returns (uint256)'
    ], signer)

    try {
      const [balance, decimals, symbol, allowance] = await Promise.all([
        tokenContract.balanceOf(AAaddress),
        tokenContract.decimals(),
        tokenContract.symbol(),
        tokenContract.allowance(AAaddress, ESCROW_PLATFORM_ADDRESS)
      ])

      if (balance.lt(amount)) {
        throw new Error(`Insufficient ${symbol} balance. Required: ${ethers.utils.formatUnits(amount, decimals)}, Available: ${ethers.utils.formatUnits(balance, decimals)}`)
      }

      if (allowance.lt(amount)) {
        throw new Error(`Insufficient ${symbol} allowance. Please approve the escrow contract first.`)
      }

      return true
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Token check failed: ${error.message}`)
      }
      throw new Error('Failed to check token balance and allowance')
    }
  }, [signer, AAaddress])

  const ensureTokenApproval = useCallback(async (
    tokenAddress: string,
    amount: ethers.BigNumber
  ) => {
    if (!signer || !AAaddress || !client) return false

    const tokenContract = new ethers.Contract(tokenAddress, [
      'function allowance(address,address) view returns (uint256)',
      'function approve(address,uint256) returns (bool)'
    ], signer)

    const allowance = await tokenContract.allowance(AAaddress, ESCROW_PLATFORM_ADDRESS)

    if (allowance.lt(amount)) {
      try {
        await execute({
          contractAddress: tokenAddress,
          abi: tokenContract.interface.format(),
          function: 'approve',
          params: [ESCROW_PLATFORM_ADDRESS, ethers.constants.MaxUint256],
          value: ethers.constants.Zero
        })

        // Verify the approval was successful
        const newAllowance = await tokenContract.allowance(AAaddress, ESCROW_PLATFORM_ADDRESS)
        if (newAllowance.lt(amount)) {
          throw new Error('Approval failed or insufficient allowance')
        }

        return true
      } catch (error) {
        console.error('Approval failed:', error)
        throw new Error('Failed to approve token transfer')
      }
    }

    return true
  }, [signer, client, AAaddress, execute])

  const estimateDepositFee = useCallback(async (
    tokenAddress: string,
    amount: ethers.BigNumber,
    paymasterTokenAddress?: string
  ) => {
    if (!signer || !client || !simpleAccountInstance || !AAaddress) {
      return '0'
    }

    try {
      const builder = await initBuilder(true, paymasterTokenAddress, PAYMASTER_MODE.PRE_FUND)
      if (!builder) return '0.0001'

      // Check token balance and allowance
      await checkTokenBalance(tokenAddress, amount)

      // Ensure token approval
      await ensureTokenApproval(tokenAddress, amount)

      // Ensure paymaster approval if needed
      if (paymasterTokenAddress) {
        await ensurePaymasterApproval(paymasterTokenAddress)
      }

      const operations: OperationData[] = [
        {
          contractAddress: ESCROW_PLATFORM_ADDRESS,
          abi: ESCROW_PLATFORM_ABI,
          function: 'acceptERC20',
          params: [tokenAddress, amount],
          value: ethers.constants.Zero
        }
      ]

      const fee = await estimateUserOpFee(operations, true, paymasterTokenAddress, PAYMASTER_MODE.PRE_FUND)
      return fee
    } catch (error) {
      console.error('Error estimating deposit fee:', error)
      return '0.0001'
    }
  }, [
    signer,
    client,
    simpleAccountInstance,
    AAaddress,
    estimateUserOpFee,
    ensurePaymasterApproval,
    checkTokenBalance,
    ensureTokenApproval,
    initBuilder
  ])

  const depositToken = useCallback(async (
    tokenAddress: string,
    amount: ethers.BigNumber,
    paymasterTokenAddress?: string
  ) => {
    if (!signer || !client || !simpleAccountInstance || !AAaddress) {
      throw new Error('Required dependencies not available')
    }

    try {
      // Check token balance and allowance
      await checkTokenBalance(tokenAddress, amount)

      // Ensure token approval
      await ensureTokenApproval(tokenAddress, amount)

      if (paymasterTokenAddress) {
        await ensurePaymasterApproval(paymasterTokenAddress)
      }

      const result = await execute({
        contractAddress: ESCROW_PLATFORM_ADDRESS,
        abi: ESCROW_PLATFORM_ABI,
        function: 'acceptERC20',
        params: [tokenAddress, amount],
        value: ethers.constants.Zero
      })

      return result
    } catch (error) {
      const errorMessage = handlePaymasterError(error)
      throw new Error(`Deposit failed: ${errorMessage}`)
    }
  }, [
    signer,
    client,
    simpleAccountInstance,
    AAaddress,
    checkTokenBalance,
    ensureTokenApproval,
    ensurePaymasterApproval,
    execute
  ])

  const {
    isLoading,
    isError,
    error,
    isSuccess,
    execute: deposit,
    reset
  } = useTransaction(depositToken)

  return {
    deposit,
    estimateDepositFee,
    isLoading,
    isSuccess,
    isError,
    error,
    reset
  }
}
