const { expect } = require("chai");
const { ethers } = require("hardhat");

const {
    defaultAbiCoder: abiCoder,
    arrayify,
    keccak256,
} = ethers.utils;

describe("Bridge", function () {  
    let wZNN, bridge;
    let wZNNOwner, bridgeOwner;
    let user1, user2;

    beforeEach(async function () {
        let wZNNFactory = await ethers.getContractFactory("BEP20Token");
        let bridgeFactory = await ethers.getContractFactory("Bridge");
        [wZNNOwner, bridgeOwner, user1, user2] = await ethers.getSigners();

        wZNN = await wZNNFactory.connect(wZNNOwner).deploy();
        bridge = await bridgeFactory.connect(bridgeOwner).deploy(wZNN.address);

        let znnAmount = ethers.utils.parseUnits("10000", 8);

        await wZNN.connect(wZNNOwner).transfer(bridge.address, znnAmount);
        expect(await wZNN.balanceOf(bridge.address)).to.equal(znnAmount);

        await wZNN.connect(wZNNOwner).transfer(user1.address, znnAmount);
        expect(await wZNN.balanceOf(user1.address)).to.equal(znnAmount);

        await wZNN.connect(wZNNOwner).transfer(user2.address, znnAmount);
        expect(await wZNN.balanceOf(user2.address)).to.equal(znnAmount);
    });

    describe("Transactions", function () {
        it("All should revert", async function () {
            const testAmount = ethers.utils.parseUnits("10", 8);

            // Attempt to call transferFrom without an allowance
            await expect(wZNN.connect(user1).transferFrom(user2.address, user1.address, testAmount))
                .to.be.revertedWith("BEP20: transfer amount exceeds allowance");
            
            // Attempt to redeem an amount higher than the bridge's wZNN balance
            const bridgeBalance = await wZNN.balanceOf(bridge.address);
            const redeemAmount = bridgeBalance.add(testAmount);

            let networkData = await ethers.provider.getNetwork();
            const chainId = networkData.chainId;
            const nonce = 1;
            const message = abiCoder.encode(
                ["address", "uint256", "uint256", "uint256"],
                [user1.address, redeemAmount, nonce, chainId]
            );
            const messageHash = keccak256(message);
            const signature = await bridgeOwner.signMessage(arrayify(messageHash));

            await expect(bridge.connect(user1).redeem(user1.address, redeemAmount, nonce, signature))
                .to.be.revertedWith("BEP20: transfer amount exceeds balance");
        });
    });


    describe("Bridge", function () {
        it("Perform multiple checks", async function () {
            let redeemAmount = ethers.utils.parseUnits("10", 8);

            let networkData = await ethers.provider.getNetwork();
            let chainId = networkData.chainId;
            let nonce = 1;

            let message = abiCoder.encode(
                ["address", "uint256", "uint256", "uint256"],
                [user1.address, redeemAmount, nonce, chainId]
            );
            let messageHash = keccak256(message);
            const signature = await bridgeOwner.signMessage(arrayify(messageHash));
            
            let user1Balance = await wZNN.balanceOf(user1.address);
            await bridge.connect(user1).redeem(user1.address, redeemAmount, nonce, signature);
            expect(await wZNN.balanceOf(user1.address)).to.equal(user1Balance.add(redeemAmount));

            await expect(bridge.connect(user1).redeem(user1.address, redeemAmount, nonce, signature))
                .to.be.revertedWith("redeem: Nonce already used");

            // Attempt to redeem using an altered message parameter
            nonce = 2;
            message = abiCoder.encode(
                ["address", "uint256", "uint256", "uint256"],
                [user1.address, redeemAmount, nonce, chainId]
            );
            messageHash = keccak256(message);
            const newSignature = await bridgeOwner.signMessage(arrayify(messageHash));
            
            // Attempt to redeem using an altered nonce parameter
            nonce = 3;
            await expect(bridge.connect(user1).redeem(user1.address, redeemAmount, nonce, newSignature))
                .to.be.revertedWith("redeem: Wrong signature");
            nonce = 2;

            // Attempt to redeem using an altered address parameter
            await expect(bridge.connect(user1).redeem(user2.address, redeemAmount, nonce, newSignature))
                .to.be.revertedWith("redeem: Wrong signature");
            
            // Attempt to redeem using an altered amount parameter
            await expect(bridge.connect(user1).redeem(user1.address, redeemAmount.add(redeemAmount), nonce, newSignature))
                .to.be.revertedWith("redeem: Wrong signature");

            // Attempt to redeem using a lower amount
            await expect(bridge.connect(user1).redeem(user1.address, redeemAmount.div(2), nonce, newSignature))
                .to.be.revertedWith("redeem: Wrong signature");

            // Attempt to redeem using an altered signature
            nonce = 2;
            await expect(bridge.connect(user1).redeem(user1.address, redeemAmount, nonce, signature))
                .to.be.revertedWith("redeem: Wrong signature");

            // Attempt to swap an amount higher than the bridge's wZNN balance
            const alphanetAddress = "z1qr32xv533nnsh8uzpjac8v0ed39297lnjaqg72";
            let swapBalance = user1Balance.mul(2);
            await expect(bridge.connect(user1).swap(swapBalance, alphanetAddress))
                .to.be.revertedWith("BEP20: transfer amount exceeds balance");

            // Attempt to swap without an allowance
            await expect(bridge.connect(user1).swap(user1Balance, alphanetAddress))
                .to.be.revertedWith("BEP20: transfer amount exceeds allowance");

            // Attempt a valid swap
            user1Balance = await wZNN.balanceOf(user1.address);
            await wZNN.connect(user1).increaseAllowance(bridge.address, user1Balance);
            await bridge.connect(user1).swap(user1Balance, alphanetAddress);
            user1Balance = await wZNN.balanceOf(user1.address);
            expect(await user1Balance).to.equal(ethers.utils.parseUnits("0", 8));
        });
    });
});