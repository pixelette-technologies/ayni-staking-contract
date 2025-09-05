const hre = require("hardhat");

async function main() {
    const mockToken =  await hre.ethers.getContractFactory("contracts/MockStakeToken.sol:MockStakeToken");
    const rewardToken =  await hre.ethers.getContractFactory("contracts/MockRewardToken.sol:MockRewardToken");

    console.log("Deployment started");
    const MockToken =  await mockToken.deploy();
    const RewardToken =  await rewardToken.deploy();

    console.log("Deployment in progress");
    await MockToken.waitForDeployment();
    await RewardToken.waitForDeployment();

    const deployedAddressStake = await MockToken.getAddress();
    console.log("🚀 ~ main ~ deployedAddressStake:", deployedAddressStake);
    const deployedAddressReward = await RewardToken.getAddress();
    console.log("🚀 ~ main ~ deployedAddressReward:", deployedAddressReward);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});