import { ethers } from 'ethers';
import { Client, Presets } from 'userop';
import { NERO_CHAIN_CONFIG, AA_PLATFORM_CONFIG, CONTRACT_ADDRESSES, API_KEY } from '../config';
import { ESCROW_PLATFORM_ABI, ESCROW_PLATFORM_ADDRESS } from '../contracts/EscrowPlatform';

// =================================================================
// Provider and Signer Management
// =================================================================

/**
 * Get provider instance for Nerochain
 */
export const getProvider = () => {
  // TODO: Implement this function to return a JsonRpcProvider
  return new ethers.providers.JsonRpcProvider(NERO_CHAIN_CONFIG.rpcUrl);
};

/**
 * Get signer from browser wallet (like MetaMask)
 * 
 * @returns Connected wallet signer
 */
export const getSigner = async () => {
  if (!window.ethereum) {
    throw new Error("No crypto wallet found. Please install MetaMask.");
  }
  
  try {
    // Request account access
    await window.ethereum.request({ method: 'eth_requestAccounts' });
 
    // Create provider and signer
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
 
    // Verify the signer by getting its address
    const address = await signer.getAddress();
    console.log("Connected wallet address:", address);
 
    return signer;
  } catch (error) {
    console.error("Error connecting to wallet:", error);
    throw error;
  }
};
// =================================================================
// Account Abstraction Client
// =================================================================

/**
 * Initialize AA Client
 * 
 * @param accountSigner The signer to use
 * @returns AA Client
 */
export const initAAClient = async (accountSigner: ethers.Signer) => {
  try {
    // TODO: Implement this function to initialize the AA client
    return await Client.init(NERO_CHAIN_CONFIG.rpcUrl, {
      overrideBundlerRpc: AA_PLATFORM_CONFIG.bundlerRpc,
      entryPoint: CONTRACT_ADDRESSES.entryPoint,
    });
  } catch (error) {
    console.error("Error initializing AA client:", error);
    throw error;
  }
};

/**
 * Get the AA wallet address for a signer
 * 
 * @param accountSigner The signer to use
 * @returns AA wallet address
 */
export const getAAWalletAddress = async (accountSigner: ethers.Signer) => {
  try {
    // Ensure we have a valid signer with getAddress method
    if (!accountSigner || typeof accountSigner.getAddress !== 'function') {
      throw new Error("Invalid signer object: must have a getAddress method");
    }
    
    // Initialize the SimpleAccount builder
    const simpleAccount = await Presets.Builder.SimpleAccount.init(
      accountSigner,
      NERO_CHAIN_CONFIG.rpcUrl,
      {
        overrideBundlerRpc: AA_PLATFORM_CONFIG.bundlerRpc,
        entryPoint: CONTRACT_ADDRESSES.entryPoint,
        factory: CONTRACT_ADDRESSES.accountFactory,
      }
    );
    
    // Get the counterfactual address of the AA wallet
    const address = await simpleAccount.getSender();
    console.log("AA wallet address:", address);
    
    return address;
  } catch (error) {
    console.error("Error getting AA wallet address:", error);
    throw error;
  }
};

// =================================================================
// Paymaster Integration
// =================================================================

/**
 * Initialize AA Builder
 * 
 * @param accountSigner The signer to use
 * @param apiKey Optional API key to use
 * @returns AA Builder
 */
