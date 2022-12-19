import { ethers } from "ethers";
import SuperswapFactory from "../contracts/superswapFactory.json";
import SuperswapRouter from "../contracts/superswapRouter.json";
import WETH from "../contracts/weth.json";
import ERC20Tokens from "../contracts/tokens.json";

const getWETHContract = (signer) => {
    return new ethers.Contract(WETH.address, WETH.abi, signer);
}

const getERC20Contract = (address, signer) => {
    return new ethers.Contract(address, ERC20Tokens.abi, signer);
}

const getTokens = () => {
    let tokens = [{name:"ETH", address:undefined}, {name:"WETH", address:WETH.address}];
    for(let ticker in ERC20Tokens.addresses) {
        tokens = [...tokens, {
            name:ticker,
            address:ERC20Tokens.addresses[ticker]
        }];
    }
    return tokens;
}

const getBalance = async (token, address, signer) => {
    if(signer === undefined || address === undefined || token.name === undefined){
        return 0;
    }
    let balance;
    if(token.name === "ETH"){
        balance = await signer.getBalance();
    }else if(token.name === "WETH"){
        const weth = await getWETHContract(signer);
        balance = await weth.balanceOf(address);
    }else{
        const erc20 = await getERC20Contract(token.address, signer);
        balance = await erc20.balanceOf(address);
    }
    return parseFloat(ethers.utils.formatEther(balance)).toFixed(6);  
}

const getLiquidityBalance = async (activeItemIn0, activeItemIn1, provider, signerAddr) => {
    if(signerAddr === undefined || activeItemIn0.name === undefined || activeItemIn1.name === undefined){
        return 0;
    }
    const token0 = activeItemIn0.name === "ETH" ? WETH.address : activeItemIn0.address;
    const token1 = activeItemIn1.name === "ETH" ? WETH.address : activeItemIn1.address;
    if(token0 === token1) {
        return 0;
    }
    const factory = new ethers.Contract(SuperswapFactory.address, SuperswapFactory.abi, provider);
    const pairAddr = await factory.getPair(token0, token1);
    if(pairAddr === "0x0000000000000000000000000000000000000000"){
        return 0;
    }
    const pairAbi = ["function balanceOf(address account) public view returns (uint256)"];
    const pair = new ethers.Contract(pairAddr, pairAbi, provider);
    const balance = await pair.balanceOf(signerAddr);
    return parseFloat(ethers.utils.formatEther(balance)).toFixed(6);  
}

const getAmountsIn = async (provider, activeItemIn, activeItemOut, amountOut) => {
    if(provider === undefined || 
       activeItemIn.name === undefined || 
       activeItemOut.name === undefined ||
       amountOut <= 0){
        return 0;
    }
    const router = new ethers.Contract(SuperswapRouter.address, SuperswapRouter.abi, provider);
    const path = [activeItemIn.address, activeItemOut.address];
    if(activeItemIn.name === "ETH"){
        path[0] = WETH.address;
    }
    if(activeItemOut.name === "ETH"){
        path[1] = WETH.address;
    }
    if(path[0] === path[1]){
        return parseFloat(amountOut).toFixed(6);
    }
    const amount = await router.getAmountsIn(
        ethers.utils.parseEther(amountOut).toString(),
        path
    );
    return parseFloat(ethers.utils.formatEther(amount[0].toString())).toFixed(6);
}

const  getAmountsOut = async (provider, activeItemIn, activeItemOut, amountIn) => {
    if(provider === undefined || 
       activeItemIn.name === undefined || 
       activeItemOut.name === undefined ||
       amountIn <= 0){
        return 0;
    }
    const router = new ethers.Contract(SuperswapRouter.address, SuperswapRouter.abi, provider);
    const path = [activeItemIn.address, activeItemOut.address];
    if(activeItemIn.name === "ETH"){
        path[0] = WETH.address;
    }
    if(activeItemOut.name === "ETH"){
        path[1] = WETH.address;
    }
    if(path[0] === path[1]){
        return parseFloat(amountIn).toFixed(6);
    }
    const amount = await router.getAmountsOut(
        ethers.utils.parseEther(amountIn).toString(),
        path
    );
    
    return parseFloat(ethers.utils.formatEther(amount[1].toString())).toFixed(6);
}

