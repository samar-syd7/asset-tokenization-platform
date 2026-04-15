import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { Contract } from "ethers";

/**
 * Deploys the AssetRegistry contract using the deployer account.
 *
 * @param hre HardhatRuntimeEnvironment object.
 */
const deployAssetRegistry: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  await deploy("AssetRegistry", {
    from: deployer,
    args: [deployer],
    log: true,
    autoMine: true,
  });

  const assetRegistry = await hre.ethers.getContract<Contract>("AssetRegistry", deployer);
  console.log("AssetRegistry deployed to:", assetRegistry.address);
};

export default deployAssetRegistry;

deployAssetRegistry.tags = ["AssetRegistry"];
