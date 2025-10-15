// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Payments {
    address private owner;

    event Deposit(address indexed sender, uint256 amount);
    event Release(
        address indexed account1,
        address indexed account2,
        uint256 amount1,
        uint256 amount2
    );

    constructor() {
        owner = msg.sender;
    }

    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        emit Deposit(msg.sender, msg.value);
    }

    function getBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function release(address account1, address account2) external {
        require(msg.sender == owner, "Only owner can release funds");
        require(address(this).balance > 0, "No balance to release");
        require(account1 != address(0), "Account1 cannot be zero address");
        require(account2 != address(0), "Account2 cannot be zero address");

        uint256 totalBalance = address(this).balance;

        uint256 amount1 = (totalBalance * 80) / 100;
        uint256 amount2 = totalBalance - amount1;

        payable(account1).transfer(amount1);
        payable(account2).transfer(amount2);

        emit Release(account1, account2, amount1, amount2);
    }
}
