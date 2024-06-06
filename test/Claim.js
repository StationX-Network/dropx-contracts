const { expect, use } = require("chai");
const { ethers, upgrades } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");
const { MerkleTree } = require("merkletreejs");
const keccak256 = require("keccak256");

describe("Claim contract testing", () => {
  let erc20DepositMaxClaimableFreeForAll,
    erc20DepositMaxClaimableERC20Gated,
    erc20DepositMaxClaimableERC721Gated,
    erc20DepositWhitelist,
    erc20AllowanceMaxClaimableERC20Gated,
    erc20AllowanceMaxClaimableERC721Gated,
    erc20AllowanceMaxClaimableFreeForAll,
    erc20AllowanceWhitelist,
    erc20PendingClaim,
    owner,
    rollback,
    user1,
    user2,
    test1,
    test2,
    token1,
    token2,
    admin,
    usdcContract,
    daoToken,
    claimContract,
    claimFactory,
    tree,
    testNft,
    daoNft,
    root;

  const deployContracts = async () => {
    [owner, rollback, user1, user2, test1, test2, token1, token2, admin] =
      await ethers.getSigners();

    const USDC = await ethers.getContractFactory("USDC");
    usdcContract = await USDC.deploy();
    await usdcContract.deployed();

    const Claim = await ethers.getContractFactory("Claim");
    claimContract = await Claim.deploy();
    await claimContract.deployed();

    const ClaimFactory = await ethers.getContractFactory("ClaimFactory");
    claimFactory = await upgrades.deployProxy(
      ClaimFactory,
      [
        claimContract.address,
        ethers.utils.parseEther("0.1"),
        ethers.utils.parseEther("1"),
        0x89,
      ],
      {
        initializer: "initialize",
      }
    );
    await claimFactory.deployed();

    const DAOToken = await ethers.getContractFactory("USDC");
    daoToken = await DAOToken.connect(owner).deploy();
    await daoToken.deployed();

    const abi = ethers.utils.defaultAbiCoder;

    let leaf1 = abi.encode(
      ["address", "uint256"],
      [user1.address, ethers.utils.parseUnits("100", 6)]
    );
    let leaf2 = abi.encode(
      ["address", "uint256"],
      [user2.address, ethers.utils.parseUnits("200", 6)]
    );
    let leaf3 = abi.encode(
      ["address", "uint256"],
      [test1.address, ethers.utils.parseUnits("20", 6)]
    );
    let leaf4 = abi.encode(["address", "uint256"], [test2.address, 2]);
    let leaf5 = abi.encode(
      ["address", "uint256"],
      ["0xe643cf465ede9ad11e152bab8d3cdc6cbc3712e1", "1241387871640494"]
    );
    let leaf6 = abi.encode(
      ["address", "uint256"],
      ["0x5ac09ca0865b5492a82460acb43ce658ea6163d2", "124138787164049"]
    );

    const leaves = [leaf1, leaf2, leaf3, leaf4, leaf5, leaf6].map((v) =>
      keccak256(v)
    );
    tree = new MerkleTree(leaves, keccak256, { sort: true });
    root = tree.getHexRoot();

    let claimSettings = [
      "name",
      admin.address,
      admin.address,
      usdcContract.address,
      daoToken.address,
      ethers.utils.parseUnits("10", 6),
      (await time.latest()) + 100,
      (await time.latest()) + 1000000,
      0,
      false,
      true,
      root,
      2,
      [ethers.utils.parseUnits("100", 6), ethers.utils.parseUnits("1000", 6)],
    ];

    await usdcContract
      .connect(admin)
      .mint(admin.address, ethers.utils.parseUnits("10000000000", 6));
    await daoToken
      .connect(admin)
      .mint(user1.address, ethers.utils.parseUnits("1000000", 6));
    await usdcContract
      .connect(admin)
      .approve(claimFactory.address, ethers.utils.parseUnits("10000000000", 6));

    const NFT = await ethers.getContractFactory("TestNft");
    testNft = await NFT.deploy();
    await testNft.deployed();

    daoNft = await NFT.deploy();
    await daoNft.deployed();

    await testNft.testMint(admin.address);
    await daoNft.testMint(user1.address);
    await daoNft.testMint(user1.address);

    const ClaimEmitter = await ethers.getContractFactory("ClaimEmitter");
    emitter = await upgrades.deployProxy(ClaimEmitter, [claimFactory.address], {
      initializer: "initialize",
    });
    await emitter.deployed();

    await claimFactory.setEmitter(emitter.address);

    // erc20DepositMaxClaimableFreeForAll
    const txn1 = await claimFactory
      .connect(admin)
      .deployClaimContract(claimSettings, 100, 100, "network", {
        value: ethers.utils.parseEther("1"),
      });
    const receipt1 = await txn1.wait();
    erc20DepositMaxClaimableFreeForAll =
      receipt1.events[7].args._newClaimContract;
    claimInstance1 = Claim.attach(erc20DepositMaxClaimableFreeForAll);

    // erc20DepositMaxClaimableERC20Gated
    claimSettings[12] = 0;
    const txn2 = await claimFactory
      .connect(admin)
      .deployClaimContract(claimSettings, 100, 100, "network", {
        value: ethers.utils.parseEther("1"),
      });
    const receipt2 = await txn2.wait();
    erc20DepositMaxClaimableERC20Gated =
      receipt2.events[7].args._newClaimContract;
    claimInstance2 = Claim.attach(erc20DepositMaxClaimableERC20Gated);

    // erc20DepositMaxClaimableERC721Gated
    claimSettings[4] = daoNft.address;
    claimSettings[5] = 1;
    claimSettings[12] = 0;
    const txn3 = await claimFactory
      .connect(admin)
      .deployClaimContract(claimSettings, 100, 100, "network", {
        value: ethers.utils.parseEther("1"),
      });
    const receipt3 = await txn3.wait();
    erc20DepositMaxClaimableERC721Gated =
      receipt3.events[7].args._newClaimContract;
    claimInstance3 = Claim.attach(erc20DepositMaxClaimableERC721Gated);

    // erc20DepositWhitelist
    claimSettings[12] = 1;
    const txn4 = await claimFactory
      .connect(admin)
      .deployClaimContract(claimSettings, 100, 100, "network", {
        value: ethers.utils.parseEther("1"),
      });
    const receipt4 = await txn4.wait();
    erc20DepositWhitelist = receipt4.events[7].args._newClaimContract;
    claimInstance4 = Claim.attach(erc20DepositWhitelist);

    // erc20AllowanceMaxClaimableERC20Gated
    claimSettings[12] = 0;
    claimSettings[9] = true;
    const txn5 = await claimFactory
      .connect(admin)
      .deployClaimContract(claimSettings, 100, 100, "network", {
        value: ethers.utils.parseEther("1"),
      });
    const receipt5 = await txn5.wait();
    erc20AllowanceMaxClaimableERC20Gated =
      receipt5.events[5].args._newClaimContract;
    claimInstance5 = Claim.attach(erc20AllowanceMaxClaimableERC20Gated);
    await usdcContract
      .connect(admin)
      .approve(claimInstance5.address, ethers.utils.parseUnits("1000", 6));

    // erc20AllowanceMaxClaimableERC721Gated
    claimSettings[4] = daoNft.address;
    claimSettings[5] = 1;
    claimSettings[12] = 0;
    const txn6 = await claimFactory
      .connect(admin)
      .deployClaimContract(claimSettings, 100, 100, "network", {
        value: ethers.utils.parseEther("1"),
      });
    const receipt6 = await txn6.wait();
    erc20AllowanceMaxClaimableERC721Gated =
      receipt6.events[5].args._newClaimContract;
    claimInstance6 = Claim.attach(erc20AllowanceMaxClaimableERC721Gated);
    await usdcContract
      .connect(admin)
      .approve(claimInstance6.address, ethers.utils.parseUnits("1000", 6));

    // erc20AllowanceMaxClaimableFreeForAll
    claimSettings[12] = 2;
    const txn7 = await claimFactory
      .connect(admin)
      .deployClaimContract(claimSettings, 100, 100, "network", {
        value: ethers.utils.parseEther("1"),
      });
    const receipt7 = await txn7.wait();
    erc20AllowanceMaxClaimableFreeForAll =
      receipt7.events[5].args._newClaimContract;
    claimInstance7 = Claim.attach(erc20AllowanceMaxClaimableFreeForAll);
    await usdcContract
      .connect(admin)
      .approve(claimInstance7.address, ethers.utils.parseUnits("1000", 6));

    // erc20AllowanceWhitelist
    claimSettings[12] = 1;
    const txn8 = await claimFactory
      .connect(admin)
      .deployClaimContract(claimSettings, 100, 100, "network", {
        value: ethers.utils.parseEther("1"),
      });
    const receipt8 = await txn8.wait();
    erc20AllowanceWhitelist = receipt8.events[5].args._newClaimContract;
    claimInstance8 = Claim.attach(erc20AllowanceWhitelist);
    await usdcContract
      .connect(admin)
      .approve(claimInstance8.address, ethers.utils.parseUnits("1000", 6));

    // erc20PendingClaim
    claimSettings[8] = 100;
    claimSettings[12] = 2;
    const txn9 = await claimFactory
      .connect(admin)
      .deployClaimContract(claimSettings, 100, 100, "network", {
        value: ethers.utils.parseEther("1"),
      });
    const receipt9 = await txn9.wait();
    erc20PendingClaim = receipt9.events[5].args._newClaimContract;
    claimInstance9 = Claim.attach(erc20PendingClaim);
    await usdcContract
      .connect(admin)
      .approve(claimInstance9.address, ethers.utils.parseUnits("1000", 6));
  };

  describe("Deploy new claim contract", () => {
    it("Should transfer tokens to new claim contract", async () => {
      await loadFixture(deployContracts);

      expect(await claimInstance1.connect(user1).claimBalance()).to.equal(
        ethers.utils.parseUnits("1000", 6)
      );

      expect(
        await usdcContract
          .connect(user1)
          .balanceOf(erc20DepositMaxClaimableFreeForAll)
      ).to.equal(ethers.utils.parseUnits("1000", 6));
    });
  });

  describe("erc20DepositMaxClaimableFreeForAll", () => {
    it("Should revert if claim has not yet started", async () => {
      await expect(
        claimInstance1
          .connect(user2)
          .claim(ethers.utils.parseUnits("10", 6), user2.address, [], "0x", {
            value: ethers.utils.parseEther("0.1"),
          })
      ).to.be.revertedWithCustomError(claimInstance1, "ClaimNotStarted");
    });

    it("Set claimable amount for user and transfer tokens", async () => {
      await time.increase(100);
      await expect(
        claimInstance1
          .connect(user1)
          .claim(ethers.utils.parseUnits("10", 6), user1.address, [], "0x", {
            value: ethers.utils.parseEther("0.1"),
          })
      ).not.to.be.reverted;

      expect(await claimInstance1.connect(user1).claimBalance()).to.equal(
        ethers.utils.parseUnits("990", 6)
      );

      expect(
        await usdcContract.connect(user1).balanceOf(user1.address)
      ).to.equal(ethers.utils.parseUnits("10", 6));

      expect(
        await claimInstance1.connect(user1).claimAmount(user1.address)
      ).to.equal(ethers.utils.parseUnits("10", 6));
    });
  });

  describe("erc20DepositMaxClaimableERC721Gated", () => {
    it("Set claimable amount for user and transfer tokens", async () => {
      await expect(
        claimInstance3.connect(user1).claim(
          ethers.utils.parseUnits("90", 6), //amount
          user1.address,
          [],
          "0x",
          {
            value: ethers.utils.parseEther("0.1"),
          }
        )
      ).not.to.be.reverted;

      expect(await claimInstance3.connect(user1).claimBalance()).to.equal(
        ethers.utils.parseUnits("910", 6)
      );

      expect(
        await usdcContract.connect(user1).balanceOf(user1.address)
      ).to.equal(
        ethers.utils.parseUnits("100", 6) //prev 10 + current 90
      );

      expect(
        await claimInstance3.connect(user1).claimAmount(user1.address)
      ).to.equal(ethers.utils.parseUnits("90", 6));
    });

    it("Should revert if user doesn't own dao tokens", async () => {
      await expect(
        claimInstance3.connect(user2).claim(
          ethers.utils.parseUnits("100", 6), //amount
          user2.address,
          [],
          "0x",
          {
            value: ethers.utils.parseEther("0.1"),
          }
        )
      ).to.be.reverted;
    });
  });

  describe("erc20DepositMaxClaimableERC20Gated", () => {
    it("Set claimable amount for user and transfer tokens", async () => {
      await expect(
        claimInstance2.connect(user1).claim(
          ethers.utils.parseUnits("90", 6), //amount
          user1.address,
          [],
          "0x",
          {
            value: ethers.utils.parseEther("0.1"),
          }
        )
      ).not.to.be.reverted;

      expect(await claimInstance2.connect(user1).claimBalance()).to.equal(
        ethers.utils.parseUnits("910", 6)
      );

      expect(
        await usdcContract.connect(user1).balanceOf(user1.address)
      ).to.equal(
        ethers.utils.parseUnits("190", 6) //prev 100 + current 90
      );

      expect(
        await claimInstance2.connect(user1).claimAmount(user1.address)
      ).to.equal(ethers.utils.parseUnits("90", 6));
    });

    it("Should revert if user doesn't own dao tokens", async () => {
      await expect(
        claimInstance2.connect(user2).claim(
          ethers.utils.parseUnits("100", 6), //amount
          user2.address,
          [],
          "0x",
          {
            value: ethers.utils.parseEther("0.1"),
          }
        )
      ).to.be.reverted;
    });
  });

  describe("erc20DepositWhitelist", () => {
    it("Set claimable amount for user and transfer tokens", async () => {
      const abi = ethers.utils.defaultAbiCoder;

      let leaf = keccak256(
        abi.encode(
          ["address", "uint256"],
          [user2.address, ethers.utils.parseUnits("200", 6)]
        )
      );

      const proof = tree.getHexProof(leaf);

      await expect(
        claimInstance4.connect(user2).claim(
          ethers.utils.parseUnits("100", 6), //amount
          user2.address,
          proof, //merkle proof
          abi.encode(
            ["address", "uint256"],
            [user2.address, ethers.utils.parseUnits("200", 6)]
          ),
          {
            value: ethers.utils.parseEther("0.1"),
          }
        )
      ).not.to.be.reverted;

      expect(await claimInstance4.connect(user1).claimBalance()).to.equal(
        ethers.utils.parseUnits("900", 6)
      );

      expect(
        await usdcContract.connect(user1).balanceOf(user2.address)
      ).to.equal(ethers.utils.parseUnits("100", 6));

      expect(
        await claimInstance4.connect(user1).claimAmount(user2.address)
      ).to.equal(ethers.utils.parseUnits("100", 6));
    });

    it("Should revert for incorrect proof", async () => {
      const abi = ethers.utils.defaultAbiCoder;

      let leaf = keccak256(
        abi.encode(
          ["address", "uint256"],
          [test2.address, ethers.utils.parseUnits("200", 6)]
        )
      );

      const proof = tree.getHexProof(leaf);

      await expect(
        claimInstance4.connect(test2).claim(
          ethers.utils.parseUnits("10", 6), //amount
          test2.address,
          proof, //merkle proof
          abi.encode(
            ["address", "uint256"],
            [test2.address, ethers.utils.parseUnits("200", 6)]
          ),
          {
            value: ethers.utils.parseEther("0.1"),
          }
        )
      ).to.be.reverted;
    });
  });

  describe("erc20AllowanceMaxClaimableERC20Gated", () => {
    it("Set claimable amount for user and transfer tokens", async () => {
      expect(await usdcContract.balanceOf(claimInstance5.address)).to.equal(0);

      await expect(
        claimInstance5.connect(user1).claim(
          ethers.utils.parseUnits("10", 6), //amount
          user1.address,
          [],
          "0x",
          {
            value: ethers.utils.parseEther("0.1"),
          }
        )
      ).not.to.be.reverted;

      expect(await claimInstance5.connect(user1).claimBalance()).to.equal(
        ethers.utils.parseUnits("990", 6)
      );

      expect(
        await usdcContract.connect(user1).balanceOf(user1.address)
      ).to.equal(
        ethers.utils.parseUnits("200", 6) //prev 190 + current 10
      );

      expect(
        await claimInstance5.connect(user1).claimAmount(user1.address)
      ).to.equal(ethers.utils.parseUnits("10", 6));
    });

    it("Should revert if user doesn't own dao tokens", async () => {
      await expect(
        claimInstance5.connect(user2).claim(
          ethers.utils.parseUnits("100", 6), //amount
          user2.address,
          [],
          "0x",
          {
            value: ethers.utils.parseEther("0.1"),
          }
        )
      ).to.be.reverted;
    });
  });

  describe("erc20AllowanceMaxClaimableERC721Gated", () => {
    it("Set claimable amount for user and transfer tokens", async () => {
      expect(await usdcContract.balanceOf(claimInstance6.address)).to.equal(0);

      await expect(
        claimInstance6.connect(user1).claim(
          ethers.utils.parseUnits("100", 6), //amount
          user1.address,
          [],
          "0x",
          {
            value: ethers.utils.parseEther("0.1"),
          }
        )
      ).not.to.be.reverted;

      expect(await claimInstance6.connect(user1).claimBalance()).to.equal(
        ethers.utils.parseUnits("900", 6)
      );

      expect(
        await usdcContract.connect(user1).balanceOf(user1.address)
      ).to.equal(
        ethers.utils.parseUnits("300", 6) //prev 200 + current 10
      );

      expect(
        await claimInstance6.connect(user1).claimAmount(user1.address)
      ).to.equal(ethers.utils.parseUnits("100", 6));
    });

    it("Should revert if user doesn't own dao tokens", async () => {
      await expect(
        claimInstance6.connect(user2).claim(
          ethers.utils.parseUnits("100", 6), //amount
          user2.address,
          [],
          "0x",
          {
            value: ethers.utils.parseEther("0.1"),
          }
        )
      ).to.be.reverted;
    });
  });

  describe("erc20AllowanceMaxClaimableFreeForAll", () => {
    it("Set claimable amount for user and transfer tokens", async () => {
      await expect(
        claimInstance7
          .connect(user1)
          .claim(ethers.utils.parseUnits("50", 6), user1.address, [], "0x", {
            value: ethers.utils.parseEther("0.1"),
          })
      ).not.to.be.reverted;

      expect(await claimInstance7.connect(user1).claimBalance()).to.equal(
        ethers.utils.parseUnits("950", 6)
      );

      expect(
        await usdcContract.connect(user1).balanceOf(user1.address)
      ).to.equal(
        ethers.utils.parseUnits("350", 6) //prev 300 + current 50
      );

      expect(
        await claimInstance7.connect(user1).claimAmount(user1.address)
      ).to.equal(ethers.utils.parseUnits("50", 6));
    });
  });

  describe("changeClaimPrice", () => {
    it("Should change claim price", async () => {
      await expect(
        claimFactory
          .connect(owner)
          .changeClaimPrice(ethers.utils.parseEther("1"))
      ).not.to.be.reverted;
    });

    it("Should revert if caller is not admin", async () => {
      await expect(
        claimFactory
          .connect(admin)
          .changeClaimPrice(ethers.utils.parseEther("1"))
      ).to.be.reverted;
    });
  });

  describe("withdrawFunds", () => {
    it("Should withdraw funds", async () => {
      await expect(
        claimFactory
          .connect(owner)
          .withdrawFunds(owner.address, ethers.utils.parseEther("1"))
      ).not.to.be.reverted;
    });

    it("Should revert if caller is not admin", async () => {
      await expect(
        claimFactory
          .connect(admin)
          .withdrawFunds(owner.address, ethers.utils.parseEther("1"))
      ).to.be.reverted;
    });
  });

  describe("erc20AllowanceWhitelist", () => {
    it("Set claimable amount for user and transfer tokens", async () => {
      const abi = ethers.utils.defaultAbiCoder;

      let leaf = keccak256(
        abi.encode(
          ["address", "uint256"],
          [test1.address, ethers.utils.parseUnits("20", 6)]
        )
      );

      const proof = tree.getHexProof(leaf);

      await expect(
        claimInstance8.connect(test1).claim(
          ethers.utils.parseUnits("10", 6), //amount
          test1.address,
          proof, //merkle proof
          abi.encode(
            ["address", "uint256"],
            [test1.address, ethers.utils.parseUnits("20", 6)]
          ),
          {
            value: ethers.utils.parseEther("0.1"),
          }
        )
      ).not.to.be.reverted;

      expect(await claimInstance8.connect(user1).claimBalance()).to.equal(
        ethers.utils.parseUnits("990", 6)
      );

      expect(
        await usdcContract.connect(user1).balanceOf(test1.address)
      ).to.equal(ethers.utils.parseUnits("10", 6));

      expect(
        await claimInstance8.connect(user1).claimAmount(test1.address)
      ).to.equal(ethers.utils.parseUnits("10", 6));
    });

    it("Should revert for incorrect proof", async () => {
      const abi = ethers.utils.defaultAbiCoder;

      let leaf = keccak256(
        abi.encode(
          ["address", "uint256"],
          [test2.address, ethers.utils.parseUnits("200", 6)]
        )
      );

      const proof = tree.getHexProof(leaf);

      await expect(
        claimInstance8.connect(test2).claim(
          ethers.utils.parseUnits("10", 6), //amount
          test2.address,
          proof, //merkle proof
          abi.encode(
            ["address", "uint256"],
            [test2.address, ethers.utils.parseUnits("200", 6)]
          ),
          {
            value: ethers.utils.parseEther("0.1"),
          }
        )
      ).to.be.reverted;
    });
  });

  describe("rollbackTokens()", () => {
    it("Should transfer back tokens to rollback address", async () => {
      await expect(
        claimInstance1
          .connect(admin)
          .rollbackTokens(ethers.utils.parseUnits("100", 6), rollback.address)
      ).not.to.be.reverted;
    });

    it("Should revert if balance is not sufficient", async () => {
      await expect(
        claimInstance1
          .connect(admin)
          .rollbackTokens(ethers.utils.parseUnits("1000", 6), rollback.address)
      ).to.be.reverted;
    });

    it("Should revert if caller is not admin", async () => {
      await expect(
        claimInstance1
          .connect(test1)
          .rollbackTokens(ethers.utils.parseUnits("100", 6), rollback.address)
      ).to.be.reverted;
    });
  });

  describe("changeRoot()", () => {
    it("Should change merkle root", async () => {
      await expect(
        claimInstance1
          .connect(admin)
          .changeRoot(
            "0xee068f44d79b0b5ec5c9fdce424d1cb399ed31b481f41d901b2d90447857ca89"
          )
      ).not.to.be.reverted;
    });

    it("Should revert if caller is not admin", async () => {
      await expect(
        claimInstance1
          .connect(test1)
          .changeRoot(
            "0xee068f44d79b0b5ec5c9fdce424d1cb399ed31b481f41d901b2d90447857ca89"
          )
      ).to.be.reverted;
    });
  });

  describe("changeMaxClaimAmount()", () => {
    it("Should change claim amount details", async () => {
      await expect(
        claimInstance1
          .connect(admin)
          .changeMaxClaimAmount(ethers.utils.parseUnits("1000", 6))
      ).not.to.be.reverted;
    });

    it("Should revert if caller is not admin", async () => {
      await expect(
        claimInstance1
          .connect(test1)
          .changeMaxClaimAmount(ethers.utils.parseUnits("1000", 6))
      ).to.be.reverted;
    });
  });

  describe("changeCooldownTime()", () => {
    it("Should change cooldown details", async () => {
      await expect(claimInstance1.connect(admin).changeCooldownTime(100)).not.to
        .be.reverted;
    });

    it("Should revert if caller is not admin", async () => {
      await expect(claimInstance1.connect(test1).changeCooldownTime(100)).to.be
        .reverted;
    });
  });

  describe("depositTokens()", () => {
    it("Should change cooldown details", async () => {
      await usdcContract
        .connect(admin)
        .approve(claimInstance1.address, ethers.utils.parseUnits("4000", 6));
      await expect(
        claimInstance1
          .connect(admin)
          .depositTokens(ethers.utils.parseUnits("2000", 6), root)
      ).not.to.be.reverted;
    });

    it("Should revert if caller is not admin", async () => {
      await expect(
        claimInstance1
          .connect(test1)
          .depositTokens(ethers.utils.parseUnits("2000", 6), root)
      ).to.be.reverted;
    });
  });

  describe("claimAllPending()", () => {
    it("Should claim all pendings", async () => {
      await claimInstance9.connect(user1).claim(
        ethers.utils.parseUnits("10", 6), //amount
        user1.address,
        [],
        "0x",
        {
          value: ethers.utils.parseEther("0.1"),
        }
      );
      await claimInstance9.connect(user1).claim(
        ethers.utils.parseUnits("90", 6), //amount
        user1.address,
        [],
        "0x",
        {
          value: ethers.utils.parseEther("0.1"),
        }
      );
      await time.increase(2200);
      await expect(claimInstance9.connect(user1).claimAllPending(user1.address))
        .not.to.be.reverted;
    });
  });

  describe("changeStartAndEndTime()", () => {
    it("Should change start and end time", async () => {
      await expect(
        claimInstance1.connect(admin).changeStartAndEndTime(100, 1000)
      ).not.to.be.reverted;
    });

    it("Should revert if caller is not admin", async () => {
      await expect(
        claimInstance1.connect(test1).changeStartAndEndTime(100, 1000)
      ).to.be.reverted;
    });
  });
});
