// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title RaceToken
 * @dev RACE token for game rewards
 */
contract RaceToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("Race Token", "RACE") {
        _mint(msg.sender, initialSupply);
    }
}