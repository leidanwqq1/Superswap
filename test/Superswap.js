const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Superswap", function () {
  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, _] = await ethers.getSigners();
    const SuperswapFactory = await ethers.getContractFactory("SuperswapFactory");
    const superswapFactory = await SuperswapFactory.deploy();
    await superswapFactory.deployed();

    const WETH = await ethers.getContractFactory("WETH");
    const weth = await WETH.deploy();
    await weth.deployed();

    const SuperswapRouter = await ethers.getContractFactory("SuperswapRouter");
    const superswapRouter = await SuperswapRouter.deploy(superswapFactory.address, weth.address);
    await superswapRouter.deployed();

    const Dai = await ethers.getContractFactory("DAI");
    const dai = await Dai.deploy();
    await dai.deployed();

    const amount = ethers.utils.parseUnits("10000", 18).toString();
    await dai.faucet(owner.address, amount);
    
    await weth.deposit({value: ethers.utils.parseEther("10").toString()});
    return { superswapFactory, weth, superswapRouter, dai, owner };
  }

  const sqrt = (input) => {
    y = parseInt(input);
    let z;
    if (y > 3) {
        z = y;
        x = y / 2 + 1;
        while (x < z) {
            z = x;
            x = (y / x + x) / 2;
        }
    } else if (y !== 0) {
        z = 1;
    }
    return parseFloat(ethers.utils.formatEther(z.toString())).toFixed(6);
  }

  describe("0.Deployment", function () {
    it("Should set the right factory and weth, and get right faucet amount.", async function () {
      const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
      expect(await superswapFactory.getpairsLength()).to.equal(0);
      expect(await superswapRouter.factory()).to.equal(superswapFactory.address);
      expect(await superswapRouter.weth()).to.equal(weth.address);
      expect(await dai.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("10000", 18).toString());
      expect(await weth.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("10").toString());
    });

  });

  describe("1.Add liquidity", function () {
    
    describe("1.1 addLiquidity", function () {
      it("[addLiquidity]: Shouldn't be timed out.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).toString();
        await expect(superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          owner.address,
          deadline
        )).revertedWith("Shouldn't be timed out.");
      });

      it("[addLiquidity]: tokens used to create pairs should be different.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        await expect(superswapRouter.addLiquidity(
          weth.address, 
          weth.address,
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          owner.address,
          deadline
        )).revertedWith("tokens used to create pairs should be different.");
      });

      it("[addLiquidity]: tokens used to create pairs shouldn't be address(0).", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        await expect(superswapRouter.addLiquidity(
          "0x0000000000000000000000000000000000000000", 
          dai.address,
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          owner.address,
          deadline
        )).revertedWith(`tokens used to create pairs shouldn't be address(0).`);
      });

      it("[addLiquidity]: amount should be bigger than zero.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        await expect(superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          0,
          ethers.utils.parseEther("1167").toString(),
          0,
          ethers.utils.parseEther("1167").toString(),
          owner.address,
          deadline
        )).revertedWith("amount should be bigger than zero.");
        await expect(superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          ethers.utils.parseEther("1").toString(),
          0,
          ethers.utils.parseEther("1").toString(),
          0,
          owner.address,
          deadline
        )).revertedWith("amount should be bigger than zero.");
      });

      it("[addLiquidity]: first time to create pair.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);
      });

      it("[addLiquidity]: pair exists, then fail to add liquidity.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        await expect(superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          ethers.utils.parseEther("1168").toString(),
          owner.address,
          deadline
        )).revertedWith("Input amount shouldn't be less than minimum amount.");
        await expect(superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          ethers.utils.parseEther("1166").toString(),
          amount0,
          ethers.utils.parseEther("1166").toString(),
          owner.address,
          deadline
        )).revertedWith("Insufficient amount of the first token.");
        await expect(superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          ethers.utils.parseEther("1170").toString(),
          amount0,
          ethers.utils.parseEther("1168").toString(),
          owner.address,
          deadline
        )).revertedWith("Insufficient amount of the sencond token.");
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);
      });

      it("[addLiquidity]: pair exists, then success to add liquidity.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)",
                         "function totalSupply() public view returns (uint256)",
                         "function getResevers() view public returns(uint _reserve0, uint _reserve1)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance0 = await pair.balanceOf(owner.address);
        
        const totalSupply = await pair.totalSupply();
        const [_reserve0, _reserve1] = await pair.getResevers();
        const [reserve0, reserve1] = weth.address < dai.address ? [_reserve0, _reserve1] : [_reserve1, _reserve0];
        const value0 = ethers.utils.parseEther("1").mul(totalSupply).div(reserve0);
        const value1 = ethers.utils.parseEther("1167").mul(totalSupply).div(reserve1);  
        const liquidity = value0 < value1 ? value0 : value1;
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const balance1 = await pair.balanceOf(owner.address);
        expect((parseFloat(ethers.utils.formatEther(balance1)) - parseFloat(ethers.utils.formatEther(balance0))).toFixed(6)). to.equal(parseFloat(ethers.utils.formatEther(liquidity)).toFixed(6));
      });
    });

    describe("1.2 addLiquidityETH", function () {
      it("[addLiquidityETH]: Shouldn't be timed out.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).toString();
        await expect(superswapRouter.addLiquidityETH(
          dai.address,
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("1")}
        )).revertedWith("Shouldn't be timed out.");
      });

      it("[addLiquidityETH]: tokens used to create pairs should be different.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        await expect(superswapRouter.addLiquidityETH(
          weth.address,
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("1")}
        )).revertedWith("tokens used to create pairs should be different.");
      });

      it("[addLiquidityETH]: tokens used to create pairs shouldn't be address(0).", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        await expect(superswapRouter.addLiquidityETH(
            "0x0000000000000000000000000000000000000000",
            ethers.utils.parseEther("1167").toString(),
            ethers.utils.parseEther("1167").toString(),
            ethers.utils.parseEther("1").toString(),
            owner.address,
            deadline,
            {value: ethers.utils.parseEther("1")}
        )).revertedWith(`tokens used to create pairs shouldn't be address(0).`);
      });

      it("[addLiquidityETH]: amount should be bigger than zero.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        await expect(superswapRouter.addLiquidityETH(
          dai.address,
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1167").toString(),
          0,
          owner.address,
          deadline
        )).revertedWith("amount should be bigger than zero.");
        await expect(superswapRouter.addLiquidityETH(
          dai.address,
          0,
          0,
          ethers.utils.parseEther("1").toString(),
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("1")}
        )).revertedWith("amount should be bigger than zero.");
      });

      it("[addLiquidityETH]: first time to create pair.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        await superswapRouter.addLiquidityETH(
          dai.address,
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("1")}
        );
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);
      });

      it("[addLiquidityETH]: pair exists, then fail to add liquidity.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidityETH(
          dai.address,
          amount1,
          amount1,
          amount0,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("1")}
        );
        await expect(superswapRouter.addLiquidityETH(
          dai.address,
          amount1,
          ethers.utils.parseEther("1168").toString(),
          amount0,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("1")}
        )).revertedWith("Input amount shouldn't be less than minimum amount.");
        await expect(superswapRouter.addLiquidityETH(
          dai.address,
          ethers.utils.parseEther("1166").toString(),
          ethers.utils.parseEther("1166").toString(),
          amount0,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("1")}
        )).revertedWith("Insufficient amount of the sencond token.");
        await expect(superswapRouter.addLiquidityETH(
          dai.address,
          ethers.utils.parseEther("1170").toString(),
          ethers.utils.parseEther("1168").toString(), 
          amount0,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("1")}
        )).revertedWith("Insufficient amount of the first token.");
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);
      });

      it("[addLiquidityETH]: pair exists, then success to add liquidity.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidityETH(
          dai.address,
          amount1,
          amount1, 
          amount0,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("1")}
        );
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)",
                         "function totalSupply() public view returns (uint256)",
                         "function getResevers() view public returns(uint _reserve0, uint _reserve1)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance0 = await pair.balanceOf(owner.address);
        
        const totalSupply = await pair.totalSupply();
        const [_reserve0, _reserve1] = await pair.getResevers();
        const [reserve0, reserve1] = weth.address < dai.address ? [_reserve0, _reserve1] : [_reserve1, _reserve0];
        const value0 = ethers.utils.parseEther("1").mul(totalSupply).div(reserve0);
        const value1 = ethers.utils.parseEther("1167").mul(totalSupply).div(reserve1);  
        const liquidity = value0 < value1 ? value0 : value1;
        await superswapRouter.addLiquidityETH(
          dai.address,
          amount1,
          amount1,
          amount0,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("1")}
        );
        const balance1 = await pair.balanceOf(owner.address);
        expect((parseFloat(ethers.utils.formatEther(balance1)) - parseFloat(ethers.utils.formatEther(balance0))).toFixed(6)). to.equal(parseFloat(ethers.utils.formatEther(liquidity)).toFixed(6));
      });
    });

  });

  describe("2.remove liquidity", function () {
    describe("2.1 removeLiquidity", function () {
      it("[removeLiquidity]: Shouldn't be timed out.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).toString();
        await expect(superswapRouter.removeLiquidity(
          weth.address, 
          dai.address,
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          owner.address,
          deadline
        )).revertedWith("Shouldn't be timed out.");
      });

      it("[removeLiquidity]: pairs should be created.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        await expect(superswapRouter.removeLiquidity(
          weth.address, 
          weth.address,
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          owner.address,
          deadline
        )).revertedWith("pairs should be created.");
        await expect(superswapRouter.removeLiquidity(
          weth.address, 
          dai.address,
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          owner.address,
          deadline
        )).revertedWith("pairs should be created.");
      });

      it("[removeLiquidity]: Insufficient balance.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );

        await expect(superswapRouter.removeLiquidity(
          weth.address, 
          dai.address,
          ethers.utils.parseEther("50").toString(),
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          owner.address,
          deadline
        )).revertedWith("Insufficient balance.");

      });

      it("[removeLiquidity]: Insufficient output.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)",
                         "function approve(address spender, uint256 amount) public returns (bool)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);

        await pair.approve(superswapRouter.address, balance);
        await expect(superswapRouter.removeLiquidity(
          weth.address, 
          dai.address,
          balance,
          ethers.utils.parseEther("1.01").toString(),
          ethers.utils.parseEther("1167").toString(),
          owner.address,
          deadline
        )).revertedWith("Insufficient output.");
        await expect(superswapRouter.removeLiquidity(
          weth.address, 
          dai.address,
          balance,
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1168").toString(),
          owner.address,
          deadline
        )).revertedWith("Insufficient output.");
      });

      it("[removeLiquidity]: create pair and remove liquidity then.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)",
                         "function approve(address spender, uint256 amount) public returns (bool)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);

        await pair.approve(superswapRouter.address, balance);
        await superswapRouter.removeLiquidity(
          weth.address, 
          dai.address,
          balance,
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          owner.address,
          deadline
        );
        expect(await pair.balanceOf(owner.address)).to.equal(0);
        expect(await dai.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("10000", 18));
      });

    });

    describe("2.2 removeLiquidityETH", function () {
      it("[removeLiquidityETH]: Shouldn't be timed out.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).toString();
        await expect(superswapRouter.removeLiquidityETH(
          dai.address,
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          owner.address,
          deadline
        )).revertedWith("Shouldn't be timed out.");
      });

      it("[removeLiquidityETH]: pairs should be created.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        await expect(superswapRouter.removeLiquidityETH(
          weth.address,
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          owner.address,
          deadline
        )).revertedWith("pairs should be created.");
        await expect(superswapRouter.removeLiquidityETH(
          dai.address,
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          owner.address,
          deadline
        )).revertedWith("pairs should be created.");
      });

      it("[removeLiquidityETH]: Insufficient balance.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );

        await expect(superswapRouter.removeLiquidityETH(
          dai.address,
          ethers.utils.parseEther("50").toString(),
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          owner.address,
          deadline
        )).revertedWith("Insufficient balance.");

      });

      it("[removeLiquidityETH]: Insufficient output.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)",
                         "function approve(address spender, uint256 amount) public returns (bool)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);

        await pair.approve(superswapRouter.address, balance);
        await expect(superswapRouter.removeLiquidityETH( 
          dai.address,
          balance,
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1.01").toString(),
          owner.address,
          deadline
        )).revertedWith("Insufficient output.");
        await expect(superswapRouter.removeLiquidityETH(
          dai.address,
          balance,
          ethers.utils.parseEther("1168").toString(),
          ethers.utils.parseEther("1").toString(),
          owner.address,
          deadline
        )).revertedWith("Insufficient output.");
      });

      it("[removeLiquidityETH]: create pair and remove liquidity then.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)",
                         "function approve(address spender, uint256 amount) public returns (bool)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);

        await pair.approve(superswapRouter.address, balance);
        await superswapRouter.removeLiquidityETH(
          dai.address,
          balance,
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          owner.address,
          deadline
        );
        expect(await pair.balanceOf(owner.address)).to.equal(0);
        expect(await dai.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("10000", 18));
      });

    });
  });


  describe("3.swap token", function () {
    describe("3.1 swapExactTokenForToken", function () {
      it("[swapExactTokenForToken]: Shouldn't be timed out.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).toString();
        const path = [weth.address, dai.address];
        await expect(superswapRouter.swapExactTokenForToken(
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("Shouldn't be timed out.");
      });

      it("[swapExactTokenForToken]: invalid path.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address];
        await expect(superswapRouter.swapExactTokenForToken(
          ethers.utils.parseEther("1").toString(),
          ethers.utils.parseEther("1167").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("invalid path.");
      });

      it("[swapExactTokenForToken]: tokens used to create pairs should be different.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address, weth.address];
        await expect(superswapRouter.swapExactTokenForToken(
          0,
          ethers.utils.parseEther("1167").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("tokens used to create pairs should be different.");
      });

      it("[swapExactTokenForToken]: pairs should be created.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address, dai.address];
        await expect(superswapRouter.swapExactTokenForToken(
          0,
          ethers.utils.parseEther("1167").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("pairs should be created.");
      });

      it("[swapExactTokenForToken]: amount of input should be bigger than zero.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const path = [weth.address, dai.address];
        await expect(superswapRouter.swapExactTokenForToken(
          0,
          ethers.utils.parseEther("1167").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("amount of input should be bigger than zero.");

      });

      it("[swapExactTokenForToken]: Insufficient amount.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const path = [weth.address, dai.address];
        await expect(superswapRouter.swapExactTokenForToken(
          ethers.utils.parseEther("0.1").toString(),
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("Insufficient amount.");

      });

      it("[swapExactTokenForToken]: success to swap exact weth for dai.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)",
                         "function approve(address spender, uint256 amount) public returns (bool)",
                         "function getResevers() view public returns(uint _reserve0, uint _reserve1)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);

        const [_reserve0, _reserve1] = await pair.getResevers();
        const [reserve0, reserve1] = weth.address < dai.address ? [_reserve0, _reserve1] : [_reserve1, _reserve0];
        const output = ethers.utils.parseEther("0.1").mul(997).mul(reserve1).div( ethers.utils.parseEther("0.1").mul(997).add( ethers.BigNumber.from(reserve0).mul(1000) ) );
        const path = [weth.address, dai.address];
        await superswapRouter.swapExactTokenForToken(
          ethers.utils.parseEther("0.1").toString(),
          output,
          path,
          owner.address,
          deadline
        );
        expect(await weth.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("8.9"));
        expect(await dai.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("10000", 18).sub(ethers.utils.parseUnits("1167", 18)).add(output) );

      });
    });

    describe("3.2 swapExactTokenForETH", function () {
      it("[swapExactTokenForETH]: Shouldn't be timed out.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).toString();
        const path = [dai.address, weth.address];
        await expect(superswapRouter.swapExactTokenForETH(
          ethers.utils.parseEther("117").toString(),
          ethers.utils.parseEther("0.1").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("Shouldn't be timed out.");
      });

      it("[swapExactTokenForETH]: the last token should be WETH.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [ weth.address, dai.address ];
        await expect(superswapRouter.swapExactTokenForETH(
          ethers.utils.parseEther("117").toString(),
          ethers.utils.parseEther("0.1").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("the last token should be WETH.");
      });

      it("[swapExactTokenForETH]: invalid path.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address];
        await expect(superswapRouter.swapExactTokenForETH(
          ethers.utils.parseEther("117").toString(),
          ethers.utils.parseEther("0.1").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("invalid path.");
      });

      it("[swapExactTokenForETH]: tokens used to create pairs should be different.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address, weth.address];
        await expect(superswapRouter.swapExactTokenForETH(
          ethers.utils.parseEther("117").toString(),
          ethers.utils.parseEther("0.1").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("tokens used to create pairs should be different.");
      });

      it("[swapExactTokenForETH]: pairs should be created.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [ dai.address, weth.address];
        await expect(superswapRouter.swapExactTokenForETH(
          ethers.utils.parseEther("117").toString(),
          ethers.utils.parseEther("0.1").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("pairs should be created.");
      });

      it("[swapExactTokenForETH]: amount of input should be bigger than zero.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const path = [dai.address, weth.address ];
        await expect(superswapRouter.swapExactTokenForETH(
          0,
          ethers.utils.parseEther("0.1").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("amount of input should be bigger than zero.");

      });

      it("[swapExactTokenForETH]: Insufficient amount.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const path = [ dai.address, weth.address ];
        await expect(superswapRouter.swapExactTokenForETH(
          ethers.utils.parseEther("117").toString(),
          ethers.utils.parseEther("0.12").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("Insufficient amount.");

      });

      it("[swapExactTokenForETH]: success to swap exact dai for eth.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)",
                         "function approve(address spender, uint256 amount) public returns (bool)",
                         "function getResevers() view public returns(uint _reserve0, uint _reserve1)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);

        const [_reserve0, _reserve1] = await pair.getResevers();
        const [reserve0, reserve1] = dai.address < weth.address ? [_reserve0, _reserve1] : [_reserve1, _reserve0];
        const output = ethers.utils.parseEther("117").mul(997).mul(reserve1).div( ethers.utils.parseEther("117").mul(997).add( ethers.BigNumber.from(reserve0).mul(1000) ) );
        const balanceETH0 = await owner.getBalance();
        const path = [ dai.address, weth.address];
        await superswapRouter.swapExactTokenForETH(
          ethers.utils.parseEther("117").toString(),
          output,
          path,
          owner.address,
          deadline
        );
        const balanceETH1 = await owner.getBalance();
        expect(parseFloat(ethers.utils.formatEther(balanceETH1)).toFixed(2)).to.equal(parseFloat(ethers.utils.formatEther(output.add(balanceETH0))).toFixed(2));
        expect(await dai.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("8716", 18));
      });
    });


    describe("3.3 swapExactETHForToken", function () {
      it("[swapExactETHForToken]: Shouldn't be timed out.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).toString();
        const path = [ weth.address, dai.address];
        await expect(superswapRouter.swapExactETHForToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        )).revertedWith("Shouldn't be timed out.");
      });

      it("[swapExactETHForToken]: the first token should be WETH.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [ dai.address, dai.address ];
        await expect(superswapRouter.swapExactETHForToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        )).revertedWith("the first token should be WETH.");
      });

      it("[swapExactETHForToken]: invalid path.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address];
        await expect(superswapRouter.swapExactETHForToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        )).revertedWith("invalid path.");
      });

      it("[swapExactETHForToken]: tokens used to create pairs should be different.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address, weth.address];
        await expect(superswapRouter.swapExactETHForToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        )).revertedWith("tokens used to create pairs should be different.");
      });

      it("[swapExactETHForToken]: pairs should be created.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [ weth.address, dai.address ];
        await expect(superswapRouter.swapExactETHForToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        )).revertedWith("pairs should be created.");
      });

      it("[swapExactETHForToken]: amount of input should be bigger than zero.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const path = [ weth.address, dai.address ];
        await expect(superswapRouter.swapExactETHForToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("amount of input should be bigger than zero.");

      });

      it("[swapExactETHForToken]: Insufficient amount.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const path = [  weth.address, dai.address ];
        await expect(superswapRouter.swapExactETHForToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        )).revertedWith("Insufficient amount.");

      });

      it("[swapExactETHForToken]: success to swap exact dai for eth.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)",
                         "function approve(address spender, uint256 amount) public returns (bool)",
                         "function getResevers() view public returns(uint _reserve0, uint _reserve1)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);

        const [_reserve0, _reserve1] = await pair.getResevers();
        const [reserve0, reserve1] = weth.address < dai.address ? [_reserve0, _reserve1] : [_reserve1, _reserve0];
        const output = ethers.utils.parseEther("0.1").mul(997).mul(reserve1).div( ethers.utils.parseEther("0.1").mul(997).add( ethers.BigNumber.from(reserve0).mul(1000) ) );
        const balanceETH0 = await owner.getBalance();
        const path = [  weth.address, dai.address ];
        await superswapRouter.swapExactETHForToken(
          output,
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        );
        const balanceETH1 = await owner.getBalance();
        expect(parseFloat(ethers.utils.formatEther(ethers.BigNumber.from(balanceETH0).sub(balanceETH1))).toFixed(2)).to.equal(parseFloat(0.1).toFixed(2));
        expect(await dai.balanceOf(owner.address)).to.equal( ethers.utils.parseUnits("10000", 18).sub(ethers.utils.parseUnits("1167", 18)).add(output) );
      });
    });

    describe("3.4 swapTokenForExactToken", function () {
      it("[swapTokenForExactToken]: Shouldn't be timed out.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).toString();
        const path = [weth.address, dai.address];
        await expect(superswapRouter.swapTokenForExactToken(
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("Shouldn't be timed out.");
      });

      it("[swapTokenForExactToken]: invalid path.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address];
        await expect(superswapRouter.swapTokenForExactToken(
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("invalid path.");
      });

      it("[swapTokenForExactToken]: tokens used to create pairs should be different.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address, weth.address];
        await expect(superswapRouter.swapTokenForExactToken(
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("tokens used to create pairs should be different.");
      });

      it("[swapTokenForExactToken]: pairs should be created.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address, dai.address];
        await expect(superswapRouter.swapTokenForExactToken(
          ethers.utils.parseEther("1167").toString(),
          ethers.utils.parseEther("1").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("pairs should be created.");
      });

      it("[swapTokenForExactToken]: amount of output should be bigger than zero.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const path = [weth.address, dai.address];
        await expect(superswapRouter.swapTokenForExactToken(
          0,
          ethers.utils.parseEther("1").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("amount of output should be bigger than zero.");

      });

      it("[swapTokenForExactToken]: Insufficient amount.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const path = [weth.address, dai.address];
        await expect(superswapRouter.swapTokenForExactToken(
          ethers.utils.parseEther("117").toString(),
          ethers.utils.parseEther("0.1").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("Insufficient amount.");

      });

      it("[swapTokenForExactToken]: success to swap weth for exact dai.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)",
                         "function approve(address spender, uint256 amount) public returns (bool)",
                         "function getResevers() view public returns(uint _reserve0, uint _reserve1)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);

        const [_reserve0, _reserve1] = await pair.getResevers();
        const [reserve0, reserve1] = weth.address < dai.address ? [_reserve0, _reserve1] : [_reserve1, _reserve0];
        const input = ethers.utils.parseEther("117").mul(1000).mul(reserve0).div( ethers.BigNumber.from(reserve1).sub(ethers.utils.parseEther("117")).mul(997) ).add(1);
        const path = [weth.address, dai.address];
        const balancedai = await dai.balanceOf(owner.address);
        await superswapRouter.swapTokenForExactToken(
          ethers.utils.parseEther("117").toString(),
          input,
          path,
          owner.address,
          deadline
        );
        const balancedai2 = await dai.balanceOf(owner.address);
        expect(await weth.balanceOf(owner.address)).to.equal(ethers.utils.parseEther("9").sub(input));
        expect(await dai.balanceOf(owner.address)).to.equal(ethers.utils.parseUnits("8950", 18) );

      });
    });

    describe("3.5 swapTokenForExactETH", function () {
      it("[swapTokenForExactETH]: Shouldn't be timed out.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).toString();
        const path = [dai.address, weth.address];
        await expect(superswapRouter.swapTokenForExactETH(
          ethers.utils.parseEther("0.1").toString(),
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("Shouldn't be timed out.");
      });

      it("[swapTokenForExactETH]: the last token should be WETH.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [ weth.address, dai.address ];
        await expect(superswapRouter.swapTokenForExactETH(
          ethers.utils.parseEther("0.1").toString(),
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("the last token should be WETH.");
      });

      it("[swapTokenForExactETH]: invalid path.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address];
        await expect(superswapRouter.swapTokenForExactETH(
          ethers.utils.parseEther("0.1").toString(),
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("invalid path.");
      });

      it("[swapTokenForExactETH]: tokens used to create pairs should be different.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address, weth.address];
        await expect(superswapRouter.swapTokenForExactETH(
          ethers.utils.parseEther("0.1").toString(),
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("tokens used to create pairs should be different.");
      });

      it("[swapTokenForExactETH]: pairs should be created.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [ dai.address, weth.address];
        await expect(superswapRouter.swapTokenForExactETH(
          ethers.utils.parseEther("0.1").toString(),
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("pairs should be created.");
      });

      it("[swapTokenForExactETH]: amount of output should be bigger than zero.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const path = [dai.address, weth.address ];
        await expect(superswapRouter.swapTokenForExactETH(
          0,
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("amount of output should be bigger than zero.");

      });

      it("[swapTokenForExactETH]: Insufficient amount.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const path = [ dai.address, weth.address ];
        await expect(superswapRouter.swapTokenForExactETH(
          ethers.utils.parseEther("0.1").toString(),
          ethers.utils.parseEther("100").toString(),
          path,
          owner.address,
          deadline
        )).revertedWith("Insufficient amount.");

      });

      it("[swapTokenForExactETH]: success to swap dai for exact eth.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)",
                         "function approve(address spender, uint256 amount) public returns (bool)",
                         "function getResevers() view public returns(uint _reserve0, uint _reserve1)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);

        const [_reserve0, _reserve1] = await pair.getResevers();
        const [reserve0, reserve1] = dai.address < weth.address ? [_reserve0, _reserve1] : [_reserve1, _reserve0];
        const input = ethers.utils.parseEther("0.1").mul(1000).mul(reserve0).div( ethers.BigNumber.from(reserve1).sub(ethers.utils.parseEther("0.1")).mul(997) ).add(1);
        const balanceETH0 = await owner.getBalance();
        const path = [ dai.address, weth.address];
        await superswapRouter.swapTokenForExactETH(
          ethers.utils.parseEther("0.1").toString(),
          input,
          path,
          owner.address,
          deadline
        );
        const balanceETH1 = await owner.getBalance();
        expect(parseFloat(ethers.utils.formatEther(ethers.BigNumber.from(balanceETH1).sub(balanceETH0))).toFixed(2)).to.equal(parseFloat(0.1).toFixed(2));
        expect(await dai.balanceOf(owner.address)).to.equal( ethers.utils.parseUnits("10000", 18).sub(ethers.utils.parseUnits("1167", 18)).sub(input) );
      });
    });

    describe("3.6 swapETHForExactToken", function () {
      it("[swapETHForExactToken]: Shouldn't be timed out.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).toString();
        const path = [ weth.address, dai.address];
        await expect(superswapRouter.swapETHForExactToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        )).revertedWith("Shouldn't be timed out.");
      });

      it("[swapETHForExactToken]: the first token should be WETH.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [ dai.address, dai.address ];
        await expect(superswapRouter.swapETHForExactToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        )).revertedWith("the first token should be WETH.");
      });

      it("[swapETHForExactToken]: invalid path.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address];
        await expect(superswapRouter.swapETHForExactToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        )).revertedWith("invalid path.");
      });

      it("[swapETHForExactToken]: tokens used to create pairs should be different.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [weth.address, weth.address];
        await expect(superswapRouter.swapETHForExactToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        )).revertedWith("tokens used to create pairs should be different.");
      });

      it("[swapETHForExactToken]: pairs should be created.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const path = [ weth.address, dai.address ];
        await expect(superswapRouter.swapETHForExactToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        )).revertedWith("pairs should be created.");
      });

      it("[swapETHForExactToken]: amount of output should be bigger than zero.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const path = [ weth.address, dai.address ];
        await expect(superswapRouter.swapETHForExactToken(
          0,
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        )).revertedWith("amount of output should be bigger than zero.");

      });

      it("[swapETHForExactToken]: Insufficient amount.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const path = [  weth.address, dai.address ];
        await expect(superswapRouter.swapETHForExactToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline,
          {value: ethers.utils.parseEther("0.1").toString()}
        )).revertedWith("Insufficient amount.");

      });

      it("[swapETHForExactToken]: success to swap eth for exact dai.", async function () {
        const { superswapFactory, weth, superswapRouter, dai, owner } = await loadFixture(deployFixture);
        await weth.approve(superswapRouter.address, ethers.utils.parseEther("10").toString());
        await dai.approve(superswapRouter.address, ethers.utils.parseEther("10000").toString());
        const deadline = ethers.BigNumber.from(Date.now()).div(1000).add(60).toString();
        const amount0 = ethers.utils.parseEther("1").toString();
        const amount1 = ethers.utils.parseEther("1167").toString();
        await superswapRouter.addLiquidity(
          weth.address, 
          dai.address,
          amount0,
          amount1,
          amount0,
          amount1,
          owner.address,
          deadline
        );
        const liquidity = sqrt(ethers.utils.parseEther("1").mul(ethers.utils.parseEther("1167")));
        const pairAddr = await superswapFactory.getPair(weth.address, dai.address);
        const pairAbi = ["function balanceOf(address account) public view returns (uint256)",
                         "function approve(address spender, uint256 amount) public returns (bool)",
                         "function getResevers() view public returns(uint _reserve0, uint _reserve1)"];
        const pair = new ethers.Contract(pairAddr, pairAbi, owner);
        const balance = await pair.balanceOf(owner.address);
        expect(parseFloat(ethers.utils.formatEther(balance)).toFixed(6)).to.equal(liquidity);

        const [_reserve0, _reserve1] = await pair.getResevers();
        const [reserve0, reserve1] = weth.address < dai.address ? [_reserve0, _reserve1] : [_reserve1, _reserve0];
        const input = ethers.utils.parseEther("117").mul(1000).mul(reserve0).div( ethers.BigNumber.from(reserve1).sub(ethers.utils.parseEther("117")).mul(997) ).add(1);
        const balanceETH0 = await owner.getBalance();
        const path = [  weth.address, dai.address ];
        await superswapRouter.swapETHForExactToken(
          ethers.utils.parseEther("117").toString(),
          path,
          owner.address,
          deadline,
          {value: input}
        );
        const balanceETH1 = await owner.getBalance();
        expect(parseFloat(ethers.utils.formatEther(ethers.BigNumber.from(balanceETH0).sub(balanceETH1))).toFixed(2)).to.equal(parseFloat(ethers.utils.formatEther(input)).toFixed(2));
        expect(await dai.balanceOf(owner.address)).to.equal( ethers.utils.parseUnits("8950", 18) );
      });
    });

  });

});