const swapTokenWithContract = async (signer, signerAddr, getAmountsMode, activeItemIn, activeItemOut, amountIn, amountOut, slippageAmount, deadlineMinutes) => {
    const router = new ethers.Contract(SuperswapRouter.address, SuperswapRouter.abi, signer);
    const weth = new ethers.Contract(WETH.address, WETH.abi, signer);
    const path = [activeItemIn.address, activeItemOut.address];
    const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60 * deadlineMinutes).toString();
    const slippage = parseFloat(slippageAmount).toFixed(2);
    if(activeItemIn.name === "ETH" && activeItemOut.name === "WETH"){
        const amount = (getAmountsMode === "AmountIn") ? amountIn : amountOut;
        await weth.deposit({value: ethers.utils.parseEther(amount)});
        return;
    }else if(activeItemIn.name === "WETH" && activeItemOut.name === "ETH"){
        const amount = (getAmountsMode === "AmountIn") ? amountIn : amountOut;
        await weth.withdraw(ethers.utils.parseEther(amount));
        return;
    }
    if(getAmountsMode === "AmountIn"){
        const amountOutMin = ethers.utils.parseEther(amountOut).mul(10000 - 100 * slippage).div(10000).toString();
        if(activeItemIn.name === "ETH"){
            path[0] = WETH.address;
            await router.swapExactETHForToken(
                amountOutMin,
                path,
                signerAddr,
                deadline,
                {gasLimit: 3e7, value: ethers.utils.parseEther(amountIn)}
            );
        }else if(activeItemOut.name === "ETH"){
            path[1] = WETH.address;
            const erc20 = await getERC20Contract(activeItemIn.address, signer);
            await erc20.approve(SuperswapRouter.address, ethers.utils.parseEther(amountIn).toString());
            await router.swapExactTokenForETH(
                ethers.utils.parseEther(amountIn).toString(),
                amountOutMin,
                path,
                signerAddr,
                deadline,
                {gasLimit: 3e7}
            );
        }else{
            const erc20 = await getERC20Contract(activeItemIn.address, signer);
            await erc20.approve(SuperswapRouter.address, ethers.utils.parseEther(amountIn).toString());
            await router.swapExactTokenForToken(
                ethers.utils.parseEther(amountIn).toString(),
                amountOutMin,
                path,
                signerAddr,
                deadline,
                {gasLimit: 3e7}
            );
        }
    }else if(getAmountsMode === "AmountOut"){
        const amountInMax = ethers.utils.parseEther(amountIn).mul(10000 + 100 * slippage).div(10000).toString();
        if(activeItemIn.name === "ETH"){
            path[0] = WETH.address;
            await router.swapETHForExactToken(
                ethers.utils.parseEther(amountOut).toString(),
                path,
                signerAddr,
                deadline,
                {gasLimit: 3e7, value: amountInMax}
            );
        }else if(activeItemOut.name === "ETH"){
            path[1] = WETH.address;
            const erc20 = await getERC20Contract(activeItemIn.address, signer);
            await erc20.approve(SuperswapRouter.address, amountInMax);
            await router.swapTokenForExactETH(
                ethers.utils.parseEther(amountOut).toString(),
                amountInMax,
                path,
                signerAddr,
                deadline,
                {gasLimit: 3e7}
            );
        }else{
            const erc20 = await getERC20Contract(activeItemIn.address, signer);
            await erc20.approve(SuperswapRouter.address, amountInMax);
            await router.swapTokenForExactToken(
                ethers.utils.parseEther(amountOut).toString(),
                amountInMax,
                path,
                signerAddr,
                deadline,
                {gasLimit: 3e7}
            );
        }
    }
    
}

