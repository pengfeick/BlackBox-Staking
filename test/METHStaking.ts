import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { expect } from "chai";
import { ethers, fhevm } from "hardhat";
import { ERC7984ETH, ERC7984ETH__factory, METHStaking, METHStaking__factory } from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

const MAX_OPERATOR_WINDOW = (1n << 48n) - 1n;
const ONE_METH = 1_000_000n;

describe("METHStaking", function () {
  let signers: Signers;
  let token: ERC7984ETH;
  let staking: METHStaking;
  let tokenAddress: string;
  let stakingAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = {
      deployer: ethSigners[0],
      alice: ethSigners[1],
      bob: ethSigners[2],
    };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      this.skip();
    }

    const tokenFactory = (await ethers.getContractFactory("ERC7984ETH")) as ERC7984ETH__factory;
    token = (await tokenFactory.deploy()) as ERC7984ETH;
    tokenAddress = await token.getAddress();

    const stakingFactory = (await ethers.getContractFactory("METHStaking")) as METHStaking__factory;
    staking = (await stakingFactory.deploy(tokenAddress)) as METHStaking;
    stakingAddress = await staking.getAddress();

    await token.connect(signers.alice).mintFree();
    await token.connect(signers.alice).setOperator(stakingAddress, MAX_OPERATOR_WINDOW);
  });

  async function decryptValue(contractAddress: string, encrypted: string, signer: HardhatEthersSigner) {
    return fhevm.userDecryptEuint(FhevmType.euint64, encrypted, contractAddress, signer);
  }

  it("allows a user to stake encrypted amounts", async function () {
    const stakeValue = 400_000n;
    const encryptedStake = await fhevm
      .createEncryptedInput(stakingAddress, signers.alice.address)
      .add64(stakeValue)
      .encrypt();

    const stakeTx = await staking
      .connect(signers.alice)
      ["stake(bytes32,bytes)"](encryptedStake.handles[0], encryptedStake.inputProof);
    await stakeTx.wait();

    const stakedBalanceEncrypted = await staking.stakedBalanceOf(signers.alice.address);
    const stakedBalance = await decryptValue(stakingAddress, stakedBalanceEncrypted, signers.alice);
    expect(stakedBalance).to.equal(stakeValue);

    const totalStakedEncrypted = await staking.confidentialTotalStaked();
    const totalStaked = await decryptValue(stakingAddress, totalStakedEncrypted, signers.alice);
    expect(totalStaked).to.equal(stakeValue);

    const aliceBalanceEncrypted = await token.confidentialBalanceOf(signers.alice.address);
    const aliceBalance = await decryptValue(tokenAddress, aliceBalanceEncrypted, signers.alice);
    expect(aliceBalance).to.equal(ONE_METH - stakeValue);
  });

  it("allows a user to unstake a portion of their position", async function () {
    const initialStakeValue = 750_000n;
    const encryptedStake = await fhevm
      .createEncryptedInput(stakingAddress, signers.alice.address)
      .add64(initialStakeValue)
      .encrypt();
    await (
      await staking
        .connect(signers.alice)
        ["stake(bytes32,bytes)"](encryptedStake.handles[0], encryptedStake.inputProof)
    ).wait();

    const unstakeValue = 250_000n;
    const encryptedUnstake = await fhevm
      .createEncryptedInput(stakingAddress, signers.alice.address)
      .add64(unstakeValue)
      .encrypt();
    await (
      await staking
        .connect(signers.alice)
        ["unstake(bytes32,bytes)"](encryptedUnstake.handles[0], encryptedUnstake.inputProof)
    ).wait();

    const stakedBalanceEncrypted = await staking.stakedBalanceOf(signers.alice.address);
    const stakedBalance = await decryptValue(stakingAddress, stakedBalanceEncrypted, signers.alice);
    expect(stakedBalance).to.equal(initialStakeValue - unstakeValue);

    const totalStakedEncrypted = await staking.confidentialTotalStaked();
    const totalStaked = await decryptValue(stakingAddress, totalStakedEncrypted, signers.alice);
    expect(totalStaked).to.equal(initialStakeValue - unstakeValue);

    const aliceBalanceEncrypted = await token.confidentialBalanceOf(signers.alice.address);
    const aliceBalance = await decryptValue(tokenAddress, aliceBalanceEncrypted, signers.alice);
    expect(aliceBalance).to.equal(ONE_METH - (initialStakeValue - unstakeValue));
  });

  it("does not change balances when unstaking above stake", async function () {
    const stakeValue = 300_000n;
    const encryptedStake = await fhevm
      .createEncryptedInput(stakingAddress, signers.alice.address)
      .add64(stakeValue)
      .encrypt();
    await (
      await staking
        .connect(signers.alice)
        ["stake(bytes32,bytes)"](encryptedStake.handles[0], encryptedStake.inputProof)
    ).wait();

    const attemptValue = 600_000n;
    const encryptedAttempt = await fhevm
      .createEncryptedInput(stakingAddress, signers.alice.address)
      .add64(attemptValue)
      .encrypt();
    await (
      await staking
        .connect(signers.alice)
        ["unstake(bytes32,bytes)"](encryptedAttempt.handles[0], encryptedAttempt.inputProof)
    ).wait();

    const stakedBalanceEncrypted = await staking.stakedBalanceOf(signers.alice.address);
    const stakedBalance = await decryptValue(stakingAddress, stakedBalanceEncrypted, signers.alice);
    expect(stakedBalance).to.equal(stakeValue);

    const aliceBalanceEncrypted = await token.confidentialBalanceOf(signers.alice.address);
    const aliceBalance = await decryptValue(tokenAddress, aliceBalanceEncrypted, signers.alice);
    expect(aliceBalance).to.equal(ONE_METH - stakeValue);
  });
});
