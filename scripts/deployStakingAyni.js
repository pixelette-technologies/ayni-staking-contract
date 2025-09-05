const hre = require("hardhat");

async function main() {
    const StakeToken = "0xbF26e0f051cf1AB4FCE7260988AEe922a7152e38";
    const RewardToken = "0x506FE0dE2CcBC433259136d8250a7D719504cE4F";
    const feeCollector = "0x7696AB9A965E6bC782a96D38D915eC4f534c3F67";
    const stakingAyni = await hre.ethers.getContractFactory("contracts/AyniStaking.sol:AyniStaking");
    console.log("Deployment started");
    const StakingAyni = await upgrades.deployProxy(stakingAyni, [StakeToken, RewardToken, feeCollector ], {
        initializer: "initialize",
    });
    await StakingAyni.waitForDeployment();
    const deployedAddress = await StakingAyni.getAddress();
    console.log("Staking contract contract deployed to", deployedAddress);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});