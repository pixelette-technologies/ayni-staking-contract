const { ethers, upgrades } = require("hardhat");

async function deployAyniStaking() {
    console.log("Fetching signers...");

    const [owner, addr1, addr2, ...others] = await ethers.getSigners();
    console.log("Got signers:", owner.address);

    // Deploy Tokens
    const StakeToken = await ethers.getContractFactory("MockStakeToken");
    const stakeToken = await StakeToken.deploy();
    await stakeToken.waitForDeployment();
    const stakeTokenDeployedAddress = await stakeToken.getAddress();
    console.log("🚀 ~ deployAyniStaking ~ stakeTokenDeployedAddress:", stakeTokenDeployedAddress);

    const RewardToken = await ethers.getContractFactory("MockRewardToken");
    const rewardToken = await RewardToken.deploy();
    await rewardToken.waitForDeployment();
    const rewardTokenDeployedAddress = await rewardToken.getAddress();
    console.log("🚀 ~ deployAyniStaking ~ rewardTokenDeployedAddress:", rewardTokenDeployedAddress);

    // Deploy AyniStaking
    const feeCollector = owner.address
    const AyniStaking = await ethers.getContractFactory("AyniStaking");
    const ayniStaking = await upgrades.deployProxy(AyniStaking, [stakeTokenDeployedAddress, rewardTokenDeployedAddress, feeCollector], {
        initializer: "initialize",
    });
    await ayniStaking.waitForDeployment();
    const ayniStakingDeployedAddress = await ayniStaking.getAddress();
    console.log("🚀 ~ deployAyniStaking ~ ayniStakingDeployedAddress:", ayniStakingDeployedAddress);

    const amountToTransfer = ethers.parseEther("1000");
    await rewardToken.connect(owner).transfer(ayniStakingDeployedAddress, amountToTransfer);
    console.log(`Transferred ${amountToTransfer} rewardtokens to ayniStaling contract at ${ayniStakingDeployedAddress}`);

    return {
        owner,
        addr1,
        addr2,
        stakeToken,
        rewardToken,
        ayniStaking,
        others
    };
}

async function setupUserTokens(token, user, amount) {
    await token.transfer(user.address, ethers.parseEther(amount));
    await token.connect(user).approve(user.address, ethers.parseEther(amount));
}


module.exports = {
    deployAyniStaking,
    setupUserTokens
};
