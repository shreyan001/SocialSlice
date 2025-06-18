import { useState, useEffect } from 'react'
import { ERC20_ABI } from '@/constants/abi'
// import CreateTokenFactory from '@/abis/ERC20/CreateTokenFactory.json'
import { useSignature, useSendUserOp } from '@/hooks'
import { UserOperation } from '@/types' // Assuming UserOperation type is imported

const Sample = () => {
  const { AAaddress, isConnected } = useSignature()
  const { execute, waitForUserOpResult, checkUserOpStatus } = useSendUserOp()

  // States for the normal (original) transaction
  const [isLoadingNormal, setIsLoadingNormal] = useState(false)
  const [userOpHashNormal, setUserOpHashNormal] = useState<string | null>(null)
  const [txStatusNormal, setTxStatusNormal] = useState<string>('')
  const [isPollingNormal, setIsPollingNormal] = useState(false)

  // States for the prepay ERC20 transaction
  const [isLoadingPrepay, setIsLoadingPrepay] = useState(false)
  const [userOpHashPrepay, setUserOpHashPrepay] = useState<string | null>(null)
  const [txStatusPrepay, setTxStatusPrepay] = useState<string>('')
  const [isPollingPrepay, setIsPollingPrepay] = useState(false)

  // Polling for normal transaction
  useEffect(() => {
    let intervalId: number | null = null
    const pollStatus = async () => {
      if (!userOpHashNormal || !isPollingNormal) return
      try {
        const status = await checkUserOpStatus(userOpHashNormal)
        if (status === true) {
          setTxStatusNormal('Transaction Successful!')
        } else {
          setTxStatusNormal('Transaction Failed.')
        }
      } catch (error) {
        console.error('Error checking status for normal transaction:', error)
        setTxStatusNormal('Error checking status.')
      } finally {
        setIsPollingNormal(false)
      }
    }
    if (userOpHashNormal && isPollingNormal) {
      setTxStatusNormal('Processing...')
      intervalId = window.setInterval(pollStatus, 3000) as unknown as number
      pollStatus()
    }
    return () => {
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [userOpHashNormal, isPollingNormal, checkUserOpStatus])

  // Polling for prepay transaction
  useEffect(() => {
    let intervalId: number | null = null
    const pollStatus = async () => {
      if (!userOpHashPrepay || !isPollingPrepay) return
      try {
        const status = await checkUserOpStatus(userOpHashPrepay)
        if (status === true) {
          setTxStatusPrepay('Transaction Successful!')
        } else {
          setTxStatusPrepay('Transaction Failed.')
        }
      } catch (error) {
        console.error('Error checking status for prepay transaction:', error)
        setTxStatusPrepay('Error checking status.')
      } finally {
        setIsPollingPrepay(false)
      }
    }
    if (userOpHashPrepay && isPollingPrepay) {
      setTxStatusPrepay('Processing...')
      intervalId = window.setInterval(pollStatus, 3000) as unknown as number
      pollStatus()
    }
    return () => {
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [userOpHashPrepay, isPollingPrepay, checkUserOpStatus])

  const handleExecuteNormal = async () => {
    if (!isConnected) {
      alert('Not connected')
      return
    }
    setIsLoadingNormal(true)
    setUserOpHashNormal(null)
    setTxStatusNormal('')
    try {
      const operation: UserOperation = {
        function: 'approve',
        contractAddress: '0xC86Fed58edF0981e927160C50ecB8a8B05B32fed',
        abi: ERC20_ABI,
        value: 0,
        params: ['0x5a6680dfd4a77feea0a7be291147768eaa2414ad', BigInt(1000000000000000000)],
      }
      // Explicitly define payment intent for sponsored/default transaction
      const paymentIntent = {
        usePaymaster: true, // Assuming sponsored is the default paymaster mode
        type: 0, // 0 for Sponsored/Free gas
        // tokenAddress is not needed for type 0
      }
      await execute(operation, paymentIntent)
      const result = await waitForUserOpResult()
      setUserOpHashNormal(result.userOpHash)
      setIsPollingNormal(true)
      // Status will be updated by poller
    } catch (error) {
      console.error('Execution error (Normal):', error)
      setTxStatusNormal('Execution failed.')
      setIsLoadingNormal(false)
    } finally {
      // setIsLoadingNormal(false) // Loading is false once polling starts or fails
    }
  }

  const handleExecutePrepay = async () => {
    if (!isConnected) {
      alert('Not connected')
      return
    }
    setIsLoadingPrepay(true)
    setUserOpHashPrepay(null)
    setTxStatusPrepay('')
    try {
      const operation: UserOperation = {
        function: 'approve', // Using the same sample transaction
        contractAddress: '0xC86Fed58edF0981e927160C50ecB8a8B05B32fed',
        abi: ERC20_ABI,
        value: 0,
        params: ['0x5a6680dfd4a77feea0a7be291147768eaa2414ad', BigInt(1000000000000000000)],
      }
      const paymentIntent = {
        usePaymaster: true, // This MUST be true for paymaster-mediated (including prepay)
        type: 1, // 1 for Prepay ERC20
        tokenAddress: '0x5a6680dfd4a77feea0a7be291147768eaa2414ad', // User's specified address
      }
      await execute(operation, paymentIntent)
      const result = await waitForUserOpResult()
      setUserOpHashPrepay(result.userOpHash)
      setIsPollingPrepay(true)
      // Status will be updated by poller
    } catch (error) {
      console.error('Execution error (Prepay):', error)
      setTxStatusPrepay('Execution failed.')
      setIsLoadingPrepay(false)
    } finally {
      // setIsLoadingPrepay(false) // Loading is false once polling starts or fails
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        padding: '20px',
        minHeight: '100vh',
        textAlign: 'center',
      }}
    >
      <p style={{ fontSize: '1.2rem', marginBottom: '20px', color: '#333' }}>
        AA Wallet: {AAaddress || 'Not Connected'}
      </p>

      {/* Normal Transaction Button and Info */}
      <div style={{ marginBottom: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
        <h3 style={{marginTop: 0}}>Standard Transaction</h3>
        <button
          onClick={handleExecuteNormal}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '5px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            opacity: isLoadingNormal ? 0.7 : 1,
          }}
          disabled={isLoadingNormal || isLoadingPrepay} // Disable if any is loading
        >
          {isLoadingNormal ? 'Processing...' : 'Send Sample UserOp'}
        </button>
        {userOpHashNormal && (
          <div style={{ marginTop: '15px', maxWidth: '500px' }}>
            <p style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>
              <strong>UserOpHash:</strong> {userOpHashNormal}
            </p>
            <p style={{ marginTop: '5px', color: txStatusNormal.includes('Success') ? 'green' : txStatusNormal.includes('Fail') || txStatusNormal.includes('Error') ? 'red' : 'blue' }}>
              <strong>Status:</strong> {txStatusNormal || 'Pending...'}
            </p>
          </div>
        )}
      </div>

      {/* Prepay ERC20 Transaction Button and Info */}
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#fff' }}>
        <h3 style={{marginTop: 0}}>Prepay ERC20 Transaction</h3>
        <button
          onClick={handleExecutePrepay}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '5px',
            backgroundColor: '#28a745',
            color: '#fff',
            border: 'none',
            marginTop: '10px',
            opacity: isLoadingPrepay ? 0.7 : 1,
          }}
          disabled={isLoadingNormal || isLoadingPrepay} // Disable if any is loading
        >
          {isLoadingPrepay ? 'Processing...' : 'Send UserOp (Prepay ERC20)'}
        </button>
        {userOpHashPrepay && (
          <div style={{ marginTop: '15px', maxWidth: '500px' }}>
            <p style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>
              <strong>UserOpHash:</strong> {userOpHashPrepay}
            </p>
            <p style={{ marginTop: '5px', color: txStatusPrepay.includes('Success') ? 'green' : txStatusPrepay.includes('Fail') || txStatusPrepay.includes('Error') ? 'red' : 'blue' }}>
              <strong>Status:</strong> {txStatusPrepay || 'Pending...'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Sample
