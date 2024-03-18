// Import necessary modules and types
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { KCash } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("KCash Test", function () {
  let kCash: KCash;
  let owner: HardhatEthersSigner;
  let alice: HardhatEthersSigner;
  let bob: HardhatEthersSigner;
  let designatedSigner: HardhatEthersSigner;
  let minterRole: string;

  beforeEach(async function () {
    // Deploy the contract, get signers, and set up the environment
    [owner, designatedSigner, alice, bob] = await ethers.getSigners();

    const KCash = await ethers.getContractFactory("KCash");
    kCash = (await upgrades.deployProxy(KCash, [
      owner.address,
      designatedSigner.address
    ]
    )) as unknown as KCash;
    await kCash.waitForDeployment();
    minterRole = await kCash.MINTER_ROLE();
  });

  describe("Mint KCash", function () {
    it("Should revert if not called by owner", async function () {
      await expect(
        kCash
          .connect(alice)
          .mint(alice.address, 100, { reward1: 10, reward2: 50, reward3: 40 })
      ).to.be.revertedWith(
        `AccessControl: account ${ alice.address.toLowerCase() } is missing role ${ minterRole }`
      );
    });

    it("Should revert if called by owner but bucket sum is not correct", async function () {
      await expect(
        kCash
          .connect(owner)
          .mint(alice.address, 100, { reward1: 10, reward2: 50, reward3: 30 })
      ).to.be.revertedWith("KC: amount mismatch");
    });

    it("Should mint KCash to designated address", async function () {
      await kCash
        .connect(owner)
        .mint(alice.address, 100, { reward1: 10, reward2: 50, reward3: 40 });
      expect(await kCash.balanceOf(alice.address)).to.equal(100);
      expect(await kCash.buckets(alice.address)).to.deep.equal([10n, 50n, 40n]);
    });
  });

  describe("Bulk mint KCash", function () {
    it("Should revert if not called by owner", async function () {
      await expect(
        kCash.connect(alice).bulkMint(
          [alice.address, bob.address],
          [100, 200],
          [
            { reward1: 10, reward2: 50, reward3: 40 },
            { reward1: 20, reward2: 100, reward3: 80 },
          ]
        )
      ).to.be.revertedWith(
        `AccessControl: account ${ alice.address.toLowerCase() } is missing role ${ minterRole }`
      );
    });
    it("Should revert if called by owner but bucket sum is not correct", async function () {
      await expect(
        kCash.connect(owner).bulkMint(
          [alice.address, bob.address],
          [100, 200],
          [
            { reward1: 10, reward2: 50, reward3: 40 },
            { reward1: 20, reward2: 100, reward3: 70 },
          ]
        )
      ).to.be.revertedWith("KC: amount mismatch");
    });
    it("Should mint KCash to designated addresses", async function () {
      await kCash.connect(owner).bulkMint(
        [alice.address, bob.address],
        [100, 200],
        [
          { reward1: 10, reward2: 50, reward3: 40 },
          { reward1: 20, reward2: 100, reward3: 80 },
        ]
      );
      expect(await kCash.balanceOf(alice.address)).to.equal(100);
      expect(await kCash.buckets(alice.address)).to.deep.equal([10n, 50n, 40n]);
      expect(await kCash.balanceOf(bob.address)).to.equal(200);
      expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 80n]);
    });
  });
  describe("Transfer KCash", function () {
    // Mint KCash to alice and bob
    beforeEach(async function () {
      await kCash.connect(owner).bulkMint(
        [alice.address, bob.address],
        [100, 200],
        [
          { reward1: 10, reward2: 50, reward3: 40 },
          { reward1: 20, reward2: 100, reward3: 80 },
        ]
      );
    });



    it("Scenario-1: Transfer with Reward3 covering the entire amount", async function () {
      await kCash.connect(alice).transfer(bob.address, 30);
      expect(await kCash.balanceOf(alice.address)).to.equal(70);
      expect(await kCash.buckets(alice.address)).to.deep.equal([10n, 50n, 10n]);
      expect(await kCash.balanceOf(bob.address)).to.equal(230);
      expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 110]);
    });

    it("Scenario-2: Transfer with Reward3 + Reward2 covering the entire amount", async function () {
      await kCash.connect(alice).transfer(bob.address, 70);
      expect(await kCash.balanceOf(alice.address)).to.equal(30);
      expect(await kCash.buckets(alice.address)).to.deep.equal([10n, 20n, 0n]);
      expect(await kCash.balanceOf(bob.address)).to.equal(270);
      expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 150]);
    });

    it("Scenario-3: Transfer with  Reward3 + Reward2 + Reward1 covering the entire amount", async function () {
      await kCash.connect(alice).transfer(bob.address, 100);
      expect(await kCash.balanceOf(alice.address)).to.equal(0);
      expect(await kCash.buckets(alice.address)).to.deep.equal([0n, 0n, 0n]);
      expect(await kCash.balanceOf(bob.address)).to.equal(300);
      expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 180]);
    });

    // it("Scenario-4: Transfer with Reward3 partially covering the amount", async function () {
    //   await kCash.connect(alice).transfer(bob.address, 50);
    //   expect(await kCash.balanceOf(alice.address)).to.equal(50);
    //   expect(await kCash.buckets(alice.address)).to.deep.equal([ 10n, 10n, 0n]);
    //   expect(await kCash.balanceOf(bob.address)).to.equal(250);
    //   expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 140n]);
    // });

    // it("Scenario-5: Transfer with Reward2 and Reward3 partially covering the amount", async function () {
    //   await kCash.connect(alice).transfer(bob.address, 80);
    //   expect(await kCash.balanceOf(alice.address)).to.equal(20);
    //   expect(await kCash.buckets(alice.address)).to.deep.equal([10n, 0n, 0n]);
    //   expect(await kCash.balanceOf(bob.address)).to.equal(280);
    //   expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 120n]);
    // });

    // it("Scenario-6: Transfer with Reward1 partially covering the amount", async function () {
    //   await kCash.connect(alice).transfer(bob.address, 25);
    //   expect(await kCash.balanceOf(alice.address)).to.equal(75);
    //   expect(await kCash.buckets(alice.address)).to.deep.equal([10n, 50n, 15n]);
    //   expect(await kCash.balanceOf(bob.address)).to.equal(225);
    //   expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 95n]);
    // });

    // it("Scenario-7: Transfer with Reward3 and Reward2 both covering the amount", async function () {
    //   await kCash.connect(alice).transfer(bob.address, 70);
    //   expect(await kCash.balanceOf(alice.address)).to.equal(30);
    //   expect(await kCash.buckets(alice.address)).to.deep.equal([10n, 0n, 0n]);
    //   expect(await kCash.balanceOf(bob.address)).to.equal(270);
    //   expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 120n]);
    // });
  });


  describe("Admin Transfer KCash", function () {
    // Mint KCash to alice and bob
    beforeEach(async function () {
      await kCash.connect(owner).bulkMint(
        [alice.address, bob.address],
        [100, 200],
        [
          { reward1: 10, reward2: 50, reward3: 40 },
          { reward1: 20, reward2: 100, reward3: 80 },
        ]
      );
    });
    it("After Admin Transfer KCash, the balance of sender should decrease and the balance of receiver should increase and the Bucket balance should be correct", async function () {
      const values = {
        nonce: 1,
        from: alice.address,
        to: bob.address,
        deductionFromSender: {
          reward1: 10,
          reward2: 30,
          reward3: 30,
        },
        additionToRecipient: {
          reward1: 10,
          reward2: 30,
          reward3: 30,
        },
      };
      const generateSigner = async () => {
        let domain = {
          name: "KCashSigner",
          version: "1",
          chainId: await ethers.provider
            .getNetwork()
            .then((network) => network.chainId),
          verifyingContract: await kCash.getAddress(),
        };

        let types = {
          BucketSignature: [
            { name: "reward1", type: "uint256" },
            { name: "reward2", type: "uint256" },
            { name: "reward3", type: "uint256" },
          ],
          AdminTransferSignature: [
            { name: "nonce", type: "uint32" },
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "deductionFromSender", type: "BucketSignature" },
            { name: "additionToRecipient", type: "BucketSignature" },
          ],
        };



        const sign = await designatedSigner.signTypedData(domain, types, values);
        return sign;
      };

      await kCash
        .connect(alice)
        .adminTransferWithSignature({
          nonce: values.nonce,
          from: values.from,
          to: values.to,
          deductionFromSender: values.deductionFromSender,
          additionToRecipient: values.additionToRecipient,
          signature: await generateSigner()
        });


      expect(await kCash.buckets(alice.address)).to.deep.equal([0n, 20n, 10n]);
      expect(await kCash.balanceOf(bob.address)).to.equal(270);
      expect(await kCash.buckets(bob.address)).to.deep.equal([30n, 130n, 110n]);
      expect(await kCash.balanceOf(alice.address)).to.equal(30);

    });
  });

  describe("Transfer To Reward3", function () {
    beforeEach(async function () {
      await kCash.connect(owner).bulkMint(
        [alice.address, bob.address],
        [300, 300],
        [
          { reward1: 100, reward2: 100, reward3: 100 },
          { reward1: 100, reward2: 100, reward3: 100 },
        ]
      );
    });
    // it("Transfer should revert for amount mismatch", async function () {
    //   await expect(
    //     kCash.connect(alice).transferToReward3(bob.address, {
    //       reward1: 5,
    //       reward2: 25,
    //       reward3: 10,
    //     })
    //   ).to.be.revertedWith("KC: amount mismatch");
    // })

    //TODO: updated values
    it("After Transfer To Reward3, the balance of sender should decrease and the balance of receiver should increase and the Bucket balance should be correct", async function () {
      await kCash.connect(alice).transferToReward3(bob.address, { reward3: 0, reward2: 0, reward1: 10 });
      // expect(await kCash.balanceOf(alice.address)).to.equal(50);
      // expect(await kCash.buckets(alice.address)).to.deep.equal([5n, 25n, 20n]);
      // expect(await kCash.balanceOf(bob.address)).to.equal(250);
      // expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 130n]);
    });
    it("After Transfer To reward3, the balance of sender should decrease and the balance of receiver should increase and the Bucket balance should be correct", async function () {
      await kCash.connect(alice).transferToReward3(bob.address, { reward3: 10, reward2: 0, reward1: 0 });
      // expect(await kCash.balanceOf(alice.address)).to.equal(50);
      // expect(await kCash.buckets(alice.address)).to.deep.equal([5n, 25n, 20n]);
      // expect(await kCash.balanceOf(bob.address)).to.equal(250);
      // expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 130n]);
    });
    it("After Transfer To Reward3, the balance of sender should decrease and the balance of receiver should increase and the Bucket balance should be correct", async function () {
      await kCash.connect(alice).transferToReward3(bob.address, { reward3: 20, reward2: 0, reward1: 0 });
      // expect(await kCash.balanceOf(alice.address)).to.equal(50);
      // expect(await kCash.buckets(alice.address)).to.deep.equal([5n, 25n, 20n]);
      // expect(await kCash.balanceOf(bob.address)).to.equal(250);
      // expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 130n]);
    });
    it("After Transfer To Reward3, the balance of sender should decrease and the balance of receiver should increase and the Bucket balance should be correct", async function () {
      await kCash.connect(alice).transferToReward3(bob.address, { reward3: 10, reward2: 10, reward1: 0 });
      // expect(await kCash.balanceOf(alice.address)).to.equal(50);
      // expect(await kCash.buckets(alice.address)).to.deep.equal([5n, 25n, 20n]);
      // expect(await kCash.balanceOf(bob.address)).to.equal(250);
      // expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 130n]);
    });
    it("After Transfer To Reward3, the balance of sender should decrease and the balance of receiver should increase and the Bucket balance should be correct", async function () {
      await kCash.connect(alice).transferToReward3(bob.address, { reward3: 0, reward2: 10, reward1: 0 });
      // expect(await kCash.balanceOf(alice.address)).to.equal(50);
      // expect(await kCash.buckets(alice.address)).to.deep.equal([5n, 25n, 20n]);
      // expect(await kCash.balanceOf(bob.address)).to.equal(250);
      // expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 130n]);
    });
  })

  describe("Transfer Reward3 To Reward3", function () {
    beforeEach(async function () {
      await kCash.connect(owner).bulkMint(
        [alice.address, bob.address],
        [300, 300],
        [
          { reward1: 100, reward2: 100, reward3: 100 },
          { reward1: 100, reward2: 100, reward3: 100 },
        ]
      );
    });

    //TODO: updated values
    it("After Transfer To reward3, the balance of sender should decrease and the balance of receiver should increase and the Bucket balance should be correct", async function () {
      await kCash.connect(alice).transferReward3ToReward3(bob.address, 100);
      // expect(await kCash.balanceOf(alice.address)).to.equal(50);
      // expect(await kCash.buckets(alice.address)).to.deep.equal([5n, 25n, 20n]);
      // expect(await kCash.balanceOf(bob.address)).to.equal(250);
      // expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 130n]);
    });
    it("After Transfer To Reward3, the balance of sender should decrease and the balance of receiver should increase and the Bucket balance should be correct", async function () {
      await kCash.connect(alice).transferReward3ToReward3(bob.address, 20);
      // expect(await kCash.balanceOf(alice.address)).to.equal(50);
      // expect(await kCash.buckets(alice.address)).to.deep.equal([5n, 25n, 20n]);
      // expect(await kCash.balanceOf(bob.address)).to.equal(250);
      // expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 130n]);
    });
  })





  describe("TransferFromReward3ToReward1", function () {
    beforeEach(async function () {
      await kCash.connect(owner).bulkMint(
        [alice.address, bob.address],
        [100, 200],
        [
          { reward1: 10, reward2: 50, reward3: 40 },
          { reward1: 20, reward2: 100, reward3: 80 },
        ]
      );
    });
    it("After TransferFromReward3ToReward1, the balance of sender should decrease and the balance of receiver should increase and the Bucket balance should be correct", async function () {

      const values = {
        nonce: 1,
        from: alice.address,
        to: bob.address,
        amount: 25,
      };
      const generateSigner = async () => {
        let domain = {
          name: "KCashSigner",
          version: "1",
          chainId: await ethers.provider
            .getNetwork()
            .then((network) => network.chainId),
          verifyingContract: await kCash.getAddress(),
        };

        let types = {
          TransferFromReward3ToReward1Signature: [
            { name: "nonce", type: "uint32" },
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" }
          ],
        };


        const sign = await designatedSigner.signTypedData(domain, types, values);
        return sign;
      };
      await kCash.connect(alice).transferFromReward3ToReward1({
        nonce: 1,
        from: values.from,
        to: values.to,
        amount: values.amount,
        signature: await generateSigner(),
      });

      //TODO: updated values
      expect(await kCash.balanceOf(alice.address)).to.equal(75);
      expect(await kCash.buckets(alice.address)).to.deep.equal([10n, 50n, 15n]);
      expect(await kCash.balanceOf(bob.address)).to.equal(225);
      expect(await kCash.buckets(bob.address)).to.deep.equal([45n, 100n, 80n]);
    }
    );
  })

  describe("TransferFromReward3ToReward2", function () {
    beforeEach(async function () {
      await kCash.connect(owner).bulkMint(
        [alice.address, bob.address],
        [100, 200],
        [
          { reward1: 10, reward2: 50, reward3: 40 },
          { reward1: 20, reward2: 100, reward3: 80 },
        ]
      );
    });
    it("After TransferFromReward3ToReward2, the balance of sender should decrease and the balance of receiver should increase and the Bucket balance should be correct", async function () {
      const values = {
        nonce: 1,
        from: alice.address,
        to: bob.address,
        amount: 15,
      };
      const generateSigner = async () => {
        let domain = {
          name: "KCashSigner",
          version: "1",
          chainId: await ethers.provider
            .getNetwork()
            .then((network) => network.chainId),
          verifyingContract: await kCash.getAddress(),
        };

        let types = {
          TransferFromReward3ToReward2Signature: [
            { name: "nonce", type: "uint32" },
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" }
          ],
        };

        const sign = await designatedSigner.signTypedData(domain, types, values);
        return sign;
      };
      await kCash.connect(alice).transferFromReward3ToReward2({
        nonce: values.nonce,
        from: values.from,
        to: values.to,
        amount: values.amount,
        signature: await generateSigner(),
      });
      //TODO: updated values
      expect(await kCash.balanceOf(alice.address)).to.equal(85);
      expect(await kCash.buckets(alice.address)).to.deep.equal([10n, 50n, 25n]);
      expect(await kCash.balanceOf(bob.address)).to.equal(215);
      expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 115n, 80n]);
    }
    );
  })

  describe("TransferFromReward3ToReward2Bulk", function () {
    beforeEach(async function () {
      await kCash.connect(owner).bulkMint(
        [alice.address, bob.address],
        [300, 200],
        [
          { reward1: 100, reward2: 100, reward3: 100 },
          { reward1: 20, reward2: 100, reward3: 80 },
        ]
      );
    });
    it("TransferFromReward3ToReward2Bulk 100 Tx", async function () {

      const generateSigner = async (values: any) => {
        let domain = {
          name: "KCashSigner",
          version: "1",
          chainId: await ethers.provider
            .getNetwork()
            .then((network) => network.chainId),
          verifyingContract: await kCash.getAddress(),
        };

        let types = {
          TransferFromReward3ToReward2Signature: [
            { name: "nonce", type: "uint32" },
            { name: "from", type: "address" },
            { name: "to", type: "address" },
            { name: "amount", type: "uint256" }
          ],
        };
        const sign = await designatedSigner.signTypedData(domain, types, values);
        return sign;
      };


      let valuesArray = [];
      for (let i = 0; i < 100; i++) {
        const values = {
          nonce: i,
          from: alice.address,
          to: bob.address,
          amount: 1,
        };
        valuesArray.push({
          nonce: values.nonce,
          from: values.from,
          to: values.to,
          amount: values.amount,
          signature: await generateSigner(values)
        });
      }
      // console.log(valuesArray);
      await kCash.connect(alice).transferFromReward3ToReward2Bulk(valuesArray);
      //TODO: updated values
      // expect(await kCash.balanceOf(alice.address)).to.equal(85);
      // expect(await kCash.buckets(alice.address)).to.deep.equal([10n, 50n, 25n]);
      // expect(await kCash.balanceOf(bob.address)).to.equal(215);
      // expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 115n, 80n]);
    }
    );
  })



  describe("decimals", function () {
    it("Should return 0", async function () {
      expect(await kCash.decimals()).to.equal(0);
    })
  })

  describe("Bulk Transfer", function () {
    beforeEach(async function () {
      await kCash.connect(owner).bulkMint(
        [alice.address, bob.address, owner.address],
        [100, 200, 300],
        [
          { reward1: 10, reward2: 50, reward3: 40 },
          { reward1: 20, reward2: 100, reward3: 80 },
          { reward1: 30, reward2: 150, reward3: 120 },
        ]
      );
    });
    it("Should transfer KCash to designated addresses", async function () {
      await kCash.connect(owner).bulkTransfer(
        [alice.address, bob.address],
        [100, 200]
      );
      expect(await kCash.balanceOf(owner.address)).to.equal(0);
      expect(await kCash.balanceOf(alice.address)).to.equal(200);
      expect(await kCash.balanceOf(bob.address)).to.equal(400);

      // expect(await kCash.buckets(alice.address)).to.deep.equal([10n, 50n, 40n]);
      // expect(await kCash.balanceOf(bob.address)).to.equal(200);
      // expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 80n]);
    });
  })

  describe("Bulk Transfer From Reward3 to Reward1 admin", function() {
    beforeEach(async function () {
      await kCash.connect(owner).bulkMint(
        [alice.address, bob.address, owner.address],
        [100, 200, 300],
        [
          { reward1: 10, reward2: 50, reward3: 40 },
          { reward1: 20, reward2: 100, reward3: 80 },
          { reward1: 30, reward2: 150, reward3: 120 },
        ]
      );
    });
    it("Should transfer KCash to designated addresses reward1", async function () {
      await kCash.connect(owner).adminTransferFromReward3ToReward1Bulk(
        [alice.address, bob.address],
        [50, 60]
      );
      expect(await kCash.balanceOf(owner.address)).to.equal(190);
      expect(await kCash.balanceOf(alice.address)).to.equal(150);
      expect(await kCash.balanceOf(bob.address)).to.equal(260);
      expect(await kCash.buckets(alice.address)).to.deep.equal([60n, 50n, 40n]);
      expect(await kCash.buckets(bob.address)).to.deep.equal([80n, 100n, 80]);
      expect(await kCash.buckets(owner.address)).to.deep.equal([30n, 150n, 10n]);

    });
  })


  describe("Bulk Transfer From Reward3 to Reward2 admin", function() {
    beforeEach(async function () {
      await kCash.connect(owner).bulkMint(
        [alice.address, bob.address, owner.address],
        [100, 200, 300],
        [
          { reward1: 10, reward2: 50, reward3: 40 },
          { reward1: 20, reward2: 100, reward3: 80 },
          { reward1: 30, reward2: 150, reward3: 120 },
        ]
      );
    });
    it("Should transfer KCash to designated addresses reward2", async function () {
      await kCash.connect(owner).adminTransferFromReward3ToReward2Bulk(
        [alice.address, bob.address],
        [50, 60]
      );
      expect(await kCash.balanceOf(owner.address)).to.equal(190);
      expect(await kCash.balanceOf(alice.address)).to.equal(150);
      expect(await kCash.balanceOf(bob.address)).to.equal(260);
      expect(await kCash.buckets(alice.address)).to.deep.equal([10n, 100n, 40n]);
      expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 160n, 80]);
      expect(await kCash.buckets(owner.address)).to.deep.equal([30n, 150n, 10n]);

    });
  })

  // describe("transferFrom", function () {
  //   beforeEach(async function () {
  //     await kCash.connect(owner).bulkMint(
  //       [alice.address, bob.address],
  //       [100, 200],
  //       [
  //         { reward1: 10, reward2: 50, reward3: 40 },
  //         { reward1: 20, reward2: 100, reward3: 80 },
  //       ]
  //     );
  //   });

  //   it("should transfer KCash from one address to another using transferFrom", async function () {
  //     // Approve the spender (alice) to spend KCash on behalf of the owner
  //     await kCash.connect(owner).approve(alice.address, 5);

  //     await kCash.connect(alice).transferFrom(owner.address, bob.address, 5);

  //     expect(await kCash.balanceOf(owner.address)).to.equal(95);
  //     expect(await kCash.buckets(owner.address)).to.deep.equal([10n, 50n, 35n]);
  //     expect(await kCash.balanceOf(bob.address)).to.equal(205);
  //     expect(await kCash.buckets(bob.address)).to.deep.equal([20n, 100n, 80n]);

  //     // Check the allowance after the transfer
  //     expect(await kCash.allowance(owner.address, alice.address)).to.equal(95);
  //   });


  // })

})
