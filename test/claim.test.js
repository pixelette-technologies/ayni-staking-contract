const { expect } = require("chai");
const { ethers } = require("hardhat");
const { getSignedVirtualStakeData, getSignedExternalStakeData, getSignedClaimData } = require("./utils/signingUtils");
const { deployAyniStaking, setupUserTokens } = require("./utils/deploy");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("AyniStaking: claim()", () => {
    let ayniStaking, stakeToken, rewardToken, owner, addr1, addr2;
    console.log("🚀 ~ ayniStaking:", ayniStaking);
    const interval = 12;
    const amount = ethers.parseEther("10", 18);
    const feeTokens = ethers.parseEther("1", 18);
    const rewards = ethers.parseEther("10", 18);


    beforeEach(async () => {
        ({ owner, addr1, addr2, rewardToken, stakeToken, ayniStaking } = await deployAyniStaking());
        await setupUserTokens(stakeToken, addr1, "30");
        await rewardToken.transfer(ayniStaking.target, ethers.parseEther("100"));

        await ayniStaking.connect(owner).addSigner(owner.address);
    });

    it("should allow a valid claim of External Stake", async () => {
        const { signature, encodedData, userId, stakeId } = await getSignedExternalStakeData({
            signer: owner,
            user: addr1,
            amount,
            interval,
            ayniStaking,
        });

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount);
        await (ayniStaking.connect(addr1).stakeExternal(encodedData, signature));

        const { claimSignature, claimEncodedData } = await getSignedClaimData({
            signer: owner,
            user: addr1,
            amount,
            interval,
            stakeId,
            rewards,
            prclaimMonth: 12,
            ayniStaking,
            userId
        });

        await expect(ayniStaking.connect(addr1).claim(claimEncodedData, claimSignature))
            .to.emit(ayniStaking, "Claimed")
            .withArgs(
                addr1.address,
                userId,
                stakeId,
                interval,
                12,
                rewards,
                amount
            );
    });

    it("should allow a valid claim of Virtual Stake", async () => {
        const { signature, encodedData, userId, stakeId } = await getSignedVirtualStakeData({
            signer: owner,
            user: addr1,
            amount,
            interval,
            ayniStaking,
            feeTokens
        });

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount + feeTokens);

        await ayniStaking.connect(addr1).stakeVirtual(encodedData, signature);
        const { claimSignature, claimEncodedData } = await getSignedClaimData({
            signer: owner,
            user: addr1,
            amount,
            interval,
            stakeId,
            rewards,
            prclaimMonth: 12,
            ayniStaking,
            userId
        });

        await expect(ayniStaking.connect(addr1).claim(claimEncodedData, claimSignature))
            .to.emit(ayniStaking, "Claimed")
            .withArgs(
                addr1.address,
                userId,
                stakeId,
                interval,
                12,
                rewards,
                amount
            );
    });

    it("should allow a valid preclaim of External Stake", async () => {
        const { signature, encodedData, userId, stakeId } = await getSignedExternalStakeData({
            signer: owner,
            user: addr1,
            amount,
            interval,
            ayniStaking,
        });

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount);
        await ayniStaking.connect(addr1).stakeExternal(encodedData, signature);

        const { claimSignature, claimEncodedData } = await getSignedClaimData({
            signer: owner,
            user: addr1,
            amount,
            interval,
            stakeId,
            rewards,
            prclaimMonth: 6,
            ayniStaking,
            userId
        });

        await expect(ayniStaking.connect(addr1).claim(claimEncodedData, claimSignature))
            .to.emit(ayniStaking, "Claimed")
            .withArgs(
                addr1.address,
                userId,
                stakeId,
                interval,
                6,
                rewards,
                amount
            );

        const userStake = await ayniStaking.stakes(userId, interval, stakeId);
        expect(userStake.isActive).to.equal(true);
        expect(userStake.isClaimed).to.equal(false);
    });

    it("should allow a valid preclaim of Virtual Stake", async () => {
        const { signature, encodedData, userId, stakeId } = await getSignedVirtualStakeData({
            signer: owner,
            user: addr1,
            amount,
            interval,
            ayniStaking,
            feeTokens
        });

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount + feeTokens);
        await ayniStaking.connect(addr1).stakeVirtual(encodedData, signature);

        const { claimSignature, claimEncodedData } = await getSignedClaimData({
            signer: owner,
            user: addr1,
            amount,
            interval,
            stakeId,
            rewards,
            prclaimMonth: 6,
            ayniStaking,
            userId
        });

        await expect(ayniStaking.connect(addr1).claim(claimEncodedData, claimSignature))
            .to.emit(ayniStaking, "Claimed")
            .withArgs(
                addr1.address,
                userId,
                stakeId,
                interval,
                6,
                rewards,
                amount
            );

        const userStake = await ayniStaking.stakes(userId, interval, stakeId);
        expect(userStake.isActive).to.equal(true);
        expect(userStake.isClaimed).to.equal(false);
    });
});