const getItemPrice = async (provider, activeItemIn, activeItemOut, shouldExised) => {
    if(provider === undefined || 
       activeItemIn.name === undefined || 
       activeItemOut.name === undefined){
        return 0;
    }
    const token0 = (activeItemIn.address === undefined) ? WETH.address : activeItemIn.address;
    const token1 = (activeItemOut.address === undefined) ? WETH.address : activeItemOut.address;
    if(token0 === token1){
        return 1;
    }
    if(shouldExised === 0){
        const factory = new ethers.Contract(SuperswapFactory.address, SuperswapFactory.abi, provider);
        const pairAddr = await factory.getPair(token0, token1);
        if(pairAddr === "0x0000000000000000000000000000000000000000"){
            return 0;
        }
    }
    const router = new ethers.Contract(SuperswapRouter.address, SuperswapRouter.abi, provider);
    const [reserve0, reserve1] = await router.getResevers(token0, token1);
    if(!reserve0 || !reserve1){
        return 0;
    }
    // const price = parseFloat(ethers.BigNumber.from(reserve1.toString()).div(reserve0)).toFixed(6);
    const price = (parseFloat(ethers.utils.formatEther(reserve1.toString())) / parseFloat(ethers.utils.formatEther(reserve0.toString()))).toFixed(6);
    return price;
}

const addLiquidityWithContract = async (signer, signerAddr, activeItemIn0, activeItemIn1, amountIn0, amountIn1, slippageAmount, deadlineMinutes) => {
    const router = new ethers.Contract(SuperswapRouter.address, SuperswapRouter.abi, signer);
    const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60 * deadlineMinutes).toString();
    const slippage = parseFloat(slippageAmount).toFixed(2);
    const amount0Min = ethers.utils.parseEther(amountIn0).mul(10000 - 100 * slippage).div(10000).toString();
    const amount1Min = ethers.utils.parseEther(amountIn1).mul(10000 - 100 * slippage).div(10000).toString();
    // The pair of ETH and WETH isn't be here.
    if(activeItemIn0.name === "ETH"){
        const token1 = await getERC20Contract(activeItemIn1.address, signer);
        await token1.approve(SuperswapRouter.address, ethers.utils.parseEther(amountIn1).toString());
        await router.addLiquidityETH(
            activeItemIn1.address,
            ethers.utils.parseEther(amountIn1).toString(),
            amount1Min,
            amount0Min,
            signerAddr,
            deadline,
            {gasLimit: 3e7, value: ethers.utils.parseEther(amountIn0)}
        );
    }else if(activeItemIn1.name === "ETH"){
        const token0 = await getERC20Contract(activeItemIn0.address, signer);
        await token0.approve(SuperswapRouter.address, ethers.utils.parseEther(amountIn0).toString());
        await router.addLiquidityETH(
            activeItemIn0.address,
            ethers.utils.parseEther(amountIn0).toString(),
            amount0Min,
            amount1Min,
            signerAddr,
            deadline,
            {gasLimit: 3e7, value: ethers.utils.parseEther(amountIn1)}
        );
    }else {
        const token0 = await getERC20Contract(activeItemIn0.address, signer);
        await token0.approve(SuperswapRouter.address, ethers.utils.parseEther(amountIn0).toString());
        const token1 = await getERC20Contract(activeItemIn1.address, signer);
        await token1.approve(SuperswapRouter.address, ethers.utils.parseEther(amountIn1).toString());
        await router.addLiquidity(
            activeItemIn0.address,
            activeItemIn1.address,
            ethers.utils.parseEther(amountIn0).toString(),
            ethers.utils.parseEther(amountIn1).toString(),
            amount0Min,
            amount1Min,
            signerAddr,
            deadline,
            {gasLimit: 3e7}
        );
    }
}


