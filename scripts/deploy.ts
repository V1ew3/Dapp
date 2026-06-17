// scripts/deploy.ts
import { network } from "hardhat";

async function main() {
  // Hardhat 3 通过 network.connect() 获取 ethers 实例
  const { ethers } = await network.connect();

  const [deployer] = await ethers.getSigners();
  console.log("部署账户地址:", deployer.address);
  console.log("账户余额:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // 众筹参数
  const goal = ethers.parseEther("1");          // 目标 1 ETH
  const duration = 7 * 24 * 60 * 60;            // 7 天
  const tokenName = "CrowdFund Coin";
  const tokenSymbol = "CFC";

  // 获取合约工厂
  const CrowdFund = await ethers.getContractFactory("CrowdFund");
  console.log("正在部署众筹合约...");

  // 部署
  const crowdFund = await CrowdFund.deploy(goal, duration, tokenName, tokenSymbol);
  await crowdFund.waitForDeployment();

  const crowdFundAddress = await crowdFund.getAddress();
  const tokenAddress = await crowdFund.token(); // 调用 public getter

  console.log("✅ 部署成功！");
  console.log("   CrowdFund 地址:", crowdFundAddress);
  console.log("   ProjectToken 地址:", tokenAddress);
  console.log("   目标金额:", ethers.formatEther(goal), "ETH");
  console.log("   兑换比例: 1 ETH = 10000 CFC");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});