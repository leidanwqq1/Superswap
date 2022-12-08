// SPDX-License-Identifier: Dan Lei
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract INCH is ERC20 {
    constructor() ERC20("INCH Coin", "INCH") {}
    function faucet(address to, uint amount) external {
        _mint(to, amount);
    }
}