const RemoveLiquidityWithContract = async (signer, signerAddr, activeItemIn0, activeItemIn1, liquidityAmount, slippageAmount, deadlineMinutes) => {
    const router = new ethers.Contract(SuperswapRouter.address, SuperswapRouter.abi, signer);
    const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60 * deadlineMinutes).toString();
    const slippage = parseFloat(slippageAmount).toFixed(2);
    const slippageAfterAmount = ethers.utils.parseEther(liquidityAmount).mul(10000 - 100 * slippage).div(10000);

    const factory = new ethers.Contract(SuperswapFactory.address, SuperswapFactory.abi, signer);
    const pairAbi = ["function approve(address spender, uint256 amount) public returns (bool)",
                     "function totalSupply() public view returns (uint256)"];
    const token0 = (activeItemIn0.address === undefined) ? WETH.address : activeItemIn0.address;
    const token1 = (activeItemIn1.address === undefined) ? WETH.address : activeItemIn1.address;
    const pairAddr = await factory.getPair(token0, token1);
    const pair = new ethers.Contract(pairAddr, pairAbi, signer);
    await pair.approve(SuperswapRouter.address, ethers.utils.parseEther(liquidityAmount).toString());
    const [reserve0, reserve1] = await router.getResevers(token0, token1);
    const totalSupply = await pair.totalSupply();
    const amount0Min = slippageAfterAmount.mul(reserve0).div(totalSupply).toString();
    const amount1Min = slippageAfterAmount.mul(reserve1).div(totalSupply).toString();
    // The pair of ETH and WETH isn't be here.
    if(activeItemIn0.name === "ETH"){
        await router.removeLiquidityETH(
            activeItemIn1.address,
            ethers.utils.parseEther(liquidityAmount).toString(),
            amount1Min,
            amount0Min,
            signerAddr,
            deadline,
            {gasLimit: 3e7}
        );
    }else if(activeItemIn1.name === "ETH"){
        await router.removeLiquidityETH(
            activeItemIn0.address,
            ethers.utils.parseEther(liquidityAmount).toString(),
            amount0Min,
            amount1Min,
            signerAddr,
            deadline,
            {gasLimit: 3e7}
        );
    }else {
        await router.removeLiquidity(
            activeItemIn0.address,
            activeItemIn1.address,
            ethers.utils.parseEther(liquidityAmount).toString(),
            amount0Min,
            amount1Min,
            signerAddr,
            deadline,
            {gasLimit: 3e7}
        );
    }
}

const getAllLiquidityBalance = async (provider, signerAddr) => {
    let tickerMap = new Map();
    tickerMap.set(WETH.address, "WETH");
    for(let ticker in ERC20Tokens.addresses) {
        const address = ERC20Tokens.addresses[ticker];
        tickerMap.set(address, ticker);
    }
    let balances = [];
    if(signerAddr === undefined){
        return balances;
    }
    const factory = new ethers.Contract(SuperswapFactory.address, SuperswapFactory.abi, provider);
    const number = await factory.getpairsLength();
    const pairAbi = ["function balanceOf(address account) public view returns (uint256)",
                     "function token0() public view returns(address)",
                     "function token1() public view returns(address)"];
    for(let index = 0; index < parseInt(number); index++){
        const pairAddr = await factory.allPairs(index);
        const pair = new ethers.Contract(pairAddr, pairAbi, provider);
        const token0 = await pair.token0();
        const token1 = await pair.token1();
        const balance = await pair.balanceOf(signerAddr);
        balances = [...balances, {token0:tickerMap.get(token0), token1:tickerMap.get(token1), balance:parseFloat(ethers.utils.formatEther(balance)).toFixed(6)}]
    }
    return balances;
}

const getWalletItemValue = async(provider, tokenIn, amount) => {
    if(amount <= 0 || tokenIn.name === undefined || provider === undefined){
        return 0;
    }
    const tokenWETH = {name:"WETH", address:WETH.address};
    const tokenUSDT = {name:"USDT", address:ERC20Tokens.addresses["USDT"]};
    const ETHPrice = await getItemPrice(provider, tokenWETH, tokenUSDT, 1);
   
    const itemPrice = await getItemPrice(provider, tokenIn, tokenWETH, 1);
    return parseFloat(ETHPrice * itemPrice * amount).toFixed(6);

}

export { getWETHContract, 
         getERC20Contract, 
         getTokens, 
         getBalance,
         getLiquidityBalance,
         getAmountsIn,
         getAmountsOut,
         swapTokenWithContract,
         getItemPrice,
         addLiquidityWithContract,
         RemoveLiquidityWithContract,
         getAllLiquidityBalance,
         getWalletItemValue
       };

