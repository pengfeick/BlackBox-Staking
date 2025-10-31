import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const methToken = await deploy("ERC7984ETH", {
    from: deployer,
    log: true,
  });

  const staking = await deploy("METHStaking", {
    from: deployer,
    args: [methToken.address],
    log: true,
  });

  console.log(`ERC7984ETH contract deployed at ${methToken.address}`);
  console.log(`METHStaking contract deployed at ${staking.address}`);
};
export default func;
func.id = "deploy_meth";
func.tags = ["METH", "STAKING"];
