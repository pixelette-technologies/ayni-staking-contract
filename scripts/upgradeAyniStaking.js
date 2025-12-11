const { ethers, upgrades } = require("hardhat");
require("dotenv").config();

async function main() {
    const proxyAddress = "0xYourAyniStakingProxyAddress";

    const [deployer] = await ethers.getSigners();
    console.log(`Upgrading AyniStaking proxy ${proxyAddress}`);
    console.log(`Using deployer: ${deployer.address}`);

    const AyniStaking = await ethers.getContractFactory("AyniStaking");

    const upgraded = await upgrades.upgradeProxy(proxyAddress, AyniStaking, {
        kind: "uups",
    });
    await upgraded.waitForDeployment();

    const newImpl = await upgrades.erc1967.getImplementationAddress(
        proxyAddress
    );

    console.log(`Proxy (unchanged): ${await upgraded.getAddress()}`);
    console.log(`New implementation: ${newImpl}`);
    console.log("Upgrade complete.");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
