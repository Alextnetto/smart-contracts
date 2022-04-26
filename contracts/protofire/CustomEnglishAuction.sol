// SPDX-License-Identifier: MIT
pragma solidity 0.8.13;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/Address.sol";

contract CustomEnglishAuction {
    address private owner;
    mapping(address => bool) private acceptedTokens;

    uint256 private highestBid;
    address private highestBidToken;
    address private highestBidder;
    mapping(address => mapping(address => uint256)) private bids;

    IERC721 public immutable nft;
    uint256 public immutable nftId;

    uint32 private auctionFinishAt;
    bool public hasAuctionStarted;
    bool public hasAuctionFinished;

    event AuctionStarted();
    event NewBid(address indexed newHighestBidder, uint256 newHighestBid);
    event AuctionFinished(address indexed winnerBidder, uint256 winnerBid);
    event Withdraw(address indexed bidder, uint256 amount);

    constructor(
        address _nft,
        uint256 _nftId,
        uint256 _startingPrice
    ) {
        require(Address.isContract(_nft), "Address is not a contract");
        owner = msg.sender;
        nft = IERC721(_nft);
        nftId = _nftId;

        highestBid = _startingPrice;
        /// @dev Adding DAI address in Rinkeby
        addAcceptedToken(0x5592EC0cfb4dbc12D3aB100b257153436a1f0FEa);
    }

    /// @dev Save gas using
    function _onlyOwner() internal view {
        require(msg.sender == owner, "Not the owner of the auction");
    }

    modifier onlyOwner() {
        _onlyOwner();
        _;
    }

    /// @dev add new stablecoins tokens
    function addAcceptedToken(address newToken) public onlyOwner {
        acceptedTokens[newToken] = true;
    }

    /// @dev need to call approve in ERC721 contract
    function startAuction() public onlyOwner {
        require(!hasAuctionStarted, "Auction already started");
        nft.transferFrom(owner, address(this), nftId);
        auctionFinishAt = uint32(block.timestamp + 5 minutes);
        hasAuctionStarted = true;

        emit AuctionStarted();
    }

    function timeToFinish() public view returns (uint256) {
        require(hasAuctionStarted, "Auction not started");
        require(auctionFinishAt > block.timestamp, "Auction finished");

        return auctionFinishAt - block.timestamp;
    }

    function getHighestBid() public view returns (uint256) {
        return highestBid;
    }

    /// @dev need to call approve() in ERC20 contract
    function bid(address tokenAddress, uint256 amount) public {
        require(acceptedTokens[tokenAddress], "Token not accepted");
        require(auctionFinishAt > block.timestamp, "Auction finished");

        uint256 totalAmount = bids[tokenAddress][msg.sender] + amount;

        if (totalAmount > highestBid) {
            IERC20 token = IERC20(tokenAddress);
            token.transferFrom(msg.sender, address(this), amount);

            bids[tokenAddress][msg.sender] = totalAmount;
            highestBid = totalAmount;
            highestBidder = msg.sender;
            highestBidToken = tokenAddress;

            emit NewBid(highestBidder, highestBid);
        } else {
            revert("total amount of bids must be greather than highest bid");
        }
    }

    function finishAuction() public {
        require(block.timestamp > auctionFinishAt, "Auction on going");
        require(!hasAuctionFinished, "Auction already finished");

        hasAuctionFinished = true;

        nft.transferFrom(address(this), highestBidder, nftId);

        /// @dev highestBidToken isn't set if nobody bid higher then the starting price
        if (highestBidToken != address(0)) {
            IERC20 token = IERC20(highestBidToken);

            bids[highestBidToken][highestBidder] = 0;

            token.transfer(owner, highestBid);
        }

        emit AuctionFinished(highestBidder, highestBid);
    }

    function withdraw(address tokenAddress) public {
        require(acceptedTokens[tokenAddress], "Token not accepted");
        require(hasAuctionFinished, "Auction must have finished");

        IERC20 token = IERC20(tokenAddress);
        uint256 amount = bids[tokenAddress][msg.sender];

        if (amount > 0) {
            bids[tokenAddress][msg.sender] = 0;

            token.transfer(msg.sender, amount);

            emit Withdraw(msg.sender, amount);
        } else {
            revert("No funds in balance");
        }
    }
}
