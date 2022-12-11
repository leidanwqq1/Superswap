// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./interface/ISuperswapPair.sol";
import "./interface/ISuperswapFactory.sol";
import "./interface/IWETH.sol";

import "hardhat/console.sol";

contract SuperswapRouter {
    address factory;
    address weth;
    constructor(address _factory, address _weth){
        factory = _factory;
        weth = _weth;
    }

    modifier CorrectTime(uint deadline) {
        require(deadline > block.timestamp, "Shouldn't be timed out.");
        _;
    }

    receive() external payable {}

    // function getPairAddr(address tokenA, address tokenB) internal returns(address pair) {
    //     require(tokenA != tokenB, "tokens used to create pairs should be different.");
    //     (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    //     bytes32 salt = keccak256(abi.encodePacked(token0, token1));
    //     pair = address(uint160(uint(keccak256(abi.encodePacked(
    //         bytes1(0xff),
    //         factory,
    //         salt,
    //         keccak256(type(SuperswapPair).creationCode)
    //     )))));
    // }

    function getResevers(address token0, address token1) view public returns(uint reserve0, uint reserve1){
        require(token0 != token1, "tokens used to create pairs should be different.");
        address pair = ISuperswapFactory(factory).getPair(token0, token1);
        require(pair != address(0), "pairs should be created.");
        (uint _reverse0, uint _reserve1) = ISuperswapPair(pair).getResevers();
        (reserve0, reserve1) = token0 < token1 ? (_reverse0, _reserve1) : (_reserve1, _reverse0);
    }

    function quote(uint amount0, uint reserve0, uint reserve1) pure public returns(uint amount1) {
        require(amount0 > 0 && reserve0 > 0 && reserve1 > 0, "amount should be bigger than zero.");
        amount1 = amount0 * reserve1 / reserve0;
    }

    function _addLiquidity(
        address token0,
        address token1, 
        uint amountIn0, 
        uint amountIn1,
        uint amount0Min,
        uint amount1Min
    ) private returns(uint amount0, uint amount1) {
        if(ISuperswapFactory(factory).getPair(token0, token1) == address(0)){
            console.log("==== createPair ======");
            ISuperswapFactory(factory).createPair(token0, token1);
        }
        (uint reserve0, uint reserve1) = getResevers(token0, token1);
        if(reserve0 == 0 && reserve1 == 0) {
            console.log("==== reserve0 == 0 && reserve1 == 0 ======");
            (amount0, amount1) = (amountIn0, amountIn1);
        }else{
            uint amount1Optimal = quote(amountIn0, reserve0, reserve1);
            if(amount1Optimal <= amountIn1) {
                require(amount1Optimal >= amount1Min, "Insufficient amount of the sencond token.");
                (amount0, amount1) = (amountIn0, amount1Optimal);
            }else{
                uint amount0Optimal = quote(amountIn1, reserve1, reserve0);
                require(amount0Optimal <= amountIn0 && amount0Optimal >= amount0Min, "Insufficient amount of the first token.");
                (amount0, amount1) = (amount0Optimal, amountIn1);
            }
        }
    }

    // need to approve.
    function addLiquidity(
        address token0,
        address token1, 
        uint amountIn0, 
        uint amountIn1,
        uint amount0Min,
        uint amount1Min,
        address to,
        uint deadline
    ) external CorrectTime(deadline) returns(uint liquidity) {
        // 1.calculate amounts of two tokens.
        (uint amount0, uint amount1) = _addLiquidity(token0, token1, amountIn0, amountIn1, amount0Min, amount1Min);
        // 2.transfer to pair
        console.log("amount: is %s %s", amount0, amount1);
        address pair = ISuperswapFactory(factory).getPair(token0, token1);
        console.log("pair: %s", pair);
        IERC20(token0).transferFrom(msg.sender, pair, amount0);
        IERC20(token1).transferFrom(msg.sender, pair, amount1);
        // 3.mint
        liquidity = ISuperswapPair(pair).mint(to);
        console.log("liquidity balance is %s", liquidity);
    }

     // need to approve.
    function addLiquidityETH(
        address token,
        uint amountIn,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable CorrectTime(deadline) returns(uint liquidity) {
        // 1.calculate amounts of two tokens.
        (uint amount0, uint amount1) = _addLiquidity(token, weth, amountIn, msg.value, amountTokenMin, amountETHMin);
        // 2.transfer to pair
        address pair = ISuperswapFactory(factory).getPair(token, weth);
        IERC20(token).transferFrom(msg.sender, pair, amount0);
        IWETH(weth).deposit{value: amount1}();
        IWETH(weth).transfer(pair, amount1);
        // 3.mint
        liquidity = ISuperswapPair(pair).mint(to);
        // 4.payback
        if(msg.value > amount1){
            payable(msg.sender).transfer(msg.value - amount1);
        }
    }

    // need to approve.
    function removeLiquidity(
        address token0,
        address token1, 
        uint liquidity,
        uint amount0Min,
        uint amount1Min,
        address to,
        uint deadline
    ) external CorrectTime(deadline) returns(uint amount0, uint amount1) {
        address pair = ISuperswapFactory(factory).getPair(token0, token1);
        require(pair != address(0), "pairs should be created.");
        require(ISuperswapPair(pair).balanceOf(msg.sender) >= liquidity, "Insufficient balance.");
        ISuperswapPair(pair).transferFrom(msg.sender, pair, liquidity);
        (uint amountA, uint amountB) = ISuperswapPair(pair).burn(to);
        (amount0, amount1) = token0 < token1 ? (amountA, amountB) : (amountB, amountA);
        require(amount0 >= amount0Min && amount1 >= amount1Min, "Insufficient output.");
    }

    // need to approve.
    function removeLiquidityETH(
        address token,
        uint liquidity,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external CorrectTime(deadline) returns(uint amount0, uint amount1) {
        address pair = ISuperswapFactory(factory).getPair(token, weth);
        require(pair != address(0), "pairs should be created.");
        require(ISuperswapPair(pair).balanceOf(msg.sender) >= liquidity, "Insufficient balance.");
        ISuperswapPair(pair).transferFrom(msg.sender, pair, liquidity);
        (uint amountA, uint amountB) = ISuperswapPair(pair).burn(address(this));
        (amount0, amount1) = token < weth ? (amountA, amountB) : (amountB, amountA);
        require(amount0 >= amountTokenMin && amount1 >= amountETHMin, "Insufficient output.");
        IERC20(token).transfer(to, amount0);
        IWETH(weth).withdraw(amount1);
        payable(to).transfer(amount1);
    }

    function getAmountOut(uint amountIn, uint reserveIn, uint reserveOut) public pure returns(uint amountOut) {
        require(amountIn > 0, "amount of input should be bigger than zero.");
        require(reserveIn > 0 && reserveOut > 0, "reverses should be bigger than zero.");
        uint amountInWithFee = amountIn * 997;
        amountOut = (amountInWithFee * reserveOut) / (reserveIn * 1000 + amountInWithFee);
    }

    function getAmountsOut(
        uint amountIn,
        address[] memory path
    ) public view returns(uint[] memory amounts){
        require(path.length >= 2, "invalid path.");
        amounts = new uint[](path.length - 1);
        uint length = amounts.length;
        uint _amountIn = amountIn;
        for(uint index = 0; index < length; index++){
            (uint reserveIn, uint reserveOut) = getResevers(path[index], path[index + 1]);
            amounts[index] = getAmountOut(_amountIn, reserveIn, reserveOut);
            _amountIn = amounts[index];
        }
    }

    function _swap(address[] memory path, uint[] memory amounts, address to) private {
        uint length = amounts.length;
        for(uint index = 0; index < length; index++){
            address pair = ISuperswapFactory(factory).getPair(path[index], path[index + 1]);
            require(pair != address(0), "pairs should be created.");
            address _to = index == (length - 1) ? to : ISuperswapFactory(factory).getPair(path[index + 1], path[index + 2]);
            (uint amountOut0, uint amountOut1) = path[index] < path[index + 1] ? (uint(0), amounts[index]) : (amounts[index], uint(0));
            ISuperswapPair(pair).swap(amountOut0, amountOut1, _to);
        }
    }

    function swapExactTokenForToken(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external CorrectTime(deadline) returns(uint[] memory amounts){
        amounts = getAmountsOut(amountIn, path);
        require(amounts[amounts.length - 1] >= amountOutMin, "Insufficient amount.");
        IERC20(path[0]).transferFrom(msg.sender, ISuperswapFactory(factory).getPair(path[0], path[1]), amountIn);
        _swap(path, amounts, to);
    }

    function swapExactTokenForETH(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external CorrectTime(deadline) returns(uint[] memory amounts){
        require(path[path.length - 1] == weth, "the last token should be WETH.");
        amounts = getAmountsOut(amountIn, path);
        uint length = amounts.length;
        require(amounts[length - 1] >= amountOutMin, "Insufficient amount.");
        IERC20(path[0]).transferFrom(msg.sender, ISuperswapFactory(factory).getPair(path[0], path[1]), amountIn);
        _swap(path, amounts, address(this));
        IWETH(weth).withdraw(amounts[length - 1]);
        payable(to).transfer(amounts[length - 1]);
    }

    function swapExactETHForToken(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable CorrectTime(deadline) returns(uint[] memory amounts){
        require(path[0] == weth, "the first token should be WETH.");
        console.log("swapExactETHForToken msg.value: %s", msg.value);
        amounts = getAmountsOut(msg.value, path);
        uint length = amounts.length;
        require(amounts[length - 1] >= amountOutMin, "Insufficient amount.");
        IWETH(weth).deposit{value: msg.value}();
        IWETH(weth).transfer(ISuperswapFactory(factory).getPair(path[0], path[1]), msg.value);
        _swap(path, amounts, to);
    }

    function getAmountIn(uint amountOut, uint reserveIn, uint reserveOut) public pure returns(uint amountIn) {
        require(amountOut > 0, "amount of output should be bigger than zero.");
        require(reserveIn > 0 && reserveOut > 0, "reverses should be bigger than zero.");
        amountIn = (amountOut * reserveIn * 1000) / ((reserveOut - amountOut) * 997) + 1;
    }

    function getAmountsIn(
        uint amountOut,
        address[] calldata path
    ) public view returns(uint[] memory amounts){
        require(path.length >= 2, "invalid path.");
        amounts = new uint[](path.length - 1);
        uint _amountOut = amountOut;
        console.log("amountOut: is %s", amountOut);
        for(uint index = amounts.length; index >= 1; index--){
            (uint reserveIn, uint reserveOut) = getResevers(path[index - 1], path[index]);
            amounts[index - 1] = getAmountIn(_amountOut, reserveIn, reserveOut);
            _amountOut = amounts[index - 1];
        }
    }

    function swapTokenForExactToken(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external CorrectTime(deadline) returns(uint[] memory amounts){
        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "Insufficient amount.");
        IERC20(path[0]).transferFrom(msg.sender, ISuperswapFactory(factory).getPair(path[0], path[1]), amounts[0]);
        _swap(path, amounts, to);
    }

    function swapTokenForExactETH(
        uint amountOut,
        uint amountInMax,
        address[] calldata path,
        address to,
        uint deadline
    ) external CorrectTime(deadline) returns(uint[] memory amounts){
        require(path[path.length - 1] == weth, "the last token should be WETH.");
        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= amountInMax, "Insufficient amount.");
        IERC20(path[0]).transferFrom(msg.sender, ISuperswapFactory(factory).getPair(path[0], path[1]), amounts[0]);
        _swap(path, amounts, address(this));
        IWETH(weth).withdraw(amountOut);
        payable(to).transfer(amountOut);
    }

    function swapETHForExactToken(
        uint amountOut,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable CorrectTime(deadline) returns(uint[] memory amounts){
        require(path[0] == weth, "the first token should be WETH.");
        amounts = getAmountsIn(amountOut, path);
        require(amounts[0] <= msg.value, "Insufficient amount.");
        IWETH(weth).deposit{value: amounts[0]}();
        IWETH(weth).transfer(ISuperswapFactory(factory).getPair(path[0], path[1]), amounts[0]);
        _swap(path, amounts, to);
        if(msg.value > amounts[0]){
            payable(to).transfer(msg.value - amounts[0]);
        }
    }

}