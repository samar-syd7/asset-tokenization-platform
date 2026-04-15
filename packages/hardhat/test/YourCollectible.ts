//
// This script executes when you run 'yarn test'
//

import { ethers } from "hardhat";
import { expect } from "chai";
import { AssetRegistry } from "../typechain-types/contracts/YourCollectible.sol";

describe("Asset Registry", function () {
  let myContract: AssetRegistry;

  describe("AssetRegistry", function () {
    const contractAddress = process.env.CONTRACT_ADDRESS;

    let contractArtifact: string;
    if (contractAddress) {
      // For the autograder
      contractArtifact = `contracts/download-${contractAddress}.sol:AssetRegistry`;
    } else {
      contractArtifact = "contracts/YourCollectible.sol:AssetRegistry";
    }

    it("Should deploy the contract", async function () {
      const AssetRegistry = await ethers.getContractFactory(contractArtifact);
      myContract = await AssetRegistry.deploy();
      console.log("\t", " 🛰  Contract deployed on", await myContract.getAddress());
    });

    describe("mintAsset()", function () {
      it("Should be able to mint an asset", async function () {
        const [owner] = await ethers.getSigners();

        const startingBalance = await myContract.balanceOf(owner.address);
        const mintResult = await myContract.mintAsset(owner.address, "Asset #1", "Real Estate", 1000n, "");

        const txResult = await mintResult.wait();
        expect(txResult?.status).to.equal(1);
        expect(await myContract.balanceOf(owner.address)).to.equal(startingBalance + 1n);
      });

      it("Should track tokens of owner by index", async function () {
        const [owner] = await ethers.getSigners();
        const startingBalance = await myContract.balanceOf(owner.address);
        const token = await myContract.tokenOfOwnerByIndex(owner.address, startingBalance - 1n);
        expect(token).to.greaterThan(0);
      });
    });
  });
});
