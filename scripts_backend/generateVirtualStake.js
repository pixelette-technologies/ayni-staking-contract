const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 Starting process...");

    const stakingAddress = "0x712b09317761fa07B69033D978D3A41F0ef72d70"; // replace this with the current deployed address
    const provider = new ethers.JsonRpcProvider("process.env.BSC_MAINNET_RPC_URL"); //replace this with the current rpc url

    const backendSigner = new ethers.Wallet(process.env.CURRENT_SIGNER, provider); // replace this with verified signer the wallet who will sign the message

    console.log("📌 Backend Signer:", backendSigner.address);
    // console.log("📌 User Signer:", userSigner.address);

    const amount = ethers.parseEther("9"); // 10 Tokens
    const feeTokens = ethers.parseEther("1"); // 0.1 Tokens
    const sourceAddress = "0x07d3bdA43236b6A6C8079d49dd2c8839Ec4a811F"
    const stakeId = "1";
    const interval = "1";

    const userId = ethers.keccak256(ethers.toUtf8Bytes(0x07d3bdA43236b6A6C8079d49dd2c8839Ec811F + Math.random().toString()));
    const salt = ethers.keccak256(ethers.toUtf8Bytes("salt-" + Math.random().toString()));
    const endTime = "1757113467";
    const expiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    const domain = {
        name: "AyniStaking",
        version: "1",
        chainId: 56, // change it to the mainnet id 56
        verifyingContract: stakingAddress,
    };

    const types = {
        StakeVirtual: [
            { name: "sourceAddress", type: "address" },
            { name: "stakeId", type: "uint256" },
            { name: "interval", type: "uint256" },
            { name: "endTime", type: "uint256" },
            { name: "amount", type: "uint256" },
            { name: "feeTokens", type: "uint256" },
            { name: "expiry", type: "uint256" },
            { name: "userId", type: "bytes32" },
            { name: "salt", type: "bytes32" },
        ]
    };

    const stakeData = { sourceAddress, stakeId, interval, endTime, amount, feeTokens, expiry, userId, salt };
    console.log("🚀 ~ main ~ stakeData:", stakeData);


    const signature = await backendSigner.signTypedData(domain, types, stakeData);
    console.log("✍️ Signature:", signature);

    const recoveredSigner = ethers.verifyTypedData(domain, types, stakeData, signature);
    console.log("🔍 Recovered Signer:", recoveredSigner);

    if (recoveredSigner.toLowerCase() !== backendSigner.address.toLowerCase()) {
        throw new Error("❌ Signature verification failed!");
    }

    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "bytes32", "bytes32"],
        [sourceAddress, stakeId, interval, endTime, amount, feeTokens, expiry, userId, salt]
    )
    console.log("Encoded Data:", encodedData);

    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "bytes32", "bytes32"],
        encodedData
    );

    console.log("Decoded Interval:", decoded[1].toString());
    console.log("Decoded amount:", decoded[0].toString());
    console.log("Decoded id:", decoded[2].toString());
    console.log("Decoded status:", decoded[3].toString());
    console.log("Decoded salt:", decoded[4].toString());
}

main().catch((error) => {
    console.error("🚨 Fatal Error:", error);
    process.exit(1);
});
