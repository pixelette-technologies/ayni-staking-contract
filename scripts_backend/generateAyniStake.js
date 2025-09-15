const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 Starting process...");

    const stakingAddress = "0x867267c3095b885A95b3Dba5BA18a1566D3994bb"; // replace this with the current deployed address
    const provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC_URL); //replace this with the current rpc url

    const backendSigner = new ethers.Wallet(process.env.CURRENT_SIGNER, provider); // replace this with verified signer the wallet who will sign the message
    // const userSigner = new ethers.Wallet(process.env.USER_KEY, provider); // User wallet address in case directly intercating through the script

    console.log("📌 Backend Signer:", backendSigner.address);
    // console.log("📌 User Signer:", userSigner.address);

    const amount = ethers.parseEther("10"); // 10 Tokens
    const destinationAddress = "0x07d3bdA43236b6A6C8079d49dd2c8839Ec4a811F"
    const sourceAddress = "0x07d3bdA43236b6A6C8079d49dd2c8839Ec4a811F"

    let currentStakeId = 1;
    let currentIntervalId = 12;
    const expiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60;


    function getNextStakeId() {
        currentStakeId += 3;
        return currentStakeId.toString();
    }

    function getNextIntervalId() {
        currentIntervalId += 0;
        return currentIntervalId.toString();
    }
    const stakeId = getNextStakeId();
    console.log("🚀 ~ main ~ stakeId:", stakeId);
    const interval= getNextIntervalId();
    console.log("🚀 ~ main ~ intervalId:", interval);

    const userId = ethers.keccak256(ethers.toUtf8Bytes(0x07d3bdA43236b6A6C8079d49dd2c8839Ec4a811F + Math.random().toString()));
    const salt = ethers.keccak256(ethers.toUtf8Bytes("salt-" + Math.random().toString()));
    let endTime = Math.floor(Date.now() / 1000) + 12 * 60;
    console.log(endTime);

    const domain = {
        name: "AyniStaking",
        version: "1",
        chainId: 56, // change it to the mainnet id 56
        verifyingContract: stakingAddress,
    };

    const types = {
        StakeExternal: [
            { name: "destinationAddress", type: "address" },
            { name: "sourceAddress", type: "address" },
            { name: "stakeId", type: "uint256" },
            { name: "interval", type: "uint256" },
            { name: "endTime", type: "uint256" },
            { name: "amount", type: "uint256" },
            { name: "expiry", type: "uint256" },
            { name: "userId", type: "bytes32" },
            { name: "salt", type: "bytes32" },
        ]
    };

    const stakeData = { destinationAddress, sourceAddress, stakeId, interval, endTime, amount, expiry, userId, salt };
    console.log("🚀 ~ main ~ stakeData:", stakeData);


    const signature = await backendSigner.signTypedData(domain, types, stakeData);
    console.log("✍️ Signature:", signature);

    const recoveredSigner = ethers.verifyTypedData(domain, types, stakeData, signature);
    console.log("🔍 Recovered Signer:", recoveredSigner);

    if (recoveredSigner.toLowerCase() !== backendSigner.address.toLowerCase()) {
        throw new Error("❌ Signature verification failed!");
    }

    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "bytes32", "bytes32"],
        [destinationAddress, stakeId, endTime, interval, amount, expiry, userId, salt]
    );

    console.log("Encoded Data:", encodedData);

    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "bytes32", "bytes32"],
        encodedData
    );
    console.log("Decoded stakeid:", decoded[1].toString());
    console.log("Decoded destinationAddress:", decoded[0].toString());
    console.log("Decoded endtime:", decoded[2].toString());
    console.log("Decoded interval:", decoded[3].toString());
    console.log("Decoded amount:", decoded[4].toString());
    console.log("Decoded userid:", decoded[5].toString());
}

main().catch((error) => {
    console.error("🚨 Fatal Error:", error);
    process.exit(1);
});
