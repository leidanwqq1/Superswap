require("@nomicfoundation/hardhat-toolbox");
require('dotenv').config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.0",
  // networks: {
  //   localhost: {
  //     url: "http://127.0.0.1:8545"
  //   },
  //   goerli: {
  //     url: `https://eth-goerli.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
  //     accounts: [`0x${process.env.PRIVATE_KEY}`]
  //   }
  // }
};
