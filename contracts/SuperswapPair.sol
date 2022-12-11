// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./libraries/Math.sol";

contract SuperswapPair is ERC20 {
    address public token0;
    address public token1;
    address public factory;
    uint private reserve0;
    uint private reserve1;

    event Mint(address indexed sender, address indexed to, uint amount0, uint amount1);
    event Burn(address indexed sender, address indexed to, uint amount0, uint amount1);
    event Swap(address indexed sender, address indexed to, uint amountIn0, uint amountIn1, uint amountOut0, uint amountOut1);

    constructor() ERC20("Superswap token", "Super"){
        factory = msg.sender;
    }

    function initialize(address _token0, address _token1) external {
        require(factory == msg.sender, "should be initialized by factory.");
        require(_token0 != _token1, "should be different tokens.");
        address token = _token0 < _token1 ? _token0 : _token1;
        require(token != address(0), "should not be address(0)");
        token0 = _token0;
        token1 = _token1;
    }

    function getResevers() view public returns(uint _reserve0, uint _reserve1){
        return (reserve0, reserve1);
    }

    function _update(uint _balance0, uint _balance1) private {
        reserve0 = _balance0;
        reserve1 = _balance1;
    }

    function mint(address _to) external returns(uint liquidity){
        // 1.token to pair first!!!
        (uint _reserve0, uint _reserve1) = getResevers();
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));
        uint amount0 = balance0 - _reserve0;
        uint amount1 = balance1 - _reserve1;
        require(amount0 > 0 && amount1 > 0, "amount should be bigger than zero.");
        // 2.calculate amount
        uint _totalSupply = totalSupply();
        if(_totalSupply == 0) {
            liquidity = Math.sqrt(amount0 * amount1);
        }else{
            liquidity = Math.min(amount0 * _totalSupply / _reserve0, amount1 * _totalSupply / _reserve1);
        }
        require(liquidity > 0, "liquidity amount should be bigger than zero.");
        // 3.Lp to _to
        _mint(_to, liquidity);
        // 4.update reverses
        _update(balance0, balance1);
        emit Mint(msg.sender, _to, amount0, amount1);
    }

    function burn(address _to) external returns(uint amount0, uint amount1){
        // 1.Lp token to pair first!!!
        uint liquidity = balanceOf(address(this));
        require(liquidity > 0, "liquidity amount should be bigger than zero.");
        // 2.calculate amount
        (uint _reserve0, uint _reserve1) = getResevers();
        uint _totalSupply = totalSupply();
        amount0 = liquidity * _reserve0 / _totalSupply;
        amount1 = liquidity * _reserve1 / _totalSupply;
        require(amount0 > 0 && amount1 > 0, "amount should be bigger than zero.");
        IERC20(token0).transfer(_to, amount0);
        IERC20(token1).transfer(_to, amount1);
        // 3.Lp to burn
        _burn(address(this), liquidity);
        // 4.update reverses
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));
        _update(balance0, balance1);
        emit Burn(msg.sender, _to, amount0, amount1);
    }

    function swap(uint amountOut0, uint amountOut1, address _to) external {
        require(amountOut0 == 0 || amountOut1 == 0, "One of output amounts should be zero.");
        // 1. token to pair first!!!
        (uint _reserve0, uint _reserve1) = getResevers();
        // 2. token to _to
        if(amountOut0 > 0){
            IERC20(token0).transfer(_to, amountOut0);
        }
        if(amountOut1 > 0){
            IERC20(token1).transfer(_to, amountOut1);
        }
        uint balance0 = IERC20(token0).balanceOf(address(this));
        uint balance1 = IERC20(token1).balanceOf(address(this));

        uint amountIn0 = balance0 + amountOut0 - _reserve0;
        uint amountIn1 = balance1 + amountOut1 - _reserve1;
        // 2.check
        require(amountIn0 > 0 || amountIn1 > 0, "One of input amounts should be bigger than zero.");
        uint adjustBalance0 = balance0 * 1000 - amountIn0 * 3;
        uint adjustBalance1 = balance1 * 1000 - amountIn1 * 3;
        require(adjustBalance0 * adjustBalance1 >= _reserve0 * _reserve1 * 1000 ** 2, "check wether amount is correct.");
        _update(balance0, balance1);
        emit Swap(msg.sender, _to, amountIn0, amountIn1, amountOut0, amountOut1);
    }

}