export const initAABuilder = async (accountSigner: ethers.Signer, apiKey?: string) => {
  try {
    // Ensure we have a valid signer with getAddress method
    if (!accountSigner || typeof accountSigner.getAddress !== 'function') {
      throw new Error("Invalid signer object: must have a getAddress method");
    }
 
    // Get the signer address to verify it's working
    const signerAddress = await accountSigner.getAddress();
    console.log("Initializing AA builder for address:", signerAddress);
    
    // Initialize the SimpleAccount builder
    const builder = await Presets.Builder.SimpleAccount.init(
      accountSigner,
      NERO_CHAIN_CONFIG.rpcUrl,
      {
        overrideBundlerRpc: AA_PLATFORM_CONFIG.bundlerRpc,
        entryPoint: CONTRACT_ADDRESSES.entryPoint,
        factory: CONTRACT_ADDRESSES.accountFactory,
      }
    );
    
    // Set API key for paymaster
    const currentApiKey = apiKey || API_KEY;
    
    // Set paymaster options with API key
    builder.setPaymasterOptions({
      apikey: currentApiKey,
      rpc: AA_PLATFORM_CONFIG.paymasterRpc,
      type: "0" // Default to free (sponsored gas)
    });
    
    // Set gas parameters for the UserOperation
    builder.setCallGasLimit(300000);
    builder.setVerificationGasLimit(2000000);
    builder.setPreVerificationGas(100000);
    
    return builder;
  } catch (error) {
    console.error("Error initializing AA builder:", error);
    throw error;
  }
};

/**
 * Configure payment type for transactions
 * 
 * @param builder The AA builder
 * @param paymentType Payment type (0=free, 1=prepay, 2=postpay)
 * @param tokenAddress Optional token address for ERC20 payments
 * @returns Updated builder
 */
export const setPaymentType = (builder: any, paymentType: number, tokenAddress: string = '') => {
  const paymasterOptions: any = { 
    type: paymentType.toString(),
    apikey: API_KEY,
    rpc: AA_PLATFORM_CONFIG.paymasterRpc
  };
  
  // Add token address if ERC20 payment is selected
  if (paymentType > 0 && tokenAddress) {
    paymasterOptions.token = tokenAddress;
  }
  
  builder.setPaymasterOptions(paymasterOptions);
  return builder;
};

// =================================================================
// UserOperations
// =================================================================

/**
 * Execute a contract call via AA and paymaster
 */
export const executeOperation = async (
  accountSigner: ethers.Signer,
  contractAddress: string,
  contractAbi: any,
  functionName: string,
  functionParams: any[],
  paymentType: number = 0,
  selectedToken: string = '',
  options?: {
    apiKey?: string;
    gasMultiplier?: number;
  }
): Promise<UserOperationResult> => {
  try {
    const client = await initAAClient(accountSigner);
    const builder = await initAABuilder(accountSigner, options?.apiKey);

    const contract = new ethers.Contract(
      contractAddress,
      contractAbi,
      getProvider()
    );

    const callData = contract.interface.encodeFunctionData(
      functionName,
      functionParams
    );

    const userOp = await builder.execute(contractAddress, 0, callData);
    const response = await client.sendUserOperation(userOp);
    const event = await response.wait();

    if (!event) {
      throw new Error('Operation failed: No event received');
    }

    return {
      userOpHash: response.userOpHash,
      transactionHash: event.transactionHash,
      success: true
    };

  } catch (error: any) {
    console.error('Error executing operation:', error);
    throw error;
  }
};

// =================================================================
// Escrow Platform Operations
// =================================================================

/**
 * Check and handle token approvals
 */
export const checkAndApproveToken = async (
  accountSigner: ethers.Signer,
  tokenAddress: string,
  spenderAddress: string,
  amount: ethers.BigNumber
) => {
  const ERC20_ABI = [
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 amount) returns (bool)"
  ];

  const token = new ethers.Contract(tokenAddress, ERC20_ABI, accountSigner);
  const ownerAddress = await accountSigner.getAddress();
  
  // Check current allowance
  const currentAllowance = await token.allowance(ownerAddress, spenderAddress);
  
  if (currentAllowance.lt(amount)) {
    // Need to approve
    const tx = await token.approve(spenderAddress, amount);
    await tx.wait();
    return true;
  }
  
  return false;
};

/**
 * Check token balance
 */
export const checkTokenBalance = async (
  accountSigner: ethers.Signer,
  tokenAddress: string,
  requiredAmount: ethers.BigNumber
) => {
  const ERC20_ABI = [
    "function balanceOf(address account) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)"
  ];

  const token = new ethers.Contract(tokenAddress, ERC20_ABI, accountSigner);
  const ownerAddress = await accountSigner.getAddress();
  
  const balance = await token.balanceOf(ownerAddress);
  const decimals = await token.decimals();
  const symbol = await token.symbol();
  
  if (balance.lt(requiredAmount)) {
    const formattedRequired = ethers.utils.formatUnits(requiredAmount, decimals);
    const formattedBalance = ethers.utils.formatUnits(balance, decimals);
    throw new Error(`Insufficient ${symbol} balance. Required: ${formattedRequired}, Available: ${formattedBalance}`);
  }
  
  return true;
};

/**
 * Execute token approval with sponsored gas
 */
export const executeTokenApproval = async (
  accountSigner: ethers.Signer,
  tokenAddress: string,
  spenderAddress: string,
  amount: ethers.BigNumber
): Promise<UserOperationResult> => {
  try {
    const client = await initAAClient(accountSigner);
    const builder = await initAABuilder(accountSigner);
    
    const tokenContract = new ethers.Contract(tokenAddress, [
      'function approve(address spender, uint256 amount) returns (bool)'
    ], accountSigner);

    const callData = tokenContract.interface.encodeFunctionData('approve', [
      spenderAddress,
      amount
    ]);

    const userOp = await builder.execute(tokenAddress, 0, callData);
    const response = await client.sendUserOperation(userOp);
    const event = await response.wait();

    if (!event) {
      throw new Error('Token approval transaction failed - no event received');
    }

    return {
      userOpHash: response.userOpHash,
      transactionHash: event.transactionHash,
      success: true
    };

  } catch (error: any) {
    console.error('Error in executeTokenApproval:', error);
    throw error;
  }
};

/**
 * Deposit ERC20 tokens into escrow with sponsored gas
 */
export const depositERC20 = async (
  accountSigner: ethers.Signer,
  tokenAddress: string,
  amount: ethers.BigNumber,
  paymentType: number = 0,
  selectedToken: string = '',
  options?: {
    apiKey?: string;
    gasMultiplier?: number;
  }
): Promise<UserOperationResult> => {
  try {
    const client = await initAAClient(accountSigner);
    const builder = await initAABuilder(accountSigner, options?.apiKey);

    // Check token balance first
    const aaWalletAddress = await getAAWalletAddress(accountSigner);
    await checkTokenBalance(accountSigner, tokenAddress, amount);

    // Check and execute approval if needed
    const approvalNeeded = await checkAndApproveToken(
      accountSigner,
      tokenAddress,
      ESCROW_PLATFORM_ADDRESS,
      amount
    );

    if (approvalNeeded) {
      const approvalResult = await executeTokenApproval(
        accountSigner,
        tokenAddress,
        ESCROW_PLATFORM_ADDRESS,
        amount
      );
      
      if (!approvalResult.success) {
        throw new Error('Token approval failed');
      }
    }

    // Create escrow platform contract instance
    const escrowContract = new ethers.Contract(
      ESCROW_PLATFORM_ADDRESS,
      ESCROW_PLATFORM_ABI,
      accountSigner
    );

    const callData = escrowContract.interface.encodeFunctionData('depositERC20', [
      tokenAddress,
      amount
    ]);

    const userOp = await builder.execute(ESCROW_PLATFORM_ADDRESS, 0, callData);
    const response = await client.sendUserOperation(userOp);
    const event = await response.wait();

    if (!event) {
      throw new Error('Deposit transaction failed - no event received');
    }

    return {
      userOpHash: response.userOpHash,
      transactionHash: event.transactionHash,
      success: true
    };

  } catch (error: any) {
    console.error('Error in depositERC20:', error);
    throw error;
  }
};

