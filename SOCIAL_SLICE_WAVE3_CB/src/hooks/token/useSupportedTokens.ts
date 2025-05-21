import { useContext, useState, useCallback } from 'react'
import { ClientContext } from '@/contexts'
import { useEthersSigner } from '@/hooks'
import { PaymasterToken } from '@/types'
import { useBuilderWithPaymaster } from '@/utils'

interface RawToken {
  address?: string
  token?: string
  symbol?: string
  price?: string
  type?: string
  decimals?: number
  prepay?: boolean
  postpay?: boolean
  freepay?: boolean
}

export const useSupportedTokens = () => {
  const [supportedTokens, setSupportedTokens] = useState<PaymasterToken[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { initBuilder } = useBuilderWithPaymaster(useEthersSigner())
  const client = useContext(ClientContext)

  const fetchSupportedTokens = useCallback(async () => {
    if (!client) return

    setIsLoading(true)
    setError(null)

    try {
      const builder = await initBuilder(true)
      if (!builder) {
        throw new Error('Failed to initialize builder')
      }

      const response = await client.getSupportedTokens(builder)
      
      // Ensure we have an array of tokens
      const tokens = Array.isArray(response) ? response : 
                    response?.tokens ? response.tokens :
                    response?.data ? response.data :
                    []

      if (!Array.isArray(tokens)) {
        throw new Error('Invalid tokens response format')
      }
      
      // Normalize and validate tokens
      const normalizedTokens = tokens.map((token: RawToken) => ({
        token: token.address || token.token || '',
        symbol: token.symbol || "Unknown",
        price: token.price || "0",
        type: token.type || "erc20",
        decimals: token.decimals || 18,
        prepay: token.prepay === true,
        postpay: token.postpay === true,
        freepay: token.freepay === true
      })).filter(token => token.token !== '') // Filter out invalid tokens

      setSupportedTokens(normalizedTokens)
    } catch (err) {
      console.error("Error fetching supported tokens:", err)
      setError(err instanceof Error ? err.message : 'Failed to fetch supported tokens')
      setSupportedTokens([])
    } finally {
      setIsLoading(false)
    }
  }, [client, initBuilder])

  return {
    supportedTokens,
    isLoading,
    error,
    fetchSupportedTokens
  }
}
