// scripts/testInteract.ts
import { network } from "hardhat";

async function main() {
  const { ethers } = await network.connect();
  const signers = await ethers.getSigners();

  const crowdFundAddr = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const tokenAddr = "0xa16E02E87b7454126E5E10d957A927A7F5B5d2be";

  const crowdFund = await ethers.getContractAt("CrowdFund", crowdFundAddr);
  const token = await ethers.getContractAt("ProjectToken", tokenAddr);

  console.log("=== 开始测试 ===");

  // 1. 用户1投资 0.5 ETH
  console.log("用户1投入 0.5 ETH...");
  await crowdFund.connect(signers[1]).fund({ value: ethers.parseEther("0.5") });
  const balance1 = await token.balanceOf(signers[1].address);
  console.log("用户1代币余额:", balance1.toString(), "(预期 5200)");

  // 2. 用户2投资 0.3 ETH
  console.log("用户2投入 0.3 ETH...");
  await crowdFund.connect(signers[2]).fund({ value: ethers.parseEther("0.3") });
  const balance2 = await token.balanceOf(signers[2].address);
  console.log("用户2代币余额:", balance2.toString(), "(预期 3200)");

  // 3. 检查总筹集
  const total = await crowdFund.totalRaised();
  console.log("总筹集额:", ethers.formatEther(total), "ETH (预期 0.8 ETH)");

  console.log("=== 测试完成 ===");
}

main().catch(console.error);