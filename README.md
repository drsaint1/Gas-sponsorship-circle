# 🏍️ Circle Bike Runner

A cutting-edge Web3 racing game built with **Circle's Modular Wallets** that delivers gasless gameplay and seamless token rewards. Race NFT bikes, earn RACE tokens, and experience the future of blockchain gaming!

![Game Banner](https://img.shields.io/badge/Web3-Gaming-blue) ![Circle](https://img.shields.io/badge/Circle-Modular%20Wallets-green) ![Polygon](https://img.shields.io/badge/Polygon-Amoy-purple) ![TypeScript](https://img.shields.io/badge/TypeScript-React-blue)

## ✨ Features

### 🎮 **Core Gameplay**
- **Endless Runner**: Dodge vehicles and collect power-ups in an immersive 3D environment
- **NFT Bikes**: Mint and own unique bike NFTs with different stats (Sports, Lady's, Chopper)
- **Multiple Game Modes**: Practice, Ranked races, and Daily Challenges
- **Real-time Scoring**: Distance, vehicles dodged, and bonus collection tracking

### 💎 **Web3 Integration**
- **Gasless Transactions**: Powered by Circle's Smart Account paymaster
- **USDC Payments**: Purchase bikes and pay entry fees with USDC
- **RACE Token Rewards**: Earn tokens automatically claimed to your wallet
- **Smart Account**: Enhanced UX with account abstraction
- **Multi-Wallet Support**: Connect via MetaMask, WalletConnect, and more

### 🚀 **Technical Highlights**
- **Circle Modular Wallets**: State-of-the-art wallet infrastructure
- **Dynamic Wallet Integration**: Seamless wallet connection experience
- **Polygon Amoy**: Fast and affordable blockchain transactions
- **Three.js 3D Graphics**: Smooth, responsive game rendering
- **TypeScript**: Full type safety throughout the codebase

## 🎯 How to Play

### 1. **Connect Your Wallet**
- Visit the game and click the wallet button in the top-right corner
- Connect your preferred wallet (MetaMask, WalletConnect, etc.)
- Your Circle Smart Account will be automatically created

### 2. **Get USDC**
- Fund your wallet with USDC on Polygon Amoy testnet
- Use the [Circle Faucet](https://faucet.circle.com) for testnet USDC

### 3. **Mint Your First Bike**
- Choose from three bike types with different stats:
  - **Sports Bike** (1 USDC): Balanced stats, great for beginners
  - **Lady's Bike** (3 USDC): High handling, perfect for precision racing  
  - **Chopper Bike** (5 USDC): Maximum speed, for experienced racers

### 4. **Start Racing**
- Select your bike and choose a game mode
- **Practice**: Free racing to learn the controls
- **Ranked**: Pay 5 USDC entry fee, earn RACE tokens
- **Daily Challenge**: Special objectives with bonus rewards

### 5. **Master the Controls**
- **A/← Key**: Move left
- **D/→ Key**: Move right  
- **Space**: Use power-ups (when available)
- **Dodge vehicles**: +10 points each
- **Collect bonuses**: +30 points each
- **Grab golden keys**: Unlock invisibility power-up

### 6. **Earn Rewards**
- RACE tokens are automatically earned based on performance
- Tokens are instantly claimed to your wallet after each race
- Build up your collection and compete for higher scores!

## 🛠️ Development Setup

### Prerequisites
- **Node.js** 18+ and **npm**
- **Git** for version control
- **Circle Developer Account** ([Sign up here](https://console.circle.com/))
- **Dynamic Account** ([Sign up here](https://app.dynamic.xyz/))

### 1. Clone and Install
```bash
git clone <repository-url>
cd game-frontend
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Circle Configuration (Required)
VITE_CLIENT_KEY=TEST_CLIENT_KEY:your_client_key_here
VITE_CLIENT_URL=https://modular-sdk.circle.com/v1/rpc/w3s/buidl

# Dynamic Wallet (Required)  
VITE_DYNAMIC_ENV_ID=your_dynamic_environment_id_here

# Contract Addresses (Update after deployment)
VITE_GAME_CONTRACT_ADDRESS=your_deployed_game_contract
VITE_RACE_TOKEN_ADDRESS=your_deployed_race_token_contract
VITE_PAYMASTER_ADDRESS=your_paymaster_contract
```

### 3. Deploy Smart Contracts
```bash
# Navigate to contracts directory
cd contracts

# Install dependencies
npm install

# Deploy contracts to Polygon Amoy
npx hardhat deploy --network polygonAmoy

# Update .env with deployed addresses
```

### 4. Run Development Server
```bash
npm run dev
```

Visit `http://localhost:5173` to see your game!

## 📋 Environment Variables Reference

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_CLIENT_KEY` | Circle Modular Wallets client key | ✅ | `TEST_CLIENT_KEY:abc123...` |
| `VITE_CLIENT_URL` | Circle SDK endpoint | ✅ | `https://modular-sdk.circle.com/v1/rpc/w3s/buidl` |
| `VITE_DYNAMIC_ENV_ID` | Dynamic wallet environment ID | ✅ | `37855f3f-9b8b-49df-86dd-92f6801f711a` |
| `VITE_GAME_CONTRACT_ADDRESS` | Main game contract address | ✅ | `0xd9aE...` |
| `VITE_USDC_ADDRESS` | USDC token contract (Polygon Amoy) | ✅ | `0x41e9...` |
| `VITE_RACE_TOKEN_ADDRESS` | RACE token contract address | ✅ | `0xeAA4...` |
| `VITE_PAYMASTER_ADDRESS` | Paymaster for gasless transactions | ✅ | `0x31BE...` |
| `VITE_CHAIN_ID` | Network chain ID (80002 for Amoy) | ✅ | `80002` |
| `VITE_RPC_URL` | Polygon Amoy RPC endpoint | ✅ | `https://rpc-amoy.polygon.technology` |
| `PRIVATE_KEY` | Deploy key (development only) | 🔧 | `0x1234...` |

## 🏗️ Project Structure

```
├── src/
│   ├── components/           # React components
│   │   ├── GameMenu.tsx     # Main game interface
│   │   ├── WalletStatus.tsx # Wallet connection UI
│   │   └── TournamentList.tsx # Tournament features
│   ├── context/
│   │   └── GameContext.tsx  # Game state management
│   ├── services/
│   │   └── CircleService.ts # Circle & blockchain integration
│   ├── abi/                 # Contract ABIs
│   ├── BikeRunner.tsx       # Main game component (Three.js)
│   └── App.tsx             # App routing and wallet setup
├── contracts/               # Smart contracts (Solidity)
│   ├── BikeRacerGame.sol   # Main game contract
│   └── RaceToken.sol       # ERC20 reward token
├── public/                 # Static assets
└── package.json           # Dependencies and scripts
```

## 🎨 Game Architecture

### Frontend (React + TypeScript)
- **Vite**: Lightning-fast development and building
- **Three.js**: 3D graphics rendering for smooth gameplay
- **React Context**: Centralized game state management
- **Dynamic SDK**: Wallet connection and user management

### Blockchain (Polygon Amoy)
- **Circle Modular Wallets**: Account abstraction and gasless transactions
- **Smart Contracts**: Game logic, NFT minting, and reward distribution
- **USDC Integration**: Stable payment system
- **ERC20 Rewards**: RACE token distribution system

### Key Components

#### `GameContext.tsx`
Central state management for:
- Wallet connection status
- NFT bike ownership and selection  
- Game session tracking
- Reward balances and claiming

#### `CircleService.ts`
Blockchain integration layer:
- Circle Smart Account management
- Contract interactions (mint, race, claim)
- Transaction bundling and gas sponsorship
- Error handling and retry logic

#### `BikeRunner.tsx`  
Core game engine:
- Three.js 3D scene management
- Physics and collision detection
- Input handling and game loop
- Score calculation and progression

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
```bash
# Build for production
npm run build

# Deploy dist/ folder to your hosting platform
```

### Contract Deployment
```bash
# Deploy to Polygon Amoy
npx hardhat deploy --network polygonAmoy

# Verify contracts
npx hardhat verify --network polygonAmoy <contract-address>
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Test smart contracts
cd contracts && npx hardhat test
```

## 📱 Supported Wallets

- **MetaMask** - Browser extension and mobile
- **WalletConnect** - Mobile wallet connection
- **Coinbase Wallet** - Native integration
- **Rainbow** - Mobile-first experience
- **Trust Wallet** - Multi-platform support

## ⛓️ Supported Networks

- **Polygon Amoy Testnet** (Primary)
  - Chain ID: 80002
  - RPC: https://rpc-amoy.polygon.technology
  - Faucet: https://faucet.polygon.technology

## 💰 Token Economics

### RACE Token
- **Symbol**: RACE  
- **Decimals**: 18
- **Utility**: In-game rewards and future governance
- **Distribution**: Performance-based gameplay rewards

### Pricing
- **Sports Bike**: 1 USDC
- **Lady's Bike**: 3 USDC  
- **Chopper Bike**: 5 USDC
- **Ranked Race Entry**: 5 USDC

## 🛡️ Security

- **Audited Smart Contracts**: Battle-tested code patterns
- **Account Abstraction**: Enhanced security via Circle's infrastructure
- **No Private Key Management**: Circle handles key security
- **Gasless Transactions**: Eliminate user gas payment friction
- **Testnet First**: Thorough testing before mainnet deployment

## 🤝 Contributing

1. **Fork the repository**
2. **Create feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit changes**: `git commit -m 'Add amazing feature'`
4. **Push to branch**: `git push origin feature/amazing-feature`
5. **Open Pull Request**

### Development Guidelines
- Write TypeScript with strict mode
- Add tests for new features
- Follow existing code style
- Update documentation for API changes

## 📞 Support & Community

- **Documentation**: [Circle Docs](https://developers.circle.com/)
- **Discord**: Join our gaming community
- **GitHub Issues**: Bug reports and feature requests
- **Email**: support@yourdomain.com

## 🏆 Roadmap

### Phase 1 - Core Game ✅
- ✅ Basic racing mechanics
- ✅ NFT bike system
- ✅ RACE token rewards
- ✅ Circle integration

### Phase 2 - Enhanced Features 🚧
- 🔄 Tournament system
- 🔄 Leaderboards
- 🔄 Daily challenges
- 🔄 Power-up marketplace

### Phase 3 - Advanced Gaming 📋
- 📋 Multiplayer races
- 📋 Bike customization
- 📋 Guild system
- 📋 Mainnet deployment

### Phase 4 - Ecosystem 🔮
- 🔮 Mobile app
- 🔮 VR support
- 🔮 Cross-chain integration
- 🔮 DAO governance

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This is a testnet application for demonstration purposes. Always verify contract addresses and never share private keys. The game uses testnet tokens which have no real value.

---

<div align="center">

**Built with ❤️ using Circle Modular Wallets**

[🎮 Play Now](https://your-game-url.com) • [📖 Docs](https://docs.your-domain.com) • [💬 Discord](https://discord.gg/your-server)

</div>
