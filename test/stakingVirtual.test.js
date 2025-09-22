const { expect } = require("chai");
const { ethers } = require("hardhat");
const { getSignedVirtualStakeData } = require("./utils/signingUtils");
const { deployAyniStaking, setupUserTokens } = require("./utils/deploy");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");

describe("AyniStaking: staking Virtual()", () => {
    let ayniStaking, stakeToken, rewardToken, owner, addr1, addr2;
    console.log("🚀 ~ ayniStaking:", ayniStaking);
    const interval = 12;
    const amount = ethers.parseEther("10", 18);
    const feeTokens = ethers.parseEther("1", 18);

    beforeEach(async () => {
        ({ owner, addr1, addr2, rewardToken, stakeToken, ayniStaking } = await deployAyniStaking());
        await setupUserTokens(stakeToken, addr1, "30");

        // Add signer
        await ayniStaking.connect(owner).addSigner(owner.address);
    });

    it("should allow a valid virtual stakee", async () => {
        const { signature, encodedData, userId, stakeId } = await getSignedVirtualStakeData({
            signer: owner,
            user: addr1,
            amount,
            interval,
            ayniStaking,
            feeTokens
        });

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount + feeTokens);

        await expect(ayniStaking.connect(addr1).stakeVirtual(encodedData, signature))
            .to.emit(ayniStaking, "Staked")
            .withArgs(addr1.address, addr1.address, userId, stakeId, interval, amount);
    });

    it("should revert if amount is zero", async () => {
        const { signature, encodedData } =
            await getSignedVirtualStakeData({
                signer: owner,
                user: addr1,
                amount: 0,
                interval,
                ayniStaking,
                feeTokens
            });

        await expect(ayniStaking.connect(addr1).stakeVirtual(encodedData, signature))
            .to.be.revertedWithCustomError(ayniStaking, "InvalidInput");
    });

    it("should revert if feeTokens is zero", async () => {
        const { signature, encodedData } =
            await getSignedVirtualStakeData({
                signer: owner,
                user: addr1,
                amount,
                interval,
                ayniStaking,
                feeTokens: 0
            });

        await expect(ayniStaking.connect(addr1).stakeVirtual(encodedData, signature))
            .to.be.revertedWithCustomError(ayniStaking, "InvalidInput");
    });

    it("should revert if signature is expired", async () => {
        const { signature, encodedData } =
            await getSignedVirtualStakeData({
                signer: owner,
                user: addr1,
                amount,
                interval,
                ayniStaking,
                feeTokens,
                invalidExpiry: true
            });

        await expect(ayniStaking.connect(addr1).stakeVirtual(encodedData, signature))
            .to.be.revertedWithCustomError(ayniStaking, "SignatureExpired");
    });

    it("should revert if signer is not authorized", async () => {
        const fakeSigner = addr1; // fake signer

        const { signature, encodedData } =
            await getSignedVirtualStakeData({
                signer: fakeSigner,
                user: addr1,
                amount,
                interval,
                ayniStaking,
                feeTokens
            });

        await expect(ayniStaking.connect(addr1).stakeVirtual(encodedData, signature))
            .to.be.revertedWithCustomError(ayniStaking, "InvalidSigner");
    });

    it("should revert if salt is reused", async () => {
        const { signature, encodedData, salt } =
            await getSignedVirtualStakeData({
                signer: owner,
                user: addr1,
                amount,
                interval,
                ayniStaking,
                feeTokens,
            });
        console.log("🚀 ~ salt:", salt);
        const usedS = salt;

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount + feeTokens);
        await ayniStaking.connect(addr1).stakeVirtual(encodedData, signature);

        const { signature: signature2, encodedData: encodedData2 } =
            await getSignedVirtualStakeData({
                signer: owner,
                user: addr1,
                amount,
                interval,
                ayniStaking,
                feeTokens,
                saltUsed: usedS
            });

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount + feeTokens);
        await expect(ayniStaking.connect(addr1).stakeVirtual(encodedData2, signature2))
            .to.be.revertedWithCustomError(ayniStaking, "SaltAlreadyUsed");
    });

    it("should transfer stake amount and fee correctly", async () => {
        const { signature, encodedData } =
            await getSignedVirtualStakeData({
                signer: owner,
                user: addr1,
                amount,
                interval,
                ayniStaking,
                feeTokens
            });

        const beforeUser = await stakeToken.balanceOf(addr1.address);
        const beforeContract = await stakeToken.balanceOf(ayniStaking.target);

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount + feeTokens);
        await ayniStaking.connect(addr1).stakeVirtual(encodedData, signature);

        const afterUser = await stakeToken.balanceOf(addr1.address);
        const afterContract = await stakeToken.balanceOf(ayniStaking.target);

        expect(beforeUser - afterUser).to.equal(amount + feeTokens);
        expect(afterContract - beforeContract).to.equal(amount);
    });

    it("should revert when staking is paused", async () => {
        const { signature, encodedData } =
            await getSignedVirtualStakeData({
                signer: owner,
                user: addr1,
                amount,
                interval,
                ayniStaking,
                feeTokens
            });

        await ayniStaking.connect(owner).pauseStaking();

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount + feeTokens);

        await expect(ayniStaking.connect(addr1).stakeVirtual(encodedData, signature))
            .to.be.revertedWithCustomError(ayniStaking, "EnforcedPause");
    });

    it("should allow staking after unpausing", async () => {
        const { signature, encodedData, userId, stakeId } =
            await getSignedVirtualStakeData({
                signer: owner,
                user: addr1,
                amount,
                interval,
                ayniStaking,
                feeTokens
            });

        await ayniStaking.connect(owner).pauseStaking();
        await ayniStaking.connect(owner).unpauseStaking();

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount + feeTokens);

        await expect(ayniStaking.connect(addr1).stakeVirtual(encodedData, signature))
            .to.emit(ayniStaking, "Staked")
            .withArgs(addr1.address, addr1.address, userId, stakeId, interval, amount);
    });
});
