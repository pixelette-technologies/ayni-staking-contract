const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
    getSignedExternalStakeData,
    getSignedClaimData,
} = require("./utils/signingUtils");
const { deployAyniStaking, setupUserTokens } = require("./utils/deploy");

describe("AyniStaking: admin actions", () => {
    let ayniStaking, stakeToken, rewardToken, owner, addr1, addr2;
    const interval = 12;
    const amount = ethers.parseEther("10");

    beforeEach(async () => {
        ({ owner, addr1, addr2, rewardToken, stakeToken, ayniStaking } =
            await deployAyniStaking());

        await setupUserTokens(stakeToken, addr1, "10");
        await ayniStaking.connect(owner).addSigner(owner.address);
    });

    async function stakeForAddr1() {
        const { signature, encodedData, userId, stakeId } =
            await getSignedExternalStakeData({
                signer: owner,
                user: addr1,
                amount,
                interval,
                ayniStaking,
            });

        await stakeToken.connect(addr1).approve(ayniStaking.target, amount);
        await ayniStaking.connect(addr1).stakeExternal(encodedData, signature);

        return { userId, stakeId };
    }

    it("forceRemoveStake should return principal and block further claims", async () => {
        const { userId, stakeId } = await stakeForAddr1();

        const balanceBeforeRemoval = await stakeToken.balanceOf(addr1.address);
        expect(balanceBeforeRemoval).to.equal(0n);

        await expect(
            ayniStaking.forceRemoveStake(userId, interval, stakeId)
        )
            .to.emit(ayniStaking, "StakeRemoved")
            .withArgs(userId, stakeId, interval, addr1.address, amount);

        const balanceAfterRemoval = await stakeToken.balanceOf(addr1.address);
        expect(balanceAfterRemoval).to.equal(amount);

        const stakeData = await ayniStaking.stakes(userId, interval, stakeId);
        expect(stakeData.isActive).to.equal(false);
        expect(stakeData.isClaimed).to.equal(true);
        expect(stakeData.claimedUntilMonth).to.equal(interval);

        const rewardAmount = ethers.parseEther("1");
        const { claimSignature, claimEncodedData } = await getSignedClaimData({
            signer: owner,
            user: addr1,
            interval,
            stakeId,
            rewards: rewardAmount,
            prclaimMonth: interval,
            ayniStaking,
            userId,
        });

        await expect(
            ayniStaking.connect(addr1).claim(claimEncodedData, claimSignature)
        ).to.be.revertedWithCustomError(ayniStaking, "AlreadyClaimed");
    });

    it("updateStakeWallet should move principal recipient while keeping claim wallet", async () => {
        const { userId, stakeId } = await stakeForAddr1();

        await expect(
            ayniStaking.updateStakeWallet(
                userId,
                interval,
                stakeId,
                addr1.address,
                addr2.address
            )
        )
            .to.emit(ayniStaking, "StakeWalletUpdated")
            .withArgs(userId, stakeId, interval, addr1.address, addr2.address);

        const stakeData = await ayniStaking.stakes(userId, interval, stakeId);
        expect(stakeData.staker).to.equal(addr2.address);
        expect(stakeData.claimAddress).to.equal(addr1.address);

        const rewardAmount = ethers.parseEther("2");
        const { claimSignature, claimEncodedData } = await getSignedClaimData({
            signer: owner,
            user: addr1,
            interval,
            stakeId,
            rewards: rewardAmount,
            prclaimMonth: interval,
            ayniStaking,
            userId,
        });

        const endTime = Number(stakeData.endTime);
        await ethers.provider.send("evm_setNextBlockTimestamp", [endTime + 1]);
        await ethers.provider.send("evm_mine");

        const principalBefore = await stakeToken.balanceOf(addr2.address);
        const rewardsBefore = await rewardToken.balanceOf(addr1.address);

        await expect(
            ayniStaking.connect(addr1).claim(claimEncodedData, claimSignature)
        )
            .to.emit(ayniStaking, "Claimed")
            .withArgs(
                addr1.address,
                userId,
                stakeId,
                interval,
                interval,
                rewardAmount,
                amount
            );

        const principalAfter = await stakeToken.balanceOf(addr2.address);
        const rewardsAfter = await rewardToken.balanceOf(addr1.address);

        expect(principalAfter - principalBefore).to.equal(amount);
        expect(rewardsAfter - rewardsBefore).to.equal(rewardAmount);
    });
});


