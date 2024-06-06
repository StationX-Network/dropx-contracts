pragma solidity ^0.8.18;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Disburse {
    using SafeERC20 for IERC20;

    constructor() {}

    function disburseNative(address[] calldata recipients, uint256[] calldata values) external payable {
        for (uint256 i = 0; i < recipients.length; i++) {
            payable(recipients[i]).transfer(values[i]);
        }

        uint256 balance = address(this).balance;
        if (balance > 0) payable(msg.sender).transfer(balance);
    }

    function disburseERC20(IERC20 token, address[] calldata recipients, uint256[] calldata values) external {
        uint256 len = recipients.length;

        for (uint256 i; i < len;) {
            token.safeTransferFrom(msg.sender, recipients[i], values[i]);

            unchecked {
                ++i;
            }
        }
    }
}
