import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ethers } from 'ethers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, '..', '..');
const deploymentFile = path.join(backendRoot, '.anchor-deployment.json');
const artifactPath = path.join(backendRoot, 'artifacts', 'contracts', 'LedgerAnchor.sol', 'LedgerAnchor.json');

async function run() {
  const networkName = process.env.BLOCKCHAIN_NETWORK || 'localhost';
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;

  if (!privateKey) {
    throw new Error('BLOCKCHAIN_PRIVATE_KEY es requerida para desplegar contrato');
  }

  if (!fs.existsSync(artifactPath)) {
    throw new Error(`No se encontró artifact del contrato. Ejecuta primero: npm run blockchain:compile (${artifactPath})`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

  console.log(`🚀 Desplegando contrato LedgerAnchor en red ${networkName}...`);

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();

  const deployment = {
    contractName: 'LedgerAnchor',
    address,
    network: networkName,
    deployedAt: new Date().toISOString()
  };

  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2), 'utf8');

  console.log('✅ Contrato desplegado');
  console.log(`   address: ${address}`);
  console.log(`   deployment file: ${deploymentFile}`);
}

run().catch((error) => {
  console.error('❌ Error desplegando LedgerAnchor:', error);
  process.exitCode = 1;
});
