const fs = require('fs');
const { ethers } = require('hardhat');

async function main() {
  console.log("1.information of signer.");
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying contracts with the account: ${deployer.address}`);
  const balance = await deployer.getBalance();
  console.log(`Account balance: ${balance.toString()}`);

  console.log("\n2.deploy SuperswapFactory.");
  const SuperswapFactory = await ethers.getContractFactory("SuperswapFactory");
  const superswapFactory = await SuperswapFactory.deploy();
  await superswapFactory.deployed();
  console.log(
    `SuperswapFactory deployed to ${superswapFactory.address}`
  );

  console.log("\n3.deploy WETH && SuperswapRouter.");
  const WETH = await ethers.getContractFactory("WETH");
  const weth = await WETH.deploy();
  await weth.deployed();
  console.log(
    `WETH deployed to ${weth.address}`
  );

  const SuperswapRouter = await ethers.getContractFactory("SuperswapRouter");
  const superswapRouter = await SuperswapRouter.deploy(superswapFactory.address, weth.address);
  await superswapRouter.deployed();
  console.log(
    `SuperswapRouter deployed to ${superswapRouter.address}`
  );

  
  console.log("\n4.deploy ERC20.");
  const tokens = ["DAI", "LINK", "INCH", "UNI", "USDT", "USDC", "WBTC"];
  const [Dai, Link, Inch, Uni, Usdt, Usdc, Wbtc] = await Promise.all(
    tokens.map(token => ethers.getContractFactory(token))
  );
  const [dai, link, inch, uni, usdt, usdc, wbtc] = await Promise.all(
    [Dai, Link, Inch, Uni, Usdt, Usdc, Wbtc].map(contract => contract.deploy())
  );
  await Promise.all(
    [dai, link, inch, uni, usdt, usdc, wbtc].map(contract => contract.deployed())
  );
  console.log(
    `[Dai, Link, Inch, Uni, Usdt, Usdc, Wbtc] deployed.`
  );

  console.log("\n5.store abi.");
  const ERC20TokensData = {
    addresses: {
      DAI: dai.address, 
      LINK: link.address, 
      INCH: inch.address, 
      UNI: uni.address, 
      USDT: usdt.address, 
      USDC: usdc.address, 
      WBTC: wbtc.address
    },
    abi: JSON.parse(dai.interface.format('json'))
  };
  fs.writeFileSync('frontend/src/contracts/tokens.json', JSON.stringify(ERC20TokensData));
  console.log("The abi of ERC20Tokens is stored.");

  const superswapFactoryData = {
    address: superswapFactory.address,
    abi: JSON.parse(superswapFactory.interface.format('json'))
  };
  fs.writeFileSync('frontend/src/contracts/superswapFactory.json', JSON.stringify(superswapFactoryData));
  console.log("The abi of superswapFactory is stored.");

  const wethData = {
    address: weth.address,
    abi: JSON.parse(weth.interface.format('json'))
  };
  fs.writeFileSync('frontend/src/contracts/weth.json', JSON.stringify(wethData));
  console.log("The abi of weth is stored.");

  const superswapRouterData = {
    address: superswapRouter.address,
    abi: JSON.parse(superswapRouter.interface.format('json'))
  };
  fs.writeFileSync('frontend/src/contracts/superswapRouter.json', JSON.stringify(superswapRouterData));
  console.log("The abi of superswapRouter is stored.");

  console.log("\n6.facet.");
  const amount = ethers.utils.parseUnits("10000", 18).toString();
  await Promise.all(
    [dai, link, inch, uni, usdt, usdc, wbtc].map(contract => contract.faucet(deployer.address, amount))
  );
  console.log("facet success!");

  console.log("\n7.get WETH.");
  await weth.deposit({value: ethers.utils.parseEther("10").toString()});
  const balanceWETH = await weth.balanceOf(deployer.address);
  console.log(balanceWETH);
  console.log(`WETH balance ${ethers.utils.formatEther(balanceWETH).toString()} !`);

  console.log("\n8.create pairs.");
  const time = Date.now() + 60000;
  const deadline = (ethers.BigNumber.from(time)).toString();
  await Promise.all([
    weth.approve(superswapRouter.address, ethers.utils.parseEther("7").toString()),
    dai.approve(superswapRouter.address, ethers.utils.parseEther("1167").toString()),
    link.approve(superswapRouter.address, ethers.utils.parseEther("172").toString()),
    inch.approve(superswapRouter.address, ethers.utils.parseEther("2271").toString()),
    uni.approve(superswapRouter.address, ethers.utils.parseEther("222").toString()),
    usdt.approve(superswapRouter.address, ethers.utils.parseEther("1168").toString()),
    usdc.approve(superswapRouter.address, ethers.utils.parseEther("1168").toString()),
    wbtc.approve(superswapRouter.address, ethers.utils.parseEther("0.07").toString())
  ]);
  console.log("approve success!");
  await superswapRouter.addLiquidity(
    weth.address, 
    dai.address,
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("1167").toString(),
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("1167").toString(),
    deployer.address,
    deadline
  );
  await superswapRouter.addLiquidity(
    weth.address, 
    link.address,
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("172").toString(),
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("172").toString(),
    deployer.address,
    deadline
  );
  await superswapRouter.addLiquidity(
    weth.address, 
    inch.address,
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("2271").toString(),
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("2271").toString(),
    deployer.address,
    deadline
  );
  await superswapRouter.addLiquidity(
    weth.address, 
    uni.address,
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("222").toString(),
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("222").toString(),
    deployer.address,
    deadline
  );
  await superswapRouter.addLiquidity(
    weth.address, 
    usdt.address,
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("1168").toString(),
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("1168").toString(),
    deployer.address,
    deadline
  );
  await superswapRouter.addLiquidity(
    weth.address, 
    usdc.address,
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("1168").toString(),
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("1168").toString(),
    deployer.address,
    deadline
  );
  await superswapRouter.addLiquidity(
    weth.address, 
    wbtc.address,
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("0.07").toString(),
    ethers.utils.parseEther("1").toString(),
    ethers.utils.parseEther("0.07").toString(),
    deployer.address,
    deadline
  );
  console.log("create pairs success!!");

 
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});