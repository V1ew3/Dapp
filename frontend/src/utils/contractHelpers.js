import { ethers } from 'ethers';
import { CROWDFUND_ADDRESS, TOKEN_ADDRESS } from '../constants';
import CrowdFundABI from '../assets/abis/CrowdFund.json';
import ProjectTokenABI from '../assets/abis/ProjectToken.json';

// 获取众筹合约实例 (带签名者，可写)
export const getCrowdFundContract = async () => {
  if (!window.ethereum) return null;
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CROWDFUND_ADDRESS, CrowdFundABI.abi, signer);
};

// 获取代币合约实例 (带签名者，可写)
export const getTokenContract = async () => {
  if (!window.ethereum) return null;
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(TOKEN_ADDRESS, ProjectTokenABI.abi, signer);
};