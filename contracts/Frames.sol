// SPDX-License-Identifier: MIT
pragma solidity ^0.8.16;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract Frames is ReentrancyGuard {
    mapping(address => uint256) public lastClaimed;

    uint256 public coolDownPeriod = 120;

    uint256 public dailyDistributionLimit = 50 * 1e18;

    uint256 public startTime;

    uint256 public lastClaimedTimestamp;

    uint256 public claimedToday;

    address public FRAMES_TOKEN_ADDRESS =
        0x91F45aa2BdE7393e0AF1CC674FFE75d746b93567;

    address public DEGEN_TOKEN_ADDRESS =
        0x4ed4E862860beD51a9570b96d89aF5E1B0Efefed;

    address public FRAME_NFT_ADDRESS =
        0xf359B98ff4d36722f0c34E87809Be965b0ce3a70;

    address public DEGEN_HABERDASHERS_ADDRESS =
        0x85E7DF5708902bE39891d59aBEf8E21EDE91E8BF;

    address public DEGEN_PFP_ADDRESS =
        0x10E65619e75214cc6e8c2522a83acf8636CE9dFd;

    address public LIL_GENT_ADDRESS =
        0xe51D40144373BCc2C86B3c5370cD2c54Fc3d806e;

    address public MFERS_ADDRESS = 0xC57bded689c0c528a16ED435b073E4E9a10d85dC;

    uint256 private MIN_TOKEN_AMOUNT = 3;

    address private ALLOWED_WALLET = 0x16dCfe4197aa365ea4CdcD819F2F751a342eb454;

    address public owner;

    constructor() {
        owner = msg.sender;
        startTime = block.timestamp;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "No permission");
        _;
    }

    function canUserClaim(
        address _to,
        uint256 _isBased
    ) public view returns (bool) {
        uint256 tokenAmount = MIN_TOKEN_AMOUNT;

        if (IERC20(DEGEN_TOKEN_ADDRESS).balanceOf(_to) >= 1000000 * 1e18) {
            tokenAmount = tokenAmount * 10;
        } else if (IERC20(DEGEN_HABERDASHERS_ADDRESS).balanceOf(_to) > 0) {
            tokenAmount = tokenAmount * 9;
        } else if (IERC20(FRAME_NFT_ADDRESS).balanceOf(_to) > 0) {
            tokenAmount = tokenAmount * 8;
        } else if (IERC20(DEGEN_PFP_ADDRESS).balanceOf(_to) > 0) {
            tokenAmount = tokenAmount * 3;
        } else if (IERC20(LIL_GENT_ADDRESS).balanceOf(_to) > 0) {
            tokenAmount = tokenAmount * 3;
        } else if (IERC20(MFERS_ADDRESS).balanceOf(_to) > 0) {
            tokenAmount = tokenAmount * 2;
        } else if (_isBased == 1) {
            tokenAmount = tokenAmount * 2;
        }

        tokenAmount = tokenAmount * 1e18;

        if (claimedToday + tokenAmount > dailyDistributionLimit) {
            return false;
        } else if (lastClaimed[_to] + coolDownPeriod > block.timestamp) {
            return false;
        } else {
            return true;
        }
    }

    function sendFramesToken(address _to, uint256 _isBased) external {
        require(msg.sender == ALLOWED_WALLET, "No permission");
        require(
            lastClaimed[_to] + coolDownPeriod <= block.timestamp,
            "Already claimed"
        );

        uint256 tokenAmount = MIN_TOKEN_AMOUNT;

        if (IERC20(DEGEN_TOKEN_ADDRESS).balanceOf(_to) >= 1000000 * 1e18) {
            tokenAmount = tokenAmount * 10;
        } else if (IERC20(DEGEN_HABERDASHERS_ADDRESS).balanceOf(_to) > 0) {
            tokenAmount = tokenAmount * 9;
        } else if (IERC20(FRAME_NFT_ADDRESS).balanceOf(_to) > 0) {
            tokenAmount = tokenAmount * 8;
        } else if (IERC20(DEGEN_PFP_ADDRESS).balanceOf(_to) > 0) {
            tokenAmount = tokenAmount * 3;
        } else if (IERC20(LIL_GENT_ADDRESS).balanceOf(_to) > 0) {
            tokenAmount = tokenAmount * 3;
        } else if (IERC20(MFERS_ADDRESS).balanceOf(_to) > 0) {
            tokenAmount = tokenAmount * 2;
        } else if (_isBased == 1) {
            tokenAmount = tokenAmount * 2;
        }

        tokenAmount = tokenAmount * 1e18;

        require(
            tokenAmount <=
                IERC20(FRAMES_TOKEN_ADDRESS).balanceOf(address(this)),
            "Insufficient balance"
        );

        lastClaimedTimestamp = block.timestamp;
        if (lastClaimedTimestamp - startTime > coolDownPeriod) {
            claimedToday = 0;
            startTime = block.timestamp;
        }
        require(
            claimedToday + tokenAmount <= dailyDistributionLimit,
            "Limit done for the day"
        );

        lastClaimed[_to] = block.timestamp;

        claimedToday += tokenAmount;

        IERC20(FRAMES_TOKEN_ADDRESS).transfer(_to, tokenAmount);
    }

    function updateWallet(address _new) external onlyOwner {
        ALLOWED_WALLET = _new;
    }

    function updateMinAmount(uint256 _newMinAmount) external onlyOwner {
        MIN_TOKEN_AMOUNT = _newMinAmount;
    }

    function updateCoolDownPeriod(
        uint256 _newCoolDownPeriod
    ) external onlyOwner {
        coolDownPeriod = _newCoolDownPeriod;
    }

    function updateDistributionLimit(
        uint256 _newDistributionLimit
    ) external onlyOwner {
        dailyDistributionLimit = _newDistributionLimit;
    }

    function withdrawAll() external onlyOwner {
        IERC20(FRAMES_TOKEN_ADDRESS).transfer(
            msg.sender,
            IERC20(FRAMES_TOKEN_ADDRESS).balanceOf(address(this))
        );
    }
}
