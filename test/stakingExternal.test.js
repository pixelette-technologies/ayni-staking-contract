const { expect } = require("chai");
const { ethers } = require("hardhat");
const { getSignedExternalStakeData } = require("./utils/signingUtils");
const { deployAyniStaking, setupUserTokens } = require("./utils/deploy");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("AyniStaking: staking external()", () => {
    let ayniStaking, stakeToken, rewardToken, owner, addr1, addr2;
    console.log("🚀 ~ ayniStaking:", ayniStaking);
    const interval = 12;
    const amount = ethers.parseEther("10", 18);

    beforeEach(async () => {
        ({ owner, addr1, addr2, rewardToken, stakeToken, ayniStaking } = await deployAyniStaking());
        await setupUserTokens(stakeToken, addr1, "10");

        // Add signer
        await ayniStaking.connect(owner).addSigner(owner.address);
    });

    it("should allow a valid external stakee", async () => {
        const { signature, encodedData, userId, stakeId } = await getSignedExternalStakeData({
            signer: owner,
            user: addr1,
            amount,
            interval,
            ayniStaking,
        });

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount);

        await expect(ayniStaking.connect(addr1).stakeExternal(encodedData, signature))
            .to.emit(ayniStaking, "Staked")
            .withArgs(addr1.address, addr1.address, userId, stakeId, interval, amount);
    });

    it("should revert on zero amount", async () => {
        const { signature, encodedData } = await getSignedExternalStakeData({
            signer: owner,
            user: addr1,
            amount: 0,
            interval,
            ayniStaking,
        });

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount);

        await expect(ayniStaking.connect(addr1).stakeExternal(encodedData, signature)).to.be.revertedWithCustomError(ayniStaking, "InvalidInput");
    });

    it("should revert on zero interval", async () => {
        const { signature, encodedData } = await getSignedExternalStakeData({
            signer: owner,
            user: addr1,
            amount,
            interval: 0,
            ayniStaking,
        });

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount);

        await expect(ayniStaking.connect(addr1).stakeExternal(encodedData, signature)).to.be.revertedWithCustomError(ayniStaking, "InvalidInput");
    });


    it("should revert on zero salt", async () => {
        const { signature, encodedData } = await getSignedExternalStakeData({
            signer: owner,
            user: addr1,
            amount,
            interval: 0,
            ayniStaking,
            inValidSalt: true,
        });

        await expect(ayniStaking.connect(addr1).stakeExternal(encodedData, signature)).to.be.revertedWithCustomError(ayniStaking, "InvalidInput");
    });


    it("should revert if user's balance is too low", async () => {
        await stakeToken.connect(addr1).transfer(addr2, amount);

        const { signature, encodedData } = await getSignedExternalStakeData({
            signer: owner,
            user: addr1,
            amount,
            interval,
            ayniStaking,
        });

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount);

        await expect(
            ayniStaking.connect(addr1).stakeExternal(encodedData, signature)
        ).to.be.revertedWithCustomError(stakeToken, "ERC20InsufficientBalance");
    });

    it("should revert on invalid signature", async () => {
        const fakeSigner = addr1;

        const { signature, encodedData } = await getSignedExternalStakeData({
            signer: fakeSigner,
            user: addr1,
            amount,
            interval,
            ayniStaking,
        });

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount);

        await expect(ayniStaking.connect(addr1).stakeExternal(encodedData, signature)).to.be.revertedWithCustomError(ayniStaking, "InvalidSigner");
    });

    it("should revert if contract is paused", async () => {
        await ayniStaking.pauseStaking();

        const { signature, encodedData } = await getSignedExternalStakeData({
            signer: owner,
            user: addr1,
            amount,
            interval,
            ayniStaking,
        });

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount);

        await expect(ayniStaking.connect(addr1).stakeExternal(encodedData, signature)).to.be.revertedWithCustomError(ayniStaking, "EnforcedPause");
    });
});
