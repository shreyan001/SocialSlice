  import { useCallback, useContext, useState, useEffect, useRef } from 'react'
  import { BytesLike, ethers } from 'ethers'
  import { ClientContext, SendUserOpContext, SignatureContext } from '@/contexts'
  import { useEstimateUserOpFee } from '@/hooks'
  import { useEthersSigner, useConfig, useScreenManager } from '@/hooks'
  import { OperationData, UserOperation, UserOperationResultInterface, screens } from '@/types'
  import { PAYMASTER_MODE } from '@/types/Paymaster'
  import { useBuilderWithPaymaster } from '@/utils'

  export const useSendUserOp = () => {
    const { navigateTo, currentScreen } = useScreenManager()
    const sendUserOpContext = useContext(SendUserOpContext)
    const signer = useEthersSigner()
    const client = useContext(ClientContext)
    const { simpleAccountInstance } = useContext(SignatureContext)!
    const { tokenPaymaster } = useConfig()
    const { estimateUserOpFee, ensurePaymasterApproval } = useEstimateUserOpFee()
    const { initBuilder } = useBuilderWithPaymaster(signer)

    if (!sendUserOpContext) {
      throw new Error('SendUserOpContext is undefined')
    }

    const { userOperations, setUserOperations, setLatestUserOpResult, latestUserOpResult } =
      useContext(SendUserOpContext)!

    const [resolveFunc, setResolveFunc] = useState<((value: any) => void) | null>(null)
    const [pendingUserOpHash, setPendingUserOpHash] = useState<string | null>(null)

    const resultRef = useRef(latestUserOpResult)

    useEffect(() => {
      if (resolveFunc && (latestUserOpResult || currentScreen !== screens.SENDUSEROP)) {
        resultRef.current = null
        resolveFunc(latestUserOpResult)
        setResolveFunc(null)
      }
    }, [latestUserOpResult, currentScreen])

    const waitForUserOpResult = useCallback(
      (): Promise<UserOperationResultInterface> =>
        new Promise((resolve) => {
          if (resultRef.current) {
            resolve(resultRef.current)
            resultRef.current = null
          } else if (pendingUserOpHash) {
            resolve({
              userOpHash: pendingUserOpHash,
              result: false,
              transactionHash: '',
            })
          } else {
            setResolveFunc(() => resolve)
          }
        }),
      [latestUserOpResult, pendingUserOpHash],
    )

    const checkUserOpStatus = useCallback(
      async (userOpHash: string): Promise<boolean | null> => {
        if (!simpleAccountInstance) {
          return null
        }
        try {
          return await simpleAccountInstance.checkUserOp(userOpHash)
        } catch (error) {
          console.error('Error checking UserOp status:', error)
          return null
        }
      },
      [simpleAccountInstance],
    )

    const estimateUserOpFeeWrapper = useCallback(
      async (usePaymaster: boolean = false, paymasterTokenAddress?: string, type: number = 0) => {
        if (userOperations.length === 0) {
          return '0'
        }

        const operations: OperationData[] = userOperations.map((op) => ({
          contractAddress: op.contractAddress,
          abi: op.abi,
          function: op.function,
          params: op.params,
          value: op.value || ethers.constants.Zero,
        }))

        return estimateUserOpFee(operations, usePaymaster, paymasterTokenAddress, type)
      },
      [estimateUserOpFee, userOperations],
    )

    const execute = useCallback(async (
      operation: UserOperation,
      paymentIntent?: { usePaymaster: boolean; type: number; tokenAddress?: string }
    ) => {
      resultRef.current = null
      setLatestUserOpResult(null)
      setUserOperations([operation])
      if (sendUserOpContext && (sendUserOpContext as any).setPaymentIntentForNextOp) {
        (sendUserOpContext as any).setPaymentIntentForNextOp(paymentIntent || null);
      }
      sendUserOpContext?.forceOpenPanel()
      if (currentScreen !== screens.SENDUSEROP) {
        navigateTo(screens.SENDUSEROP)
      }
    }, [setUserOperations, setLatestUserOpResult, sendUserOpContext, navigateTo, currentScreen])

    const executeBatch = useCallback(async (
      operations: UserOperation[],
      paymentIntent?: { usePaymaster: boolean; type: number; tokenAddress?: string }
    ) => {
      resultRef.current = null
      setLatestUserOpResult(null)
      setUserOperations(operations)
      if (sendUserOpContext && (sendUserOpContext as any).setPaymentIntentForNextOp) {
        (sendUserOpContext as any).setPaymentIntentForNextOp(paymentIntent || null);
      }
      sendUserOpContext?.forceOpenPanel()
      if (currentScreen !== screens.SENDUSEROP) {
        navigateTo(screens.SENDUSEROP)
      }
    }, [setUserOperations, setLatestUserOpResult, sendUserOpContext, navigateTo, currentScreen])

    const sendUserOp = useCallback(
      async (usePaymaster: boolean = false, paymasterTokenAddress?: string, type: number = 0) => {
        if (!signer || !client || !simpleAccountInstance || !initBuilder) {
          return null
        }

        try {
          if (userOperations.length === 0) {
            return null
          }

          let operations: { to: string; value: ethers.BigNumberish; data: BytesLike }[] = []

          if (usePaymaster && paymasterTokenAddress && type !== PAYMASTER_MODE.FREE_GAS) {
            try {
              const approved = await ensurePaymasterApproval(paymasterTokenAddress)
              if (!approved) {
                console.warn('Failed to ensure paymaster approval, transaction may fail')
              }
            } catch (error) {
              console.error('Error ensuring allowance:', error)
            }
          }

          if (userOperations.length === 1) {
            const userOperation = userOperations[0]
            const contract = new ethers.Contract(
              userOperation.contractAddress,
              userOperation.abi,
              signer,
            )

            operations.push({
              to: contract.address,
              value: userOperation.value || ethers.constants.Zero,
              data: contract.interface.encodeFunctionData(
                userOperation.function,
                userOperation.params,
              ),
            })
          } else if (userOperations.length > 1) {
            userOperations.forEach((operation) => {
              const contract = new ethers.Contract(operation.contractAddress, operation.abi, signer)
              operations.push({
                to: contract.address,
                value: operation.value || ethers.constants.Zero,
                data: contract.interface.encodeFunctionData(operation.function, operation.params),
              })
            })
          }

          const builder = await initBuilder(usePaymaster, paymasterTokenAddress, type)
          if (!builder) {
            return null
          }

          let userOp
          if (operations.length === 1) {
            const op = operations[0]
            userOp = await builder.execute(op.to, op.value, op.data)
          } else {
            const to = operations.map((op) => op.to)
            const data = operations.map((op) => op.data)
            userOp = await builder.executeBatch(to, data)
          }

          const res = await client.sendUserOperation(userOp, {
            dryRun: false,
          })
          setPendingUserOpHash(res.userOpHash)

          const ev = await res.wait()
          const userOpResult = await simpleAccountInstance.checkUserOp(res.userOpHash)
          const result = {
            userOpHash: res.userOpHash,
            result: userOpResult,
            transactionHash: ev ? ev.transactionHash : '',
          }

          setUserOperations([])
          setLatestUserOpResult(result)
          resultRef.current = result
          setPendingUserOpHash(null)
          return userOpResult
        } catch (error) {
          console.error('SendUserOp error:', error)
          throw error
        }
      },
      [
        signer,
        client,
        simpleAccountInstance,
        initBuilder,
        userOperations,
        tokenPaymaster,
        ensurePaymasterApproval,
      ],
    )

    return {
      execute,
      executeBatch,
      sendUserOp,
      estimateUserOpFee: estimateUserOpFeeWrapper,
      latestUserOpResult,
      waitForUserOpResult,
      checkUserOpStatus,
    }
  }
