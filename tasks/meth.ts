import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

const TOKEN_DEPLOYMENT = "ERC7984ETH";
const STAKING_DEPLOYMENT = "METHStaking";
const MAX_OPERATOR_WINDOW = (1n << 48n) - 1n;

task("task:meth:addresses", "Print the deployed contract addresses").setAction(async (_args, hre) => {
  const { deployments } = hre;
  const token = await deployments.get(TOKEN_DEPLOYMENT);
  const staking = await deployments.get(STAKING_DEPLOYMENT);
  console.log(`ERC7984ETH: ${token.address}`);
  console.log(`METHStaking: ${staking.address}`);
});

task("task:meth:mint", "Mint one test mETH token for the first signer")
  .addOptionalParam("count", "Number of times to call mintFree", "1")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { deployments, ethers } = hre;
    const tokenDeployment = await deployments.get(TOKEN_DEPLOYMENT);
    const token = await ethers.getContractAt(TOKEN_DEPLOYMENT, tokenDeployment.address);
    const [signer] = await ethers.getSigners();

    const iterations = Number(taskArguments.count ?? "1");
    for (let i = 0; i < iterations; i++) {
      const tx = await token.connect(signer).mintFree();
      await tx.wait();
    }

    console.log(`Minted ${iterations} mETH to ${signer.address}`);
  });

task("task:meth:stake", "Stake mETH using an encrypted amount (micro units)")
  .addParam("value", "Amount to stake in micro mETH (1 mETH = 1_000_000)")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { deployments, ethers, fhevm } = hre;
    const value = BigInt(taskArguments.value as string);

    const stakingDeployment = await deployments.get(STAKING_DEPLOYMENT);
    const tokenDeployment = await deployments.get(TOKEN_DEPLOYMENT);

    const staking = await ethers.getContractAt(STAKING_DEPLOYMENT, stakingDeployment.address);
    const token = await ethers.getContractAt(TOKEN_DEPLOYMENT, tokenDeployment.address);
    const [signer] = await ethers.getSigners();

    const operatorStatus = await token.isOperator(signer.address, stakingDeployment.address);
    if (!operatorStatus) {
      const opTx = await token.connect(signer).setOperator(stakingDeployment.address, MAX_OPERATOR_WINDOW);
      await opTx.wait();
      console.log(`Operator granted to staking contract for ${signer.address}`);
    }

    const encryptedValue = await fhevm
      .createEncryptedInput(stakingDeployment.address, signer.address)
      .add64(value)
      .encrypt();

    const tx = await staking
      .connect(signer)
      ["stake(bytes32,bytes)"](encryptedValue.handles[0], encryptedValue.inputProof);
    await tx.wait();
    console.log(`Staked ${value} micro mETH from ${signer.address}`);
  });

task("task:meth:unstake", "Unstake mETH using an encrypted amount (micro units)")
  .addParam("value", "Amount to unstake in micro mETH (1 mETH = 1_000_000)")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { deployments, ethers, fhevm } = hre;
    const value = BigInt(taskArguments.value as string);

    const stakingDeployment = await deployments.get(STAKING_DEPLOYMENT);
    const staking = await ethers.getContractAt(STAKING_DEPLOYMENT, stakingDeployment.address);
    const [signer] = await ethers.getSigners();

    const encryptedValue = await fhevm
      .createEncryptedInput(stakingDeployment.address, signer.address)
      .add64(value)
      .encrypt();

    const tx = await staking
      .connect(signer)
      ["unstake(bytes32,bytes)"](encryptedValue.handles[0], encryptedValue.inputProof);
    await tx.wait();
    console.log(`Unstake attempted for ${value} micro mETH from ${signer.address}`);
  });

task("task:meth:staked-balance", "Decrypt and display the staked balance for the first signer")
  .setAction(async (_taskArguments: TaskArguments, hre) => {
    const { deployments, ethers, fhevm } = hre;
    const stakingDeployment = await deployments.get(STAKING_DEPLOYMENT);
    const staking = await ethers.getContractAt(STAKING_DEPLOYMENT, stakingDeployment.address);
    const [signer] = await ethers.getSigners();

    const encryptedBalance = await staking.stakedBalanceOf(signer.address);
    if (encryptedBalance === ethers.ZeroHash) {
      console.log(`Staked balance for ${signer.address}: 0`);
      return;
    }

    const clearBalance = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedBalance,
      stakingDeployment.address,
      signer,
    );
    console.log(`Staked balance for ${signer.address}: ${clearBalance}`);
  });