/**
 * Deposit NFT into escrow
 */
export const depositNFT = async (
  accountSigner: ethers.Signer,
  nftAddress: string,
  tokenId: ethers.BigNumber,
  paymentType: number = 0,
  selectedToken: string = '',
  options?: {
    apiKey?: string;
    gasMultiplier?: number;
  }
) => {
  try {
    // First approve the escrow contract for the NFT
    const nftContract = new ethers.Contract(
      nftAddress,
      ["function approve(address to, uint256 tokenId) external"],
      accountSigner
    );

    // Execute approve operation
    await executeOperation(
      accountSigner,
      nftAddress,
      ["function approve(address to, uint256 tokenId) external"],
      'approve',
      [ESCROW_PLATFORM_ADDRESS, tokenId],
      paymentType,
      selectedToken,
      options
    );

    // Now deposit into escrow
    return await executeOperation(
      accountSigner,
      ESCROW_PLATFORM_ADDRESS,
      ESCROW_PLATFORM_ABI,
      'acceptNFT',
      [nftAddress, tokenId],
      paymentType,
      selectedToken,
      options
    );
  } catch (error) {
    console.error("Error depositing NFT:", error);
    throw error;
  }
};

/**
 * Get pool details
 */
export const getPoolDetails = async (
  provider: ethers.providers.Provider,
  poolId: number
) => {
  try {
    const contract = new ethers.Contract(
      ESCROW_PLATFORM_ADDRESS,
      ESCROW_PLATFORM_ABI,
      provider
    );
    
    return await contract.pools(poolId);
  } catch (error) {
    console.error("Error getting pool details:", error);
    throw error;
  }
};

/**
 * Get total number of pools
 */
export const getPoolCount = async (
  provider: ethers.providers.Provider
) => {
  try {
    const contract = new ethers.Contract(
      ESCROW_PLATFORM_ADDRESS,
      ESCROW_PLATFORM_ABI,
      provider
    );
    
    return await contract.poolCount();
  } catch (error) {
    console.error("Error getting pool count:", error);
    throw error;
  }
};

// =================================================================
// Token Support
// =================================================================

/**
 * Get supported tokens from the paymaster
 * 
 * @param client AA client instance
 * @param builder AA builder instance
 * @returns List of supported tokens
 */
