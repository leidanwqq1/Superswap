// SPDX-License-Identifier: Dan Lei
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract WBTC is ERC20 {
    constructor() ERC20("WBTC Coin", "WBTC") {}
    function faucet(address to, uint amount) external {
        _mint(to, amount);
    }
}