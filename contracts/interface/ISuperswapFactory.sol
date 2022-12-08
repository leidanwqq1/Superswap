// SPDX-License-Identifier: Dan Lei
pragma solidity ^0.8.0;

interface ISuperswapFactory {
    function getPair(address, address) external view returns(address);
    function allPairs(uint) external view returns(address);

    event CreatePair(address indexed token0, address indexed token1, address pair, uint index);

    function getpairsLength() external view returns(uint);

    function createPair(address tokenA, address tokenB) external;

}