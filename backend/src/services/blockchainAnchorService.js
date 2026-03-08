import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';

const deploymentPath = path.resolve(process.cwd(), '.anchor-deployment.json');

const ledgerAnchorAbi = [
  'function anchorRoot(bytes32 rootHash, uint256 blockIndex, string source) returns (uint256 anchorId)',
  'function totalAnchors() view returns (uint256)',
  'function getLatestAnchor() view returns (bytes32 rootHash, uint256 blockIndex, uint256 anchoredAt, string source)'
];

function toBytes32(hash) {
  const normalized = String(hash || '').replace(/^0x/, '').toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(normalized)) {
    throw new Error('Hash inválido para anclaje blockchain (debe ser SHA-256 hex de 64 caracteres)');
  }
  return `0x${normalized}`;
}

function resolveContractAddress() {
  if (process.env.BLOCKCHAIN_ANCHOR_CONTRACT) return process.env.BLOCKCHAIN_ANCHOR_CONTRACT;

  if (fs.existsSync(deploymentPath)) {
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
    if (deployment?.address) return deployment.address;
  }

  return null;
}

function getProvider() {
  const rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545';
  return new ethers.JsonRpcProvider(rpcUrl);
}

function getSigner(provider) {
  const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
  if (!privateKey) {
    throw new Error('BLOCKCHAIN_PRIVATE_KEY no configurada');
  }
  return new ethers.Wallet(privateKey, provider);
}

export function isBlockchainEnabled() {
  return String(process.env.BLOCKCHAIN_ENABLED || 'false').toLowerCase() === 'true';
}

export async function anchorHash({ rootHash, blockIndex, source }) {
  if (!isBlockchainEnabled()) {
    throw new Error('Anclaje blockchain deshabilitado (BLOCKCHAIN_ENABLED=false)');
  }

  const contractAddress = resolveContractAddress();
  if (!contractAddress) {
    throw new Error('No se encontró dirección del contrato de anclaje (BLOCKCHAIN_ANCHOR_CONTRACT o .anchor-deployment.json)');
  }

  const provider = getProvider();
  const signer = getSigner(provider);
  const contract = new ethers.Contract(contractAddress, ledgerAnchorAbi, signer);

  const tx = await contract.anchorRoot(toBytes32(rootHash), BigInt(blockIndex), String(source || 'abaco-ledger'));
  const receipt = await tx.wait();

  return {
    txHash: tx.hash,
    blockNumber: Number(receipt?.blockNumber || 0),
    contractAddress,
    network: process.env.BLOCKCHAIN_NETWORK || 'localhost'
  };
}

export async function getLatestAnchorOnChain() {
  const contractAddress = resolveContractAddress();
  if (!contractAddress) {
    return null;
  }

  const provider = getProvider();
  const contract = new ethers.Contract(contractAddress, ledgerAnchorAbi, provider);

  const total = await contract.totalAnchors();
  if (Number(total) === 0) {
    return {
      totalAnchors: 0,
      latest: null,
      contractAddress,
      network: process.env.BLOCKCHAIN_NETWORK || 'localhost'
    };
  }

  const latest = await contract.getLatestAnchor();

  return {
    totalAnchors: Number(total),
    latest: {
      rootHash: latest.rootHash,
      blockIndex: Number(latest.blockIndex),
      anchoredAtUnix: Number(latest.anchoredAt),
      source: latest.source
    },
    contractAddress,
    network: process.env.BLOCKCHAIN_NETWORK || 'localhost'
  };
}
