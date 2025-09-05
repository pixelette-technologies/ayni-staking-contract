const { ethers } = require("hardhat");
require("dotenv").config();

async function main() {
    console.log("🚀 Starting process...");

    const stakingAddress = "0x6c816f8d60faA82b05D80D4334AbA842D9291c10"; // replace this with the current deployed address
    const provider = new ethers.JsonRpcProvider(process.env.BSC_MAINNET_RPC_URL); //replace this with the current rpc url

    const backendSigner = new ethers.Wallet(process.env.CURREENT_SIGNER, provider); // replace this with verified signer the wallet who will sign the message

    console.log("📌 Backend Signer:", backendSigner.address);
    // console.log("📌 User Signer:", userSigner.address);

    const destinationAddress = "0x07d3bdA43236b6A6C8079d49dd2c8839Ec4a811F"
    const stakeId = "3";
    const intervalId = "3";
    const rewards = ethers.parseEther("20");
    const expiry = "1757112411";

    const userId = "0x4d07e6f81fe058d210566e8d28512a8e2f5719c0dbe47ab0097579b06307a1b4" //make it same the id for the stake if staked against that user exists

    const salt = ethers.keccak256(ethers.toUtf8Bytes("salt-" + Math.random().toString()));
    const nonce = ethers.keccak256(ethers.toUtf8Bytes("nonce-" + Math.random().toString()));
    console.log("🚀 ~ main ~ nonce:", nonce);
    const claimedMonth = "3";
    const domain = {
        name: "AyniStaking",
        version: "1",
        chainId: 56, // change it to the mainnet id 56
        verifyingContract: stakingAddress,
    };

    const types = {
        Claim: [
            { name: "destinationAddress", type: "address" },
            { name: "stakeId", type: "uint256" },
            { name: "intervalId", type: "uint256" },
            { name: "rewards", type: "uint256" },
            { name: "claimedMonth", type: "uint256" },
            { name: "expiry", type: "uint256" },
            { name: "salt", type: "bytes32" },
            { name: "userId", type: "bytes32" },
            { name: "nonce", type: "bytes32" },
        ]
    };

    const claimData = { destinationAddress, stakeId, intervalId, rewards, claimedMonth, expiry, salt, userId, nonce};
    console.log("🚀 ~ main ~ stakeData:", claimData);


    const signature = await backendSigner.signTypedData(domain, types, claimData);
    console.log("✍️ Signature:", signature);

    const recoveredSigner = ethers.verifyTypedData(domain, types, claimData, signature);
    console.log("🔍 Recovered Signer:", recoveredSigner);

    if (recoveredSigner.toLowerCase() !== backendSigner.address.toLowerCase()) {
        throw new Error("❌ Signature verification failed!");
    }

    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["uint256", "uint256", "uint256", "uint256" , "uint256", "bytes32", "bytes32", "bytes32"],
        [stakeId, intervalId, rewards, claimedMonth, expiry, userId, salt, nonce]
    );
    console.log("Encoded Data:", encodedData);

    const decoded = ethers.AbiCoder.defaultAbiCoder().decode(
        ["uint256", "uint256", "uint256", "uint256", "uint256", "bytes32", "bytes32", "bytes32"],
        encodedData
    );

    console.log("Decoded Interval:", decoded[1].toString());
    console.log("Decoded stakeId:", decoded[0].toString());
    console.log("Decoded rewards:", decoded[2].toString());
    console.log("Decoded userid:", decoded[3].toString());
    console.log("Decoded salt:", decoded[4].toString());
    console.log("Decoded salt:", decoded[5].toString());
    console.log("Decoded salt:", decoded[6].toString());
}

main().catch((error) => {
    console.error("🚨 Fatal Error:", error);
    process.exit(1);
});
