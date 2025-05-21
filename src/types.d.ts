interface Window {
  ethereum?: {
    isMetaMask?: boolean;
    request: (request: { method: string; params?: any[] }) => Promise<any>;
    on: (eventName: string, callback: (...args: any[]) => void) => void;
    removeListener: (eventName: string, callback: (...args: any[]) => void) => void;
  };
}

// Account Abstraction Types
interface UserOperationResult {
  userOpHash: string;
  transactionHash: string;
  success: boolean;
}

interface UserOperation {
  sender: string;
  nonce: string;
  initCode: string;
  callData: string;
  callGasLimit: string;
  verificationGasLimit: string;
  preVerificationGas: string;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  paymasterAndData: string;
  signature: string;
}

interface UserOperationEvent {
  userOpHash: string;
  transactionHash: string;
  success: boolean;
}

interface SimpleAccount {
  getSender(): Promise<string>;
  execute(
    target: string,
    value: number,
    data: string
  ): Promise<UserOperation>;
}

interface Client {
  waitForUserOperationEvent(userOpHash: string): Promise<UserOperationEvent | null>;
  sendUserOperation(userOp: UserOperation): Promise<{
    userOpHash: string;
    wait: () => Promise<UserOperationEvent>;
  }>;
}

interface UserOperationResponse {
  userOpHash: string;
  wait(): Promise<UserOperationEvent>;
} 