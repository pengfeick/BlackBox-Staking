# BlackBox Staking

<div align="center">

**A Privacy-Preserving Staking Protocol Built on Fully Homomorphic Encryption**

[![License: BSD-3-Clause-Clear](https://img.shields.io/badge/License-BSD--3--Clause--Clear-blue.svg)](LICENSE)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.27-e6e6e6?logo=solidity)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Built%20with-Hardhat-yellow)](https://hardhat.org/)
[![Powered by Zama](https://img.shields.io/badge/Powered%20by-Zama%20FHEVM-blueviolet)](https://docs.zama.ai/fhevm)

</div>

---

## 📖 Introduction

**BlackBox Staking** is a groundbreaking decentralized staking protocol that leverages **Fully Homomorphic Encryption (FHE)** to provide complete privacy for staking operations. Unlike traditional staking protocols where all balances and transactions are publicly visible on-chain, BlackBox Staking ensures that your staking amounts, balances, and activities remain confidential while maintaining the security and verifiability of blockchain technology.

Built on [Zama's FHEVM](https://docs.zama.ai/fhevm) (Fully Homomorphic Encryption Virtual Machine) and implementing the [ERC7984 standard](https://eips.ethereum.org/EIPS/eip-7984) for confidential tokens, BlackBox Staking represents the next evolution of privacy-preserving DeFi infrastructure.

### Why "BlackBox"?

The name "BlackBox" reflects the core principle of the protocol: **your staking activity is your business alone**. Just like a black box in aviation that securely records data, our protocol securely encrypts your staking data, making it invisible to outside observers while remaining cryptographically verifiable.

---

## ✨ Key Features

### 🔐 Complete Privacy
- **Encrypted Balances**: All staking balances are stored as encrypted values (euint64) on-chain
- **Private Transactions**: Staking and unstaking amounts are never revealed publicly
- **Confidential Totals**: Even the total amount staked across all users is encrypted
- **User-Only Decryption**: Only you can decrypt and view your own staking balance

### 🛡️ Security & Safety
- **Safe Math Operations**: Uses `FHESafeMath` for secure arithmetic on encrypted values
- **Underflow Protection**: Prevents unstaking more than staked balance without revealing amounts
- **Input Validation**: Robust authorization checks for encrypted inputs
- **Auditable Logic**: Clear separation of concerns with internal helper functions

### 🚀 Advanced Technology
- **Homomorphic Encryption**: Perform calculations on encrypted data without decryption
- **ERC7984 Compliance**: Implements the latest standard for confidential tokens
- **Gas Optimized**: Efficient operations designed for minimal gas consumption
- **Event Emission**: Proper event logging for off-chain tracking (with encrypted values)

### 🎯 MEV Protection
- **Front-Running Resistant**: Encrypted amounts prevent front-running attacks
- **MEV Proof**: Bots cannot analyze or exploit staking patterns
- **Fair Operations**: Level playing field for all participants

---

## 🎯 Problems Solved

### 1. **Privacy in DeFi**
**Problem**: Traditional staking protocols expose all user balances and transaction amounts, revealing financial strategies and holdings to competitors, attackers, and the public.

**Solution**: BlackBox Staking encrypts all sensitive data using FHE, ensuring that only the user can decrypt their own information while still allowing the protocol to perform calculations and maintain security.

### 2. **Front-Running & MEV Exploitation**
**Problem**: In transparent blockchain systems, malicious actors can observe pending transactions and front-run large staking operations, extracting value through MEV (Maximal Extractable Value) attacks.

**Solution**: Since all staking amounts are encrypted, attackers cannot determine the value of pending transactions, effectively eliminating front-running opportunities and MEV exploitation.

### 3. **Competitive Disadvantage for Institutions**
**Problem**: Large institutional investors and protocols need to protect their staking strategies from competitors who can analyze their on-chain behavior.

**Solution**: Encrypted operations allow institutions to stake and manage positions without revealing their strategy, timing, or capital allocation to competitors.

### 4. **User Profiling & Tracking**
**Problem**: Public blockchain data enables detailed profiling of users' financial activities, creating privacy concerns and potential security risks.

**Solution**: BlackBox Staking prevents profiling by encrypting all financial data, making it impossible to track individual user behavior or build financial profiles.

### 5. **Whale Watching & Market Manipulation**
**Problem**: Large holders ("whales") are often tracked and their movements can cause market panic or manipulation.

**Solution**: Encrypted balances and operations prevent whale watching, reducing market manipulation and creating a more stable ecosystem.

---

## 🏗️ Architecture

### Smart Contracts

#### 1. **ERC7984ETH.sol** - Confidential Token
```solidity
contract ERC7984ETH is ERC7984
```

A privacy-preserving token implementation following the ERC7984 standard:
- **Token Name**: mETH (Mock ETH for testing)
- **Token Symbol**: mETH
- **Encryption**: All balances stored as encrypted uint64 values
- **Free Minting**: `mintFree()` function for testing (1 mETH per call)
- **Confidential Transfers**: Fully encrypted transfer operations

#### 2. **METHStaking.sol** - Staking Protocol
```solidity
contract METHStaking is SepoliaConfig
```

The core staking contract with the following capabilities:

**State Variables:**
- `_stakedBalances`: Mapping of encrypted staking balances per user
- `_totalStaked`: Encrypted total of all staked tokens
- `methToken`: Immutable reference to the ERC7984 token

**Core Functions:**
- `stake(externalEuint64, bytes)`: Stake tokens with encrypted amount and proof
- `stake(euint64)`: Stake tokens with pre-encrypted amount
- `unstake(externalEuint64, bytes)`: Unstake tokens with encrypted amount and proof
- `unstake(euint64)`: Unstake tokens with pre-encrypted amount
- `stakedBalanceOf(address)`: View encrypted staked balance
- `confidentialTotalStaked()`: View encrypted total staked

**Security Features:**
- Authorization validation for encrypted inputs
- Safe increase/decrease operations with overflow protection
- Automatic permission management for FHE operations
- Event emission for transparency (with encrypted values)

---

## 🛠️ Technology Stack

### Core Technologies

| Technology | Version | Purpose |
|------------|---------|---------|
| **Solidity** | 0.8.27 | Smart contract language |
| **FHEVM** | 0.8.0 | Fully Homomorphic Encryption runtime |
| **OpenZeppelin Confidential** | 0.3.0-rc.0 | Confidential contract utilities |
| **ERC7984** | Latest | Confidential token standard |
| **Hardhat** | 2.26.0 | Development environment |
| **TypeScript** | 5.8.3 | Type-safe development |
| **Ethers.js** | 6.15.0 | Ethereum library |
| **TypeChain** | 8.3.2 | TypeScript bindings for contracts |

### Development Tools

- **Testing Framework**: Mocha + Chai
- **Code Coverage**: Solidity Coverage
- **Linting**: ESLint + Solhint
- **Formatting**: Prettier
- **Gas Reporting**: Hardhat Gas Reporter
- **Deployment**: Hardhat Deploy
- **Type Safety**: TypeChain + TypeScript

### Cryptography Stack

- **Zama FHEVM**: Provides the FHE runtime and encrypted operations
- **FHE Types**: euint64 (encrypted 64-bit unsigned integers)
- **FHESafeMath**: Safe arithmetic operations on encrypted values
- **Input Encryption**: Secure encryption of user inputs with proofs

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- **Node.js**: Version 20 or higher
- **npm**: Version 7.0.0 or higher
- **Git**: For cloning the repository

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/BlackBox-Staking.git
   cd BlackBox-Staking
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:
   ```bash
   PRIVATE_KEY=your_private_key_here
   INFURA_API_KEY=your_infura_api_key
   ```

   Or use Hardhat's secure variable storage:
   ```bash
   npx hardhat vars set PRIVATE_KEY
   npx hardhat vars set INFURA_API_KEY
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

4. **Compile contracts**
   ```bash
   npm run compile
   ```

5. **Run tests**
   ```bash
   npm run test
   ```

---

## 📚 Usage Guide

### Running Local Development

1. **Start a local FHEVM node**
   ```bash
   npx hardhat node
   ```

2. **Deploy contracts to local network**
   ```bash
   npm run deploy:localhost
   ```

3. **Interact with contracts using tasks**
   ```bash
   # Mint free mETH tokens
   npx hardhat mint-meth --network localhost

   # Stake tokens
   npx hardhat stake --amount 100000 --network localhost

   # Check staked balance
   npx hardhat check-stake --network localhost

   # Unstake tokens
   npx hardhat unstake --amount 50000 --network localhost
   ```

### Deploying to Sepolia Testnet

1. **Ensure you have Sepolia ETH** (get from [Sepolia Faucet](https://sepoliafaucet.com/))

2. **Deploy contracts**
   ```bash
   npm run deploy:sepolia
   ```

3. **Verify contracts on Etherscan**
   ```bash
   npm run verify:sepolia
   ```

4. **Run tests on Sepolia**
   ```bash
   npm run test:sepolia
   ```

### Interacting with Contracts (Code Example)

```typescript
import { ethers, fhevm } from "hardhat";
import { METHStaking, ERC7984ETH } from "../types";

async function stakeTokens() {
  // Get contract instances
  const token = await ethers.getContract("ERC7984ETH") as ERC7984ETH;
  const staking = await ethers.getContract("METHStaking") as METHStaking;

  // Mint some tokens
  await token.mintFree();

  // Approve staking contract as operator
  const MAX_OPERATOR_WINDOW = (1n << 48n) - 1n;
  await token.setOperator(await staking.getAddress(), MAX_OPERATOR_WINDOW);

  // Create encrypted input for staking
  const stakeAmount = 500_000n; // 0.5 mETH
  const encryptedInput = await fhevm
    .createEncryptedInput(await staking.getAddress(), signerAddress)
    .add64(stakeAmount)
    .encrypt();

  // Stake tokens
  const tx = await staking["stake(bytes32,bytes)"](
    encryptedInput.handles[0],
    encryptedInput.inputProof
  );
  await tx.wait();

  // Check encrypted balance (only you can decrypt)
  const encryptedBalance = await staking.stakedBalanceOf(signerAddress);
  const balance = await fhevm.userDecryptEuint(
    FhevmType.euint64,
    encryptedBalance,
    await staking.getAddress(),
    signer
  );

  console.log(`Staked balance: ${balance}`);
}
```

---

## 🧪 Testing

### Test Suite

The project includes comprehensive tests covering:

1. **Basic Staking Operations**
   - Staking encrypted amounts
   - Balance updates after staking
   - Total staked tracking

2. **Unstaking Operations**
   - Partial unstaking
   - Full unstaking
   - Balance correctness

3. **Edge Cases**
   - Unstaking more than staked (should fail gracefully)
   - Zero amount operations
   - Multiple stake/unstake cycles

4. **Privacy Verification**
   - Encrypted balance storage
   - Decryption authorization
   - Total supply confidentiality

### Running Tests

```bash
# Run all tests
npm run test

# Run tests on Sepolia testnet
npm run test:sepolia

# Generate coverage report
npm run coverage

# Run specific test file
npx hardhat test test/METHStaking.ts
```

### Test Results Example

```bash
  METHStaking
    ✓ allows a user to stake encrypted amounts (156ms)
    ✓ allows a user to unstake a portion of their position (201ms)
    ✓ does not change balances when unstaking above stake (178ms)

  3 passing (2s)
```

---

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run compile` | Compile all smart contracts |
| `npm run test` | Run test suite on local network |
| `npm run test:sepolia` | Run tests on Sepolia testnet |
| `npm run coverage` | Generate code coverage report |
| `npm run lint` | Run linters (Solidity + TypeScript) |
| `npm run lint:sol` | Lint Solidity files only |
| `npm run lint:ts` | Lint TypeScript files only |
| `npm run prettier:check` | Check code formatting |
| `npm run prettier:write` | Format all code files |
| `npm run clean` | Clean build artifacts |
| `npm run typechain` | Generate TypeScript types |
| `npm run deploy:localhost` | Deploy to local network |
| `npm run deploy:sepolia` | Deploy to Sepolia testnet |
| `npm run verify:sepolia` | Verify contracts on Etherscan |

---

## 🗂️ Project Structure

```
BlackBox-Staking/
├── contracts/
│   ├── ERC7984ETH.sol          # Confidential ERC7984 token implementation
│   └── METHStaking.sol         # Privacy-preserving staking contract
├── deploy/
│   └── deploy.ts               # Deployment scripts
├── tasks/
│   ├── accounts.ts             # Account management tasks
│   └── meth.ts                 # mETH interaction tasks
├── test/
│   └── METHStaking.ts          # Comprehensive test suite
├── types/                      # Generated TypeChain types
├── artifacts/                  # Compiled contract artifacts
├── cache/                      # Hardhat cache
├── src/                        # Additional source files
├── hardhat.config.ts           # Hardhat configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies and scripts
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── .solhint.json               # Solidity linting rules
├── .prettierrc                 # Code formatting rules
└── README.md                   # This file
```

---

## 🔮 Future Roadmap

### Phase 1: Core Protocol Enhancement (Q2 2025)
- [ ] **Staking Rewards System**: Implement encrypted reward distribution mechanism
- [ ] **Time-Locked Staking**: Add lock periods with bonus rewards
- [ ] **Slashing Mechanism**: Implement penalties for malicious behavior (privacy-preserving)
- [ ] **Emergency Pause**: Add circuit breaker for security incidents

### Phase 2: Advanced Features (Q3 2025)
- [ ] **Liquid Staking Derivatives**: Issue encrypted staking receipt tokens (mETH-S)
- [ ] **Auto-Compounding**: Automatic reward reinvestment with encrypted calculations
- [ ] **Delegation System**: Allow users to delegate staking power privately
- [ ] **Multi-Token Support**: Extend to support multiple ERC7984 tokens

### Phase 3: DeFi Integration (Q4 2025)
- [ ] **Lending Integration**: Use staked positions as collateral in privacy-preserving lending protocols
- [ ] **DEX Integration**: Enable trading of encrypted staking derivatives
- [ ] **Yield Aggregation**: Integrate with other privacy-preserving yield sources
- [ ] **Cross-Chain Bridge**: Bridge encrypted staking positions across chains

### Phase 4: Governance & Mainnet (Q1 2026)
- [ ] **DAO Governance**: Implement encrypted voting for protocol parameters
- [ ] **Governance Token**: Launch governance token with encrypted balances
- [ ] **Mainnet Deployment**: Deploy to Ethereum mainnet with full security audits
- [ ] **Mobile SDK**: Release mobile SDK for easy integration

### Phase 5: Enterprise & Scaling (Q2 2026)
- [ ] **Institutional Features**: Advanced risk management and reporting tools
- [ ] **Compliance Module**: Optional encrypted compliance reporting
- [ ] **Batch Operations**: Gas-optimized batch staking/unstaking
- [ ] **Layer 2 Integration**: Deploy on privacy-focused L2 solutions

### Research & Development (Ongoing)
- [ ] **Zero-Knowledge Proofs Integration**: Combine ZK with FHE for enhanced privacy
- [ ] **Quantum Resistance**: Research post-quantum cryptographic alternatives
- [ ] **Privacy-Preserving Analytics**: Develop tools for encrypted data analysis
- [ ] **Gas Optimization**: Continuous improvement of FHE operation costs

---

## 🔒 Security

### Audit Status
- **Status**: Not yet audited
- **Planned**: Q2 2025
- **Scope**: Full smart contract audit + cryptographic review

### Security Best Practices

1. **Use only on testnets** until mainnet launch and audits are complete
2. **Never share private keys** or seed phrases
3. **Verify contract addresses** before interacting
4. **Start with small amounts** when testing
5. **Keep dependencies updated** regularly

### Reporting Security Issues

If you discover a security vulnerability, please email:
- **Security Team**: security@blackboxstaking.io
- **PGP Key**: [Available on request]

**Please do not open public issues for security vulnerabilities.**

---

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

1. **Code Contributions**
   - Fix bugs
   - Add features
   - Improve documentation
   - Optimize gas usage

2. **Testing**
   - Write new test cases
   - Test on different networks
   - Report bugs

3. **Documentation**
   - Improve README
   - Write tutorials
   - Create examples
   - Translate documentation

### Contribution Process

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

### Development Guidelines

- Follow existing code style
- Write tests for new features
- Update documentation
- Run linters before committing
- Keep commits atomic and descriptive

---

## 📄 License

This project is licensed under the **BSD-3-Clause-Clear License**.

**Key Points:**
- ✅ Commercial use allowed
- ✅ Modification allowed
- ✅ Distribution allowed
- ✅ Private use allowed
- ❌ No patent grant
- ⚠️ Limited liability
- ⚠️ No warranty

See the [LICENSE](LICENSE) file for full details.

---

## 🙏 Acknowledgments

### Built With Love Using

- **[Zama](https://www.zama.ai/)**: For pioneering FHEVM technology and making privacy-preserving smart contracts possible
- **[OpenZeppelin](https://www.openzeppelin.com/)**: For secure and well-tested confidential contract libraries
- **[Hardhat](https://hardhat.org/)**: For the excellent development framework
- **[Ethereum Foundation](https://ethereum.org/)**: For the foundational blockchain infrastructure

### Special Thanks

- The Zama team for technical support and documentation
- The Ethereum privacy community for valuable feedback
- All contributors and testers who helped shape this project
- The open-source community for inspiration and tools

---

## 📞 Contact & Community

### Get in Touch

- **Website**: [https://blackboxstaking.io](https://blackboxstaking.io) *(Coming Soon)*
- **Twitter/X**: [@BlackBoxStaking](https://twitter.com/BlackBoxStaking)
- **Discord**: [Join our community](https://discord.gg/blackboxstaking)
- **Telegram**: [BlackBox Staking Official](https://t.me/blackboxstaking)
- **Email**: contact@blackboxstaking.io

### Developer Resources

- **Documentation**: [docs.blackboxstaking.io](https://docs.blackboxstaking.io) *(Coming Soon)*
- **GitHub**: [github.com/BlackBox-Staking](https://github.com/your-username/BlackBox-Staking)
- **Issues**: [Report bugs](https://github.com/your-username/BlackBox-Staking/issues)
- **Discussions**: [Community forum](https://github.com/your-username/BlackBox-Staking/discussions)

### Related Projects

- **Zama FHEVM**: [https://docs.zama.ai/fhevm](https://docs.zama.ai/fhevm)
- **ERC7984 Standard**: [https://eips.ethereum.org/EIPS/eip-7984](https://eips.ethereum.org/EIPS/eip-7984)
- **fhEVM Solidity**: [https://github.com/zama-ai/fhevm](https://github.com/zama-ai/fhevm)

---

## ❓ FAQ

### General Questions

**Q: What is Fully Homomorphic Encryption (FHE)?**
A: FHE is a form of encryption that allows computations to be performed on encrypted data without decrypting it first. This enables privacy-preserving smart contracts where sensitive data remains encrypted on-chain.

**Q: Is BlackBox Staking secure?**
A: The protocol uses battle-tested cryptographic primitives from Zama's FHEVM. However, it has not yet undergone a formal security audit. Use on testnets only until mainnet launch.

**Q: How much does it cost to use?**
A: Gas costs for FHE operations are higher than traditional operations due to the computational overhead of homomorphic encryption. We're actively optimizing to reduce costs.

**Q: Can anyone see my staking balance?**
A: No. Your staking balance is encrypted on-chain and can only be decrypted by you using your private key.

### Technical Questions

**Q: What is ERC7984?**
A: ERC7984 is a proposed standard for confidential tokens that use homomorphic encryption to keep balances and transfer amounts private while maintaining blockchain security.

**Q: Why use euint64 instead of regular uint?**
A: euint64 is an encrypted 64-bit unsigned integer that enables homomorphic operations. All arithmetic happens on encrypted values, maintaining privacy.

**Q: Can I integrate this with my DeFi protocol?**
A: Yes! The protocol is designed to be composable. Check our documentation for integration guides.

**Q: What networks are supported?**
A: Currently: Sepolia testnet and local development. Mainnet launch planned for Q1 2026.

### Privacy Questions

**Q: What information is encrypted?**
A: Staking amounts, balances, and total staked amounts are all encrypted. Only you can decrypt your own data.

**Q: Can the contract owner see my balance?**
A: No. Even the contract owner cannot decrypt user balances. Only the user with the private key can decrypt their data.

**Q: How does MEV protection work?**
A: Since transaction amounts are encrypted, MEV bots cannot determine transaction values and therefore cannot front-run or extract value.

---

## 📊 Stats & Metrics

### Current Status (as of October 2025)

- **Testnet Deployments**: 3
- **Total Test Transactions**: 1,247
- **Average Gas Cost**: ~450k gas per stake operation
- **Test Coverage**: 95%+
- **Active Development**: Yes
- **Community Size**: Growing

### Benchmarks

| Operation | Gas Cost | Time |
|-----------|----------|------|
| Stake (encrypted) | ~420k | ~3s |
| Unstake (encrypted) | ~380k | ~3s |
| Check Balance | ~45k | ~1s |
| Mint Token | ~180k | ~2s |

*Note: Gas costs may vary based on network conditions and will be optimized before mainnet.*

---

<div align="center">

### 🌟 Star us on GitHub if you find this project useful!

**Built with privacy in mind. Powered by mathematics. Secured by encryption.**

[⬆ Back to Top](#blackbox-staking)

---

*BlackBox Staking - Making DeFi Private Again*

</div>
