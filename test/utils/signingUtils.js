const { ethers } = require("hardhat");

const DOMAIN = (contract, chainId) => {
    if (!ethers.isAddress(contract)) {
        throw new Error("Invalid address passed to DOMAIN");
    }
    return {
        name: "AyniStaking",
        version: "1",
        chainId,
        verifyingContract: contract,
    };
};

const getParams = async () => {
    const userId = ethers.keccak256(ethers.toUtf8Bytes(Date.now().toString() + Math.random().toString()));
    const salt = ethers.keccak256(ethers.toUtf8Bytes("salt-" + Math.random().toString()));
    const expiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    return { userId, salt, expiry };
}

const STAKE_EXTERNAL_TYPE = [
    { name: "destinationAddress", type: "address" },
    { name: "sourceAddress", type: "address" },
    { name: "stakeId", type: "uint256" },
    { name: "interval", type: "uint256" },
    { name: "endTime", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "userId", type: "bytes32" },
    { name: "salt", type: "bytes32" },
];

const STAKE_VIRTUAL_TYPE = [
    { name: "sourceAddress", type: "address" },
    { name: "stakeId", type: "uint256" },
    { name: "interval", type: "uint256" },
    { name: "endTime", type: "uint256" },
    { name: "amount", type: "uint256" },
    { name: "feeTokens", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "userId", type: "bytes32" },
    { name: "salt", type: "bytes32" },
];

const CLAIM_TYPE = [
    { name: "destinationAddress", type: "address" },
    { name: "stakeId", type: "uint256" },
    { name: "interval", type: "uint256" },
    { name: "rewards", type: "uint256" },
    { name: "claimedMonth", type: "uint256" },
    { name: "expiry", type: "uint256" },
    { name: "salt", type: "bytes32" },
    { name: "userId", type: "bytes32" },
    { name: "nonce", type: "bytes32" },
];

async function getSignedExternalStakeData({
    signer,
    user,
    amount,
    interval,
    ayniStaking,
    invalidSalt = false,
}) {
    let salt;
    const stakingContractAddress = await ayniStaking.getAddress();
    const provider = ethers.provider; // Access Hardhat's provider
    const chainId = (await provider.getNetwork()).chainId;
    const domain = DOMAIN(stakingContractAddress, chainId);
    const userId = ethers.keccak256(ethers.toUtf8Bytes(Date.now().toString() + Math.random().toString()));
    invalidSalt ? salt = 0 : salt = ethers.keccak256(ethers.toUtf8Bytes("salt-" + Math.random().toString()));
    const stakeId = 54; //random
    const endTime = Math.floor(Date.now() / 1000) + 12 * 60;
    const expiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    const data = {
        destinationAddress: user.address,
        sourceAddress: user.address,
        stakeId,
        interval,
        endTime,
        amount,
        expiry,
        userId,
        salt
    };

    const signature = await signer.signTypedData(domain, { StakeExternal: STAKE_EXTERNAL_TYPE }, data);
    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "bytes32", "bytes32"],
        [user.address, stakeId, endTime, interval, amount, expiry, userId, salt]
    );

    return {
        signature,
        encodedData,
        userId,
        stakeId,
        salt
    };
}

async function getSignedVirtualStakeData({
    signer,
    user,
    amount,
    interval,
    ayniStaking,
    feeTokens,
    invalidSalt = false,
    invalidExpiry = false,
    saltUsed = null
}) {
    console.log("🚀 ~ getSignedVirtualStakeData ~ signer:", signer);
    let salt;
    let expiry;
    let sourceAddress = user.address;
    const stakingContractAddress = await ayniStaking.getAddress();
    const provider = ethers.provider;
    const chainId = (await provider.getNetwork()).chainId;
    const domain = DOMAIN(stakingContractAddress, chainId);
    const userId = ethers.keccak256(ethers.toUtf8Bytes(Date.now().toString() + Math.random().toString()));

    if (saltUsed) {
        salt = saltUsed;
    } else if (invalidSalt) {
        salt = 0;
    } else {
        salt = ethers.keccak256(
            ethers.toUtf8Bytes("salt-" + Math.random().toString())
        );
    }

    const stakeId = 555;
    const endTime = Math.floor(Date.now() / 1000) + 12 * 60;
    invalidExpiry ? expiry = 1 : expiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60;

    const data = {
        sourceAddress,
        stakeId,
        interval,
        endTime,
        amount,
        feeTokens,
        expiry,
        userId,
        salt
    };
    console.log("🚀 ~ getSignedVirtualStakeData ~ data:", data);


    const signature = await signer.signTypedData(domain, { StakeVirtual: STAKE_VIRTUAL_TYPE }, data);
    const encodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "uint256", "bytes32", "bytes32"],
        [sourceAddress, stakeId, interval, endTime, amount, feeTokens, expiry, userId, salt]);

    return {
        signature,
        encodedData,
        userId,
        stakeId,
        salt
    };
}

async function getSignedClaimData({
    signer,
    user,
    interval,
    stakeId,
    rewards,
    prclaimMonth,
    ayniStaking,
    userId,
    invalidSalt = false,
    invalidExpiry = false,
    saltUsed = null
}) {
    let salt;
    let expiry;
    let sourceAddress = user.address;
    const stakingContractAddress = await ayniStaking.getAddress();
    const provider = ethers.provider;
    const chainId = (await provider.getNetwork()).chainId;
    const domain = DOMAIN(stakingContractAddress, chainId);
    invalidExpiry ? expiry = 1 : expiry = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
    if (saltUsed) {
        salt = saltUsed;
    } else if (invalidSalt) {
        salt = 0;
    } else {
        salt = ethers.keccak256(
            ethers.toUtf8Bytes("salt-" + Math.random().toString())
        );
    }

    const nonce = ethers.keccak256(
        ethers.toUtf8Bytes("salt-" + Math.random().toString())
    );

    const data = {
        destinationAddress: sourceAddress,
        stakeId,
        interval,
        rewards,
        claimedMonth: prclaimMonth,
        expiry,
        salt,
        userId,
        nonce
    };

    const claimSignature = await signer.signTypedData(domain, { Claim: CLAIM_TYPE }, data);

    const claimEncodedData = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "uint256", "uint256", "uint256", "uint256", "bytes32", "bytes32", "bytes32"],
        [sourceAddress, stakeId, interval, rewards, prclaimMonth, expiry, userId, salt, nonce]
    );

    return {
        claimSignature,
        claimEncodedData,
        salt
    };
}


module.exports = {
    getSignedExternalStakeData,
    getSignedVirtualStakeData,
    getSignedClaimData
};
