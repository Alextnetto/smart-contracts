import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ethers } from "hardhat";
// eslint-disable-next-line node/no-missing-import
import { CustomEnglishAuction } from "../typechain/CustomEnglishAuction";

describe("CustomEnglishAuction", function () {
  let auction: CustomEnglishAuction;
  let owner: SignerWithAddress;
  let bidder: SignerWithAddress;
  let hacker: SignerWithAddress;

  const startingPrice = 100;
  const tokenId = 1;

  beforeEach(async () => {
    const MyNFT = await ethers.getContractFactory("MyNFT");
    const nft = await MyNFT.deploy();

    [owner, bidder, hacker] = await ethers.getSigners();

    const CustomEnglishAuction = await ethers.getContractFactory(
      "CustomEnglishAuction"
    );

    auction = await CustomEnglishAuction.deploy(
      nft.address,
      tokenId,
      startingPrice
    );
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

  it("Should revert if address provided in contructor not a contract", async function () {
    const CustomEnglishAuction = await ethers.getContractFactory(
      "CustomEnglishAuction"
    );
    await expect(
      CustomEnglishAuction.deploy(bidder.address, tokenId, startingPrice)
    ).to.revertedWith("Address is not a contract");
  });
});
