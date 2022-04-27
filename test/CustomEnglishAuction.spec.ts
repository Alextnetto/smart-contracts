/* eslint-disable node/no-missing-import */
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { MyNFT } from "../typechain";
import { CustomEnglishAuction } from "../typechain/CustomEnglishAuction";
import { MyToken } from "../typechain/MyToken";

describe("CustomEnglishAuction", function () {
  let auction: CustomEnglishAuction;
  let token: MyToken;
  let nft: MyNFT;

  let owner: SignerWithAddress;
  let bidder: SignerWithAddress;
  let hacker: SignerWithAddress;

  const startingPrice = 100;
  const nftId = 1;

  beforeEach(async () => {
    const MyNFT = await ethers.getContractFactory("MyNFT");
    nft = await MyNFT.deploy();
    await nft.deployed();

    [owner, bidder, hacker] = await ethers.getSigners();

    const NewToken = await ethers.getContractFactory("MyToken");
    token = await NewToken.deploy();
    await token.deployed();

    const CustomEnglishAuction = await ethers.getContractFactory(
      "CustomEnglishAuction"
    );
    auction = await CustomEnglishAuction.deploy(
      nft.address,
      nftId,
      token.address,
      startingPrice
    );
    await auction.deployed();
  });

  it("Should revert if address provided in contructor not a contract", async function () {
    const CustomEnglishAuction = await ethers.getContractFactory(
      "CustomEnglishAuction"
    );
    await expect(
      CustomEnglishAuction.deploy(
        bidder.address,
        nftId,
        token.address,
        startingPrice
      )
    ).to.revertedWith("Address is not a contract");

    await expect(
      CustomEnglishAuction.deploy(
        nft.address,
        nftId,
        bidder.address,
        startingPrice
      )
    ).to.revertedWith("Address is not a contract");
  });

  it("Should only owner of contract call addAcceptedToken", async function () {
    await expect(auction.connect(hacker).startAuction()).to.revertedWith(
      "Not the owner of the auction"
    );
  });

  it("Should only owner of contract call startAuction", async function () {
    await expect(auction.connect(hacker).startAuction()).to.revertedWith(
      "Not the owner of the auction"
    );
  });

  it("Should highest bid be equal to starting price", async function () {
    expect(await auction.connect(owner).getHighestBid()).to.equal(
      startingPrice
    );
  });
});