export const getSupportedTokens = async (client: any, builder: any) => {
  try {
    // Make sure the builder is initialized
    if (!builder) {
      throw new Error("Builder not initialized");
    }
 
    // Get the AA wallet address
    const sender = await builder.getSender();
    console.log("Getting supported tokens for wallet:", sender);
 
    // Create a minimal UserOp for querying tokens
    const minimalUserOp = {
      sender,
      nonce: "0x0",
      initCode: "0x",
      callData: "0x",
      callGasLimit: "0x88b8",
      verificationGasLimit: "0x33450",
      preVerificationGas: "0xc350",
      maxFeePerGas: "0x2162553062",
      maxPriorityFeePerGas: "0x40dbcf36",
      paymasterAndData: "0x",
      signature: "0x"
    };
 
    // Setup provider for paymaster API call
    const provider = new ethers.providers.JsonRpcProvider(AA_PLATFORM_CONFIG.paymasterRpc);
    console.log("Connecting to paymaster RPC at:", AA_PLATFORM_CONFIG.paymasterRpc);
 
    // Log API key (redacted for security)
    const maskedApiKey = API_KEY ? `${API_KEY.substring(0, 4)}...${API_KEY.substring(API_KEY.length - 4)}` : 'undefined';
    console.log(`Using API key: ${maskedApiKey}`);
    
    // Try different parameter formats for the paymaster API
    let tokensResponse;
    
    try {
      // First format attempt: [userOp, apiKey, entryPoint]
      console.log("Trying first parameter format for pm_supported_tokens");
      tokensResponse = await provider.send("pm_supported_tokens", [
        minimalUserOp,
        API_KEY,
        CONTRACT_ADDRESSES.entryPoint
      ]);
    } catch (formatError) {
      console.warn("First parameter format failed:", formatError);
      
      try {
        // Second format attempt: { userOp, entryPoint, apiKey }
        console.log("Trying second parameter format for pm_supported_tokens");
        tokensResponse = await provider.send("pm_supported_tokens", [{
          userOp: minimalUserOp,
          entryPoint: CONTRACT_ADDRESSES.entryPoint,
          apiKey: API_KEY
        }]);
      } catch (format2Error) {
        console.warn("Second parameter format failed:", format2Error);
        
        // Third format attempt: { op, entryPoint }
        console.log("Trying third parameter format for pm_supported_tokens");
        tokensResponse = await provider.send("pm_supported_tokens", [{
          op: minimalUserOp,
          entryPoint: CONTRACT_ADDRESSES.entryPoint
        }]);
      }
    }
 
    console.log("Tokens response:", tokensResponse);
 
    // Transform and return the results
    if (!tokensResponse) {
      console.log("No tokens response received");
      return [];
    }
    
    // Handle different response formats
    let tokens = [];
    if (tokensResponse.tokens) {
      tokens = tokensResponse.tokens;
    } else if (Array.isArray(tokensResponse)) {
      tokens = tokensResponse;
    } else if (typeof tokensResponse === 'object') {
      // Try to find tokens in the response object
      const possibleTokensArray = Object.values(tokensResponse).find(val => Array.isArray(val));
      if (possibleTokensArray && Array.isArray(possibleTokensArray)) {
        tokens = possibleTokensArray as any[];
      }
    }
    
    if (tokens.length === 0) {
      console.log("No tokens found in response");
      return [];
    }
    
    // Log the raw token response for debugging
    console.log("Raw tokens response:", JSON.stringify(tokensResponse));
    
    // Try to find flags in the response that might indicate token types
    const isArrayWithFreepayFlag = tokens.some((t: any) => 
      'freepay' in t || 'prepay' in t || 'postpay' in t
    );
      
    if (isArrayWithFreepayFlag) {
      console.log("Detected payment type flags in token response");
    }
 
    const mappedTokens = tokens.map((token: any) => {
      // Ensure token type is a valid number
      let tokenType = 1; // Default to type 1 (prepay)
      
      // Check if this is from a response with prepay/postpay flags
      if ('freepay' in token || 'prepay' in token || 'postpay' in token) {
        if (token.freepay === true) {
          tokenType = 0; // Sponsored
        } else if (token.prepay === true) {
          tokenType = 1; // Prepay
        } else if (token.postpay === true) {
          tokenType = 2; // Postpay
        }
      } 
      // Try to parse the type if it exists
      else if (token.type !== undefined) {
        if (typeof token.type === 'number' && !isNaN(token.type)) {
          tokenType = token.type;
        } else if (typeof token.type === 'string') {
          const parsedType = parseInt(token.type);
          if (!isNaN(parsedType)) {
            tokenType = parsedType;
          }
        }
      }
      
      // Create the token object with normalized properties
      return {
        address: token.token || token.address,
        decimal: parseInt(token.decimal || token.decimals || "18"),
        symbol: token.symbol,
        type: tokenType,
        price: token.price ? parseFloat(token.price) : undefined,
        // Add the original flags for debugging and alternative filtering
        prepay: token.prepay === true,
        postpay: token.postpay === true || token.prepay === true,
        freepay: token.freepay === true
      };
    });
 
    console.log("Mapped tokens:", mappedTokens);
    return mappedTokens;
  } catch (error) {
    console.error("Error fetching supported tokens:", error);
    // Include paymaster URL in error for debugging
    console.error("Paymaster URL:", AA_PLATFORM_CONFIG.paymasterRpc);
    return [];
  }
};