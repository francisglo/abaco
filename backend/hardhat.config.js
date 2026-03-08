import 'dotenv/config';

const hardhatNetworkUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
const deployerKey = process.env.BLOCKCHAIN_PRIVATE_KEY || '';

/** @type {import('hardhat/config').HardhatUserConfig} */
const config = {
  solidity: '0.8.24',
  paths: {
    sources: './contracts',
    cache: './.hardhat-cache',
    artifacts: './artifacts'
  },
  networks: {
    hardhat: {
      type: 'edr-simulated'
    },
    localhost: {
      type: 'http',
      url: hardhatNetworkUrl,
      accounts: deployerKey ? [deployerKey] : undefined
    }
  }
};

export default config;
