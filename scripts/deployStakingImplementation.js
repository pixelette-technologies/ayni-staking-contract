const { ethers } = require("hardhat");

async function main() {
    const AyniStaking = await ethers.getContractFactory("AyniStaking");

    console.log("Deploying AyniStaking implementation (logic)...");
    const implementation = await AyniStaking.deploy();
    await implementation.waitForDeployment();

    const implAddress = await implementation.getAddress();
    console.log(`AyniStaking implementation deployed at: ${implAddress}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});


