// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Payments {
    mapping(address => uint256) private balances;

    event Deposit(address indexed account, uint256 amount);
    event Release(address indexed account, uint256 amount);

    function deposit() external payable {
        require(msg.value > 0, "Deposit amount must be greater than 0");
        balances[msg.sender] += msg.value;
        emit Deposit(msg.sender, msg.value);
    }

    function getBalance(address account) external view returns (uint256) {
        return balances[account];
    }

    function release(uint256 amount) external {
        require(amount > 0, "Release amount must be greater than 0");
        require(balances[msg.sender] >= amount, "Insufficient balance");

        balances[msg.sender] -= amount;
        payable(msg.sender).transfer(amount);
        emit Release(msg.sender, amount);
    }
}
