// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ISuperswapPair {
   
    function name() external pure returns (string memory);
    function symbol() external pure returns (string memory);
    function decimals() external pure returns (uint8);
    function totalSupply() external view returns (uint);
    function balanceOf(address owner) external view returns (uint);
    function allowance(address owner, address spender) external view returns (uint);

    function approve(address spender, uint value) external returns (bool);
    function transfer(address to, uint value) external returns (bool);
    function transferFrom(address from, address to, uint value) external returns (bool);

    function token0() external view returns(address);
    function token1() external view returns(address);
    function factory() external view returns(address);

    event Mint(address indexed sender, address indexed to, uint amount0, uint amount1);
    event Burn(address indexed sender, address indexed to, uint amount0, uint amount1);
    event Swap(address indexed sender, address indexed to, uint amountIn0, uint amountIn1, uint amountOut0, uint amountOut1);


    function initialize(address _token0, address _token1) external;
    function getResevers() view external returns(uint _reserve0, uint _reserve1);
    function mint(address _to) external returns(uint liquidity);
    function burn(address _to) external returns(uint amount0, uint amount1);
    function swap(uint amountOut0, uint amountOut1, address _to) external;

}