import { ethers } from 'ethers';

export const ESCROW_PLATFORM_ABI = [
  "function acceptERC20(address token, uint256 amount) external",
  "function acceptNFT(address token, uint256 tokenId) external",
  "function pools(uint256 poolId) external view returns (address sender, address tokenAddress, uint256 tokenId, uint256 amount, bool isNFT, bool released)",
  "function poolCount() external view returns (uint256)"
];

export const ESCROW_PLATFORM_ADDRESS = "0x23d5b252470e47665e87ef2a8e2e44349e67e868";

export interface Pool {
  sender: string;
  tokenAddress: string;
  tokenId: ethers.BigNumber;
  amount: ethers.BigNumber;
  isNFT: boolean;
  released: boolean;
} 