import { useState, useEffect } from 'react'
import { EscrowDeposit } from '@/components/EscrowDeposit'
import { ERC20_ABI } from '@/constants/abi'
import { useSignature, useSendUserOp } from '@/hooks'


const Sample = () => {
  const { AAaddress, isConnected } = useSignature()
  const { execute, waitForUserOpResult, checkUserOpStatus } = useSendUserOp()
  const [isLoading, setIsLoading] = useState(false)
  const [userOpHash, setUserOpHash] = useState<string | null>(null)
  const [txStatus, setTxStatus] = useState<string>('')
  const [isPolling, setIsPolling] = useState(false)
  const [showEscrowInterface, setShowEscrowInterface] = useState(false)

  useEffect(() => {
    let intervalId: number | null = null

    const pollStatus = async () => {
      if (!userOpHash || !isPolling) return

      try {
        const status = await checkUserOpStatus(userOpHash)
        if (status === true) {
          setTxStatus('Success!')
          setIsPolling(false)
        } else {
          setTxStatus('Failed')
          setIsPolling(false)
        }
      } catch (error) {
        console.error('Status check error:', error)
        setTxStatus('An error occurred')
        setIsPolling(false)
      }
    }

    if (userOpHash && isPolling) {
      setTxStatus('Processing...')
      intervalId = window.setInterval(pollStatus, 3000) as unknown as number
      pollStatus()
    }

    return () => {
      if (intervalId) window.clearInterval(intervalId)
    }
  }, [userOpHash, isPolling, checkUserOpStatus])

  const handleExecute = async () => {
    if (!isConnected) {
      alert('not connected')
      return
    }

    setIsLoading(true)
    setUserOpHash(null)
    setTxStatus('')

    try {
      await execute({
        function: 'approve',
        contractAddress: '0xC86Fed58edF0981e927160C50ecB8a8B05B32fed',
        abi: ERC20_ABI,
        value: 0,
        params: ['0x5a6680dfd4a77feea0a7be291147768eaa2414ad', BigInt(1000000000000000000)],
      })

      const result = await waitForUserOpResult()
      setUserOpHash(result.userOpHash)

      setIsPolling(true)

      if (result.result === true) {
        setTxStatus('Success!')
        setIsPolling(false)
      } else if (result.transactionHash) {
        setTxStatus('Transaction hash: ' + result.transactionHash)
      }
    } catch (error) {
      console.error('Execution error:', error)
      setTxStatus('An error occurred')
    } finally {
      setIsLoading(false)
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
        padding: '40px 30px',
        height: '100vh',
        textAlign: 'center',
      }}
    >
      <p
        style={{
          fontSize: '1.2rem',
          marginBottom: '20px',
          color: '#333',
        }}
      >
        {AAaddress}
      </p>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleExecute}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '5px',
            backgroundColor: '#007bff',
            color: '#fff',
            border: 'none',
            marginRight: '10px',
          }}
        >
          {isLoading ? 'Processing...' : 'Sample send userOp'}
        </button>

        <button
          onClick={() => setShowEscrowInterface(!showEscrowInterface)}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
            borderRadius: '5px',
            backgroundColor: showEscrowInterface ? '#dc3545' : '#28a745',
            color: '#fff',
            border: 'none',
          }}
        >
          {showEscrowInterface ? 'Close Escrow' : 'Escrow Prepay Demo'}
        </button>
      </div>

      {userOpHash && !showEscrowInterface && (
        <div style={{ marginTop: '20px', maxWidth: '500px' }}>
          <p style={{ wordBreak: 'break-all', fontSize: '0.9rem' }}>
            <strong>UserOpHash:</strong> {userOpHash}
          </p>
          <p
            style={{
              marginTop: '10px',
              color: txStatus.includes('Success')
                ? 'green'
                : txStatus.includes('Failed')
                  ? 'red'
                  : 'blue',
            }}
          >
            <strong>Status:</strong> {txStatus || 'Unknown'}
          </p>
        </div>
      )}

      {showEscrowInterface && (
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <EscrowDeposit />
        </div>
      )}
    </div>
  )
}

export default Sample
