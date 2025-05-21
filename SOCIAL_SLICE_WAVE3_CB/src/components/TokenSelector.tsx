import { useEffect, useState } from 'react'
import { useSupportedTokens } from '@/hooks'
import { PaymasterToken } from '@/types'
import { PAYMASTER_MODE } from '@/types/Paymaster'

interface TokenSelectorProps {
  onTokenSelect: (token: PaymasterToken | null, mode: number) => void
  selectedToken: PaymasterToken | null
  selectedMode: number
}

export const TokenSelector = ({ onTokenSelect, selectedToken }: TokenSelectorProps) => {
  const { supportedTokens, isLoading, error, fetchSupportedTokens } = useSupportedTokens()
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchSupportedTokens()
  }, [fetchSupportedTokens])

  const handleTokenClick = (token: PaymasterToken) => {
    if (selectedToken?.token === token.token) {
      onTokenSelect(null, PAYMASTER_MODE.FREE_GAS)
    } else {
      if (token.type === 'native') {
        onTokenSelect(token, PAYMASTER_MODE.NATIVE)
      } else {
        onTokenSelect(token, PAYMASTER_MODE.PRE_FUND)
      }
    }
    setIsOpen(false)
  }

  if (isLoading) return <div>Loading tokens...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div className="token-selector">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="token-selector-button"
      >
        {selectedToken ? selectedToken.symbol : 'Select Token'}
      </button>

      {isOpen && (
        <div className="token-list">
          {supportedTokens.map((token) => (
            <div
              key={token.token}
              onClick={() => handleTokenClick(token)}
              className={`token-item ${selectedToken?.token === token.token ? 'selected' : ''}`}
            >
              <span>{token.symbol}</span>
              <span>{token.price ? `$${token.price}` : ''}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 