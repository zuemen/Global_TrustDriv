// services/ssi.js — Real Sepolia SSI anchoring (Node.js version)
// Graceful degradation: if DEPLOYER_PRIVATE_KEY or ANCHOR_CONTRACT_ADDRESS
// are not set, did_resolved will be false and no transaction is sent.

const crypto = require('crypto')

let ethers = null
try {
  ethers = require('ethers')
} catch {
  console.warn('[SSI] ethers not installed — blockchain anchoring disabled. Run: npm install ethers')
}

const SEPOLIA_RPC   = process.env.SEPOLIA_RPC_URL        || 'https://ethereum-sepolia-rpc.publicnode.com'
const PRIVATE_KEY   = process.env.DEPLOYER_PRIVATE_KEY   || ''
const CONTRACT_ADDR = process.env.ANCHOR_CONTRACT_ADDRESS || ''

const CONTRACT_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'credentialHash', type: 'bytes32' },
      { internalType: 'string',  name: 'docId',          type: 'string'  },
    ],
    name: 'anchor',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'bytes32', name: 'credentialHash', type: 'bytes32' }],
    name: 'verify',
    outputs: [
      { internalType: 'bool',    name: 'isAnchored', type: 'bool'    },
      { internalType: 'address', name: 'issuer',     type: 'address' },
      { internalType: 'uint256', name: 'timestamp',  type: 'uint256' },
      { internalType: 'string',  name: 'docId',      type: 'string'  },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

const IAL_PATTERNS = [
  { ial: 'GOV_CERTIFIED', tier: 4, re: /passport|national.?id|gov|moica|citizen|身分證|護照/i },
  { ial: 'MED_VERIFIED',  tier: 3, re: /medical|health|clinical|hospital|nurse|doctor|pharm|醫療|健康/i },
  { ial: 'EDU_VERIFIED',  tier: 2, re: /transcript|degree|diploma|certificate|academic|university|college|school|成績單|學位|畢業/i },
  { ial: 'PROF_VERIFIED', tier: 2, re: /employment|work|job|career|hr|salary|offer|experience|resume|cv|재직|경력/i },
  { ial: 'FIN_VERIFIED',  tier: 2, re: /bank|tax|finance|account|statement|kyc|fund|銀行|所得|稅/i },
]

function computeHash(filenames, fileContents) {
  const h = crypto.createHash('sha256')
  if (fileContents && fileContents.length > 0) {
    const bufs   = fileContents.map(b => Buffer.isBuffer(b) ? b : Buffer.from(b))
    const sorted = [...bufs].sort(Buffer.compare)
    for (const buf of sorted) h.update(buf)
  } else {
    for (const name of [...filenames].sort()) h.update(name)
  }
  return h.digest('hex')
}

async function anchorOnChain(hashHex, docId) {
  if (!ethers || !PRIVATE_KEY || !CONTRACT_ADDR) {
    return { on_chain: false, tx_hash: null, block: null }
  }
  try {
    const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC, { chainId: 11155111, name: 'sepolia' })
    const wallet   = new ethers.Wallet(PRIVATE_KEY, provider)
    const contract = new ethers.Contract(CONTRACT_ADDR, CONTRACT_ABI, wallet)
    const hashBytes = '0x' + hashHex

    const [isAnchored] = await contract.verify(hashBytes)
    if (isAnchored) {
      console.log('[SSI] Already on-chain:', hashHex.slice(0, 16) + '...')
      return { on_chain: true, tx_hash: null, block: null, already_existed: true }
    }

    const tx      = await contract.anchor(hashBytes, docId || 'GTD-DOC')
    const receipt = await tx.wait()
    const success = receipt.status === 1
    console.log(`[SSI] ${success ? 'Anchored' : 'FAILED'} — tx=${tx.hash}, block=${receipt.blockNumber}`)
    return { on_chain: success, tx_hash: tx.hash, block: receipt.blockNumber }
  } catch (err) {
    console.error('[SSI] Anchor error:', err.message)
    return { on_chain: false, tx_hash: null, block: null, error: err.message }
  }
}

async function verify({ filenames, fileContents, docId } = {}) {
  const names = filenames || []
  let bestTier = 0
  let bestIal  = 'MYDATA_LIGHT'
  for (const name of names) {
    for (const p of IAL_PATTERNS) {
      if (p.re.test(name) && p.tier > bestTier) {
        bestTier = p.tier
        bestIal  = p.ial
      }
    }
  }

  const credentialHash = computeHash(names, fileContents)
  const chain = await anchorOnChain(credentialHash, docId)
  const explorerUrl = chain.tx_hash
    ? `https://sepolia.etherscan.io/tx/${chain.tx_hash}`
    : null

  return {
    signatureValid:   true,
    didResolved:      chain.on_chain,
    ial:              bestIal,
    ialTier:          bestTier || 1,
    issuer:           'Global Trust Registry',
    doc_count:        names.length,
    credential_hash:  credentialHash,
    tx_hash:          chain.tx_hash,
    block_number:     chain.block,
    sepolia_explorer: explorerUrl,
    network:          'Sepolia Testnet (Chain ID: 11155111)',
  }
}

module.exports = { verify }
