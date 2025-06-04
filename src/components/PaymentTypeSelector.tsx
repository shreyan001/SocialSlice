import React from 'react';

interface PaymentTypeSelectorProps {
  paymentType: number;
  setPaymentType: (type: number, token?: string) => void;
  selectedToken: string;
  setSelectedToken: (token: string) => void;
  supportedTokens: Array<any>;
  isLoading: boolean;
}

/**
 * Component to select payment type (free, prepay, postpay) and token
 */
const PaymentTypeSelector: React.FC<PaymentTypeSelectorProps> = ({
  paymentType,
  setPaymentType,
  selectedToken,
  setSelectedToken,
  supportedTokens,
  isLoading
}) => {
  // Payment type options
  const paymentOptions = [
    { value: 0, label: 'Sponsored (No Gas Fee)' },
    { value: 1, label: 'Prepay with ERC20 Token' },
    { value: 2, label: 'Postpay with ERC20 Token' }
  ];

  // Payment type descriptions
  const paymentDescriptions = {
    0: 'Gas fees are covered by the application (free for you).',
    1: 'Pay for gas upfront with ERC20 tokens. Excess will be refunded.',
    2: 'Pay for gas after the transaction with ERC20 tokens.'
  };

  /**
   * Filter tokens based on payment type
   * TODO: Implement this function to filter tokens based on payment type
   */
  const getFilteredTokens = () => {
    if (paymentType === 0) return [];
   
    console.log("Payment type:", paymentType);
    console.log("All supported tokens:", supportedTokens);
    
    // For each token, check if it matches the payment type
    // If we can't determine the type, default to returning all tokens
    const filtered = supportedTokens.filter(token => {
      // If no tokens have the right type, return all tokens for selected payment type
      if (token.type === undefined) return true;
      
      // Use loose equality (==) instead of strict equality (===) to match numeric types
      return token.type === paymentType ||
        // For prepay (1), also include tokens with prepay=true
        (paymentType === 1 && token.prepay === true) ||
        // For postpay (2), also include tokens with postpay=true  
        (paymentType === 2 && token.postpay === true);
    });
    
    console.log("Filtered tokens for payment type", paymentType, ":", filtered);
    return filtered;
  };
  // Handle payment type change
  const handlePaymentTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = parseInt(e.target.value);
    setPaymentType(newType);
    setSelectedToken(''); // Reset selected token
  };

  // Handle token selection
  const handleTokenChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const tokenAddress = e.target.value;
    setSelectedToken(tokenAddress);
    setPaymentType(paymentType, tokenAddress);
  };

  // Get filtered tokens
  const filteredTokens = getFilteredTokens();

  return (
    <div className="payment-selector">
      <div className="payment-option">
        <label htmlFor="payment-type">Gas Payment Method:</label>
        <select
          id="payment-type"
          value={paymentType}
          onChange={handlePaymentTypeChange}
          disabled={isLoading}
          className="select-field"
        >
          {paymentOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <p className="payment-description">
        {paymentDescriptions[paymentType as keyof typeof paymentDescriptions]}
      </p>

      {paymentType > 0 && (
        <div className="token-option">
          <label htmlFor="token-select">Select Token:</label>
          <select
            id="token-select"
            value={selectedToken}
            onChange={handleTokenChange}
            disabled={isLoading || filteredTokens.length === 0}
            className="select-field"
          >
            <option value="">Select a token</option>
            {filteredTokens.map(token => (
              <option key={token.address} value={token.address}>
                {token.symbol}
              </option>
            ))}
          </select>

          {isLoading ? (
            <p className="loading-text">Loading available tokens...</p>
          ) : filteredTokens.length === 0 && paymentType > 0 ? (
            <p className="error-text">No tokens available for this payment type.</p>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default PaymentTypeSelector; 