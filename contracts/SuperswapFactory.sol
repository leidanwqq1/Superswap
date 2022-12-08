// SPDX-License-Identifier: Dan Lei
pragma solidity ^0.8.0;
import "./SuperswapPair.sol";

contract SuperswapFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;

    event CreatePair(address indexed token0, address indexed token1, address pair, uint index);

    function getpairsLength() external view returns(uint) {
        return allPairs.length;
    }

    function createPair(address tokenA, address tokenB) external {
        // 1. check
        require(getPair[tokenA][tokenB] == address(0), "already created!");
        require(tokenA != tokenB, "tokens used to create pairs should be different.");
        (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
        require(token0 != address(0), "tokens used to create pairs shouldn't be address(0).");
        // create
        bytes32 salt = keccak256(abi.encodePacked(token0, token1));
        SuperswapPair pair = new SuperswapPair{salt: salt}();
        pair.initialize(token0, token1);
        address pairAddr = address(pair);
        getPair[token0][token1] = pairAddr;
        getPair[token1][token0] = pairAddr;
        allPairs.push(pairAddr);
        emit CreatePair(token0, token1, pairAddr, allPairs.length);
    }

}