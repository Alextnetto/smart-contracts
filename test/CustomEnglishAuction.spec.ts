import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { CustomEnglishAuction } from "../typechain/CustomEnglishAuction";

describe("CustomEnglishAuction", function () {
  let auction: CustomEnglishAuction;
  let owner: SignerWithAddress;
  let bidder: SignerWithAddress;
  let hacker: SignerWithAddress;

  const startingPrice = 100;

  beforeEach(async () => {
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const nft = await MyNFT.deploy();

    [owner, bidder, hacker] = await ethers.getSigners();

    const CustomEnglishAuction = await ethers.getContractFactory(
      "CustomEnglishAuction"
    );

    auction = await CustomEnglishAuction.deploy(nft.address, 1, startingPrice);
    await auction.deployed();
  });

  it("Should highest bid be equal to starting price", async function () {
    expect(await auction.getHighestBid()).to.equal(startingPrice);
  });

  it("Should only owner of contract call startAuction", async function () {
    await expect(auction.connect(hacker).startAuction()).to.revertedWith(
      "Not the owner of the auction"
    );
  });

  it("Should only owner of contract call startAuction", async function () {
    await expect(auction.connect(owner).startAuction()).to.revertedWith(
      "Not the owner of the auction"
    );
  });
});
