require("@nomiclabs/hardhat-waffle");
//require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
//require("@nomicfoundation/hardhat-chai-matchers");
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.9",
  netkorks: {
    localhost:{}
  },
};
