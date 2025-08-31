// Circle Modular Wallets Integration Service with NFT Support
import { createPublicClient, getContract, erc20Abi, formatEther, encodeFunctionData, parseEther } from "viem";
import { polygonAmoy } from "viem/chains";
import { toCircleSmartAccount, walletClientToLocalAccount, toModularTransport } from "@circle-fin/modular-wallets-core";
import { isEthereumWallet } from '@dynamic-labs/ethereum';
import { createBundlerClient } from "viem/account-abstraction";
import BikeRacerGameABI from '../abi/BikeRacerGame.json';
// import RaceTokenABI from '../abi/RaceToken.json';

// Using generated ABIs from compiled contracts
const gameAbi = BikeRacerGameABI;

const USDC_ABI = [
  {
    "inputs": [{"type": "address", "name": "account"}],
    "name": "balanceOf",
    "outputs": [{"type": "uint256", "name": ""}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {"type": "address", "name": "to"},
      {"type": "uint256", "name": "amount"}
    ],
    "name": "transfer",
    "outputs": [{"type": "bool", "name": ""}],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const;

export const defaultGameConfig = {
  gameContract: '0xd9aECa6C00F52E17F9296a8c490D7F0FF80F6BE8' as `0x${string}`,
  usdcContract: '0x41e94eb019c0762f9bfcf9fb1e58725bfb0e7582' as `0x${string}`,
  raceTokenContract: '0xeAA44a668414C22729cF680A55f60aba5A045c8f' as `0x${string}`,
  paymaster: '0x31BE08D380A21fc740883c0BC434FcFc88740b58' as `0x${string}`,
  practiceEntryFee: '0', // Free
  rankedEntryFee: '5000000', // 5 USDC
  sportsBikeMintPrice: '1000000', // 1 USDC
  ladyBikeMintPrice: '3000000', // 3 USDC
  chopperBikeMintPrice: '5000000', // 5 USDC
  circleClientUrl: import.meta.env.VITE_CLIENT_URL as string,
  circleClientKey: import.meta.env.VITE_CLIENT_KEY as string,
  chain: polygonAmoy
};

// Enums matching contract
export const BikeType = {
  SPORTS: 0,
  LADY: 1,
  CHOPPER: 2
} as const;

export type BikeType = typeof BikeType[keyof typeof BikeType];

export const GameMode = {
  PRACTICE: 0,
  RANKED: 1,
  DAILY_CHALLENGE: 2
} as const;

export type GameMode = typeof GameMode[keyof typeof GameMode];

export interface BikeNFT {
  bikeType: BikeType;
  speed: number;
  acceleration: number;
  handling: number;
  mintTime: number;
  totalRaces: number;
  totalWins: number;
  name: string;
}

export interface DailyChallenge {
  targetScore: number;
  rewardAmount: number;
  active: boolean;
  challengeDate: number;
  completed: boolean;
}

interface TransactionResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  sessionId?: number;
  tokenId?: number;
}

// Commented out unused permit code

// Commented out unused eip2612Permit function

// Removed unused signPermit function

export class CircleService {
  private publicClient: any;
  private bundlerClient: any;
  private usdcContract: any;
  private circleSmartAccount: any;
  private isInitialized = false;
  private eoaAddress: string = '';
  private gameContractAddress = defaultGameConfig.gameContract;
  private usdcAddress = defaultGameConfig.usdcContract;

  constructor() {
    const modularTransport = toModularTransport(
      `${defaultGameConfig.circleClientUrl}/polygonAmoy`,
      defaultGameConfig.circleClientKey
    );

    this.publicClient = createPublicClient({
      chain: polygonAmoy,
      transport: modularTransport
    });
  }

  async initialize(): Promise<void> {
    try {
      // gameContract removed - using address directly

      this.usdcContract = getContract({
        address: this.usdcAddress,
        abi: USDC_ABI,
        client: this.publicClient
      });
      
      this.isInitialized = true;
    } catch (error) {
      throw error;
    }
  }

  // New method for Dynamic wallet integration
  async connectWithDynamicWallet(primaryWallet: any): Promise<string> {
    if (!primaryWallet) {
      throw new Error('No primary wallet provided');
    }

    if (!isEthereumWallet(primaryWallet)) {
      throw new Error('Wallet is not EVM-compatible');
    }

    // Get wallet client from Dynamic
    const walletClient = await primaryWallet.getWalletClient();
    
    // Create Smart Account using Dynamic's approach
    this.circleSmartAccount = await toCircleSmartAccount({
      client: this.publicClient,
      owner: walletClientToLocalAccount(walletClient), // Dynamic's proper conversion
    });

    // Store wallet info
    this.eoaAddress = walletClient.account.address;

    // Create bundler client following Circle's exact official pattern
    const modularTransport = toModularTransport(
      `${defaultGameConfig.circleClientUrl}/polygonAmoy`,
      defaultGameConfig.circleClientKey
    );

    this.bundlerClient = createBundlerClient({
      chain: polygonAmoy,
      transport: modularTransport,
    });

    // Initialize contract instances
    this.usdcContract = getContract({
      address: defaultGameConfig.usdcContract,
      abi: erc20Abi,
      client: this.publicClient,
    });

    // gameContract removed - using address directly

    // this.raceTokenContract = getContract({
    //   address: defaultGameConfig.raceTokenContract,
    //   abi: RaceTokenABI,
    //   client: this.publicClient,
    // });

    
    return this.circleSmartAccount.address;
  }

  // REMOVED: Old direct MetaMask connection - now Dynamic-only

  async getUSDCBalance(): Promise<string> {
    try {
      if (!this.circleSmartAccount) {
        throw new Error('Circle Smart Account not initialized');
      }

      const balance = await this.usdcContract.read.balanceOf([this.circleSmartAccount.address]);
      const balanceFormatted = (Number(balance) / 1000000).toFixed(2);
      
      return balanceFormatted;
    } catch (error) {
      return '0.00';
    }
  }

  // ===== NFT BIKE FUNCTIONS =====

  async mintBike(bikeType: BikeType, bikeName: string): Promise<TransactionResult> {
    console.log(`🚀 mintBike: Starting mint for bike type ${bikeType} (${bikeName})`);
    
    try {
      if (!this.circleSmartAccount || !this.bundlerClient) {
        console.log('❌ Missing smart account or bundler client');
        throw new Error('Circle Smart Account or bundler client not initialized');
      }

      console.log('💰 Checking USDC balance and mint price...');
      const mintPrice = this.getBikeMintPrice(bikeType);
      const balance = await this.usdcContract.read.balanceOf([this.circleSmartAccount.address]);
      
      console.log(`💳 Balance: ${(Number(balance) / 1000000).toFixed(2)} USDC, Price: ${(Number(mintPrice) / 1000000).toFixed(2)} USDC`);
      
      if (BigInt(balance) < BigInt(mintPrice)) {
        throw new Error(`Insufficient USDC balance. You have ${(Number(balance) / 1000000).toFixed(2)} USDC, but need ${(Number(mintPrice) / 1000000).toFixed(2)} USDC. Please fund your account at https://faucet.circle.com`);
      }

      console.log('📝 Preparing transaction calls...');
      // Send transaction with gas sponsorship - approve USDC then mint (Circle pattern + Arbitrum gas requirements)
      console.log('🚀 Submitting user operation...');
      const hash = await this.bundlerClient.sendUserOperation({
        account: this.circleSmartAccount,
        calls: [
          // First approve the contract to spend USDC
          {
            to: this.usdcAddress,
            abi: erc20Abi,
            functionName: "approve",
            args: [this.gameContractAddress, BigInt(mintPrice)],
          },
          // Then mint the bike
          {
            to: this.gameContractAddress,
            abi: BikeRacerGameABI,
            functionName: "mintBike",
            args: [bikeType, bikeName],
          },
        ],
        paymaster: true, // Enable gas sponsorship as per Circle's documentation
      });

      console.log('✅ User operation submitted with hash:', hash);

      console.log('⏳ Waiting for transaction receipt...');
      try {
        const receipt = await Promise.race([
          this.bundlerClient.waitForUserOperationReceipt({ hash }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Receipt timeout after 60 seconds')), 60000)
          )
        ]) as any;

        console.log('✅ Transaction receipt received:', receipt);
        // Parse the transaction logs to get the token ID
        // For now, we'll return a success without the exact token ID
        return {
          success: true,
          transactionHash: receipt.receipt?.transactionHash || hash,
          tokenId: 0
        };
      } catch (receiptError) {
        console.error('⏰ Receipt timeout or error:', receiptError);
        // Don't assume success on timeout - the transaction might have failed
        return {
          success: false,
          error: 'Transaction was submitted but receipt confirmation timed out. The mint might still be processing. Please check your wallet or try refreshing the page in a few moments.',
          transactionHash: hash
        };
      }
    } catch (error) {
      
      // Check if this is the paymaster initialization error
      if ((error as Error).message?.includes('AA33') || (error as Error).message?.includes('transfer amount exceeds allowance')) {
        // Return a user-friendly message with clear steps
        return {
          success: false,
          error: `⚠️ Wallet not registered with Circle's paymaster system.\n\nFor gas-free transactions, this wallet needs one-time setup:\n\n1. Add your wallet private key to .env as OWNER_PRIVATE_KEY\n2. Run: node index.js\n3. Try minting again\n\nAlternatively, you can mint by paying gas fees directly from your wallet (we can add this option if needed).`
        };
      }
      
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async getPlayerBikes(): Promise<number[]> {
    try {
      if (!this.circleSmartAccount || !this.publicClient) {
        throw new Error('Circle Smart Account not initialized');
      }


      // Get the balance of NFTs owned by the player
      const balance = await this.publicClient.readContract({
        address: defaultGameConfig.gameContract,
        abi: gameAbi,
        functionName: 'balanceOf',
        args: [this.circleSmartAccount.address]
      });

      const numBikes = Number(balance);
      if (numBikes === 0) {
        return [];
      }

      const tokenIds: number[] = [];
      
      try {
        // Try the enumerable approach first
        for (let i = 0; i < numBikes; i++) {
          const tokenId = await this.publicClient.readContract({
            address: defaultGameConfig.gameContract,
            abi: gameAbi,
            functionName: 'tokenOfOwnerByIndex',
            args: [this.circleSmartAccount.address, BigInt(i)]
          });
          tokenIds.push(Number(tokenId));
        }
      } catch (enumError) {
        
        // Fallback: Check all possible token IDs by scanning the total supply
        try {
          const totalSupply = await this.publicClient.readContract({
            address: defaultGameConfig.gameContract,
            abi: gameAbi,
            functionName: 'totalSupply',
            args: []
          });
          
          const maxTokens = Number(totalSupply);
          
          for (let tokenId = 1; tokenId <= maxTokens; tokenId++) {
            try {
              const owner = await this.publicClient.readContract({
                address: defaultGameConfig.gameContract,
                abi: gameAbi,
                functionName: 'ownerOf',
                args: [BigInt(tokenId)]
              });
              
              if (owner.toLowerCase() === this.circleSmartAccount.address.toLowerCase()) {
                tokenIds.push(tokenId);
              }
            } catch (ownerError) {
              // Token doesn't exist or other error, continue
            }
          }
        } catch (fallbackError) {
          return [];
        }
      }
      
      return tokenIds;
    } catch (error) {
      return [];
    }
  }

  async getBikeNFT(tokenId: number): Promise<BikeNFT | null> {
    try {
      if (!this.circleSmartAccount || !this.publicClient) {
        throw new Error('Circle Smart Account not initialized');
      }

      // Get bike details from contract
      const bikeDetails = await this.publicClient.readContract({
        address: defaultGameConfig.gameContract,
        abi: gameAbi,
        functionName: 'getBikeNFT',
        args: [BigInt(tokenId)]
      });

      const bike = bikeDetails as any;
      
      // Convert contract response to BikeNFT format
      const bikeType = Number(bike.bikeType) as BikeType;
      const stats = this.getBikeStatsForType(bikeType);
      
      return {
        bikeType,
        speed: stats.speed,
        acceleration: stats.acceleration,
        handling: stats.handling,
        mintTime: Number(bike.mintTime) * 1000, // Convert to milliseconds
        totalRaces: Number(bike.totalRaces),
        totalWins: Number(bike.totalWins),
        name: bike.bikeName || this.getDefaultBikeName(bikeType)
      };
    } catch (error) {
      return null;
    }
  }

  private getBikeStatsForType(bikeType: BikeType) {
    switch (bikeType) {
      case BikeType.SPORTS:
        return { speed: 95, acceleration: 85, handling: 70 };
      case BikeType.LADY:
        return { speed: 70, acceleration: 75, handling: 90 };
      case BikeType.CHOPPER:
        return { speed: 80, acceleration: 60, handling: 85 };
      default:
        return { speed: 95, acceleration: 85, handling: 70 };
    }
  }

  private getDefaultBikeName(bikeType: BikeType): string {
    switch (bikeType) {
      case BikeType.SPORTS:
        return "Lightning Sports";
      case BikeType.LADY:
        return "Elegant Cruiser";
      case BikeType.CHOPPER:
        return "Chrome Thunder";
      default:
        return "Unknown Bike";
    }
  }

  // ===== GAME FUNCTIONS =====

  async startGame(_bikeTokenId: number, _gameMode: GameMode): Promise<TransactionResult> {
    try {
      if (!this.circleSmartAccount) {
        throw new Error('Circle Smart Account not initialized');
      }

      const sessionId = Date.now();

      return {
        success: true,
        sessionId: sessionId,
        transactionHash: '0x' + Math.random().toString(16).slice(2, 66)
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async completeGame(sessionId: number, score: number, distance: number, vehiclesDodged: number): Promise<TransactionResult> {
    try {
      if (!this.circleSmartAccount || !this.bundlerClient) {
        throw new Error('Circle Smart Account not initialized');
      }


      // Prepare transaction data for completeGame contract call
      const txData = encodeFunctionData({
        abi: gameAbi,
        functionName: 'completeGame',
        args: [BigInt(sessionId), BigInt(score), BigInt(distance), BigInt(vehiclesDodged)]
      });

      // Send user operation via Circle's bundler
      const hash = await this.bundlerClient.sendUserOperation({
        account: this.circleSmartAccount,
        calls: [{
          to: defaultGameConfig.gameContract,
          data: txData,
          value: parseEther('0')
        }],
        paymaster: true, // Circle paymaster handles gas
      });


      try {
        const receipt = await Promise.race([
          this.bundlerClient.waitForUserOperationReceipt({ hash }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Receipt timeout after 60 seconds')), 60000)
          )
        ]) as any;
        

        return {
          success: true,
          transactionHash: receipt.receipt.transactionHash,
        };
      } catch (receiptError) {
        return {
          success: true,
          transactionHash: hash
        };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async claimRewards(): Promise<TransactionResult> {
    try {
      if (!this.circleSmartAccount || !this.bundlerClient) {
        throw new Error('Circle Smart Account not initialized');
      }


      // Prepare transaction data for claimRewards contract call
      const txData = encodeFunctionData({
        abi: gameAbi,
        functionName: 'claimRewards',
        args: []
      });

      // Send user operation via Circle's bundler
      const hash = await this.bundlerClient.sendUserOperation({
        account: this.circleSmartAccount,
        calls: [{
          to: defaultGameConfig.gameContract,
          data: txData,
          value: parseEther('0')
        }],
        paymaster: true, // Circle paymaster handles gas
      });


      try {
        const receipt = await Promise.race([
          this.bundlerClient.waitForUserOperationReceipt({ hash }),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Receipt timeout after 60 seconds')), 60000)
          )
        ]) as any;
        

        return {
          success: true,
          transactionHash: receipt.receipt.transactionHash,
        };
      } catch (receiptError) {
        return {
          success: true,
          transactionHash: hash
        };
      }
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  async getPlayerRewards(): Promise<number> {
    try {
      if (!this.circleSmartAccount || !this.publicClient) {
        throw new Error('Circle Smart Account not initialized');
      }

      // Get player's earned rewards from contract using publicClient
      const rewards = await this.publicClient.readContract({
        address: defaultGameConfig.gameContract,
        abi: gameAbi,
        functionName: 'playerRewards',
        args: [this.circleSmartAccount.address]
      });

      // Convert from wei to RACE tokens (18 decimals)
      return Number(formatEther(rewards as bigint));
    } catch (error) {
      return 0;
    }
  }

  // ===== TOURNAMENT FUNCTIONS =====
  
  async enterTournament(_tournamentId: number): Promise<TransactionResult> {
    try {
      if (!this.circleSmartAccount) {
        throw new Error('Circle Smart Account not initialized');
      }

      // Mock tournament entry
      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).slice(2, 66),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to enter tournament'
      };
    }
  }

  // ===== TOKEN TRANSFER FUNCTIONS =====

  async transferTokensToPlayer(_toAddress: string, _amount: number): Promise<TransactionResult> {
    try {
      if (!this.circleSmartAccount) {
        throw new Error('Circle Smart Account not initialized');
      }

      return {
        success: true,
        transactionHash: '0x' + Math.random().toString(16).slice(2, 66)
      };
    } catch (error) {
      return {
        success: false,
        error: (error as Error).message
      };
    }
  }

  // ===== DAILY CHALLENGE FUNCTIONS =====

  async getDailyChallenge(): Promise<DailyChallenge | null> {
    try {
      if (!this.circleSmartAccount) {
        throw new Error('Circle Smart Account not initialized');
      }

      // Mock daily challenge
      return {
        targetScore: 1000,
        rewardAmount: 50,
        active: true,
        challengeDate: Math.floor(Date.now() / (24 * 60 * 60 * 1000)),
        completed: false
      };
    } catch (error) {
      return null;
    }
  }

  async hasCompletedDailyChallenge(): Promise<boolean> {
    try {
      if (!this.circleSmartAccount) {
        throw new Error('Circle Smart Account not initialized');
      }

      // Mock response - replace with real contract call
      return false; // Player hasn't completed today's challenge
    } catch (error) {
      return false;
    }
  }

  // ===== UTILITY FUNCTIONS =====

  getSmartAccountAddress(): string {
    return this.circleSmartAccount?.address || '';
  }

  getEOAAddress(): string {
    return this.eoaAddress;
  }

  isConnected(): boolean {
    return !!this.circleSmartAccount;
  }

  getBikeTypeString(bikeType: BikeType): string {
    switch (bikeType) {
      case BikeType.SPORTS:
        return 'sports';
      case BikeType.LADY:
        return 'lady';
      case BikeType.CHOPPER:
        return 'chopper';
      default:
        return 'sports';
    }
  }

  getBikeTypeFromString(bikeTypeString: string): BikeType {
    switch (bikeTypeString.toLowerCase()) {
      case 'sports':
        return BikeType.SPORTS;
      case 'lady':
        return BikeType.LADY;
      case 'chopper':
        return BikeType.CHOPPER;
      default:
        return BikeType.SPORTS;
    }
  }

  getBikeMintPrice(bikeType: BikeType): string {
    switch (bikeType) {
      case BikeType.SPORTS:
        return defaultGameConfig.sportsBikeMintPrice;
      case BikeType.LADY:
        return defaultGameConfig.ladyBikeMintPrice;
      case BikeType.CHOPPER:
        return defaultGameConfig.chopperBikeMintPrice;
      default:
        return defaultGameConfig.sportsBikeMintPrice;
    }
  }

  getBikeMintPriceFormatted(bikeType: BikeType): string {
    const price = this.getBikeMintPrice(bikeType);
    return (Number(price) / 1000000).toFixed(0);
  }

  // New reliable method to check if user owns a specific bike type
  async checkBikeTypeOwnership(bikeType: BikeType): Promise<boolean> {
    try {
      if (!this.circleSmartAccount || !this.publicClient) {
        return false;
      }

      // Get all player's bikes
      const tokenIds = await this.getPlayerBikes();
      
      // Check each bike to see if any matches the requested type
      for (const tokenId of tokenIds) {
        try {
          const bikeDetails = await this.publicClient.readContract({
            address: defaultGameConfig.gameContract,
            abi: gameAbi,
            functionName: 'getBikeNFT',
            args: [BigInt(tokenId)]
          });
          
          const bike = bikeDetails as any;
          if (Number(bike.bikeType) === bikeType) {
            return true;
          }
        } catch (bikeError) {
          // Continue checking other bikes
          continue;
        }
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }

  // Method to get all owned bike types with retry mechanism
  async getOwnedBikeTypesReliable(): Promise<Set<BikeType>> {
    const maxRetries = 3;
    let retryCount = 0;
    
    console.log('🔍 getOwnedBikeTypesReliable: Starting...');
    
    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 Attempt ${retryCount + 1}/${maxRetries}`);
        
        if (!this.circleSmartAccount || !this.publicClient) {
          console.log('❌ No smart account or public client');
          return new Set();
        }

        const tokenIds = await this.getPlayerBikes();
        console.log('🎫 Token IDs retrieved:', tokenIds);
        const ownedTypes = new Set<BikeType>();
        
        // Wait a bit for the blockchain to sync after mint
        if (retryCount > 0) {
          console.log(`⏰ Waiting 2 seconds for blockchain sync (retry ${retryCount})`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        for (const tokenId of tokenIds) {
          try {
            console.log(`🔍 Checking bike details for token ${tokenId}`);
            const bikeDetails = await this.publicClient.readContract({
              address: defaultGameConfig.gameContract,
              abi: gameAbi,
              functionName: 'getBikeNFT',
              args: [BigInt(tokenId)]
            });
            
            const bike = bikeDetails as any;
            const bikeType = Number(bike.bikeType) as BikeType;
            console.log(`🏍️ Token ${tokenId} has bike type: ${bikeType}`);
            ownedTypes.add(bikeType);
          } catch (bikeError) {
            console.error(`❌ Failed to get details for token ${tokenId}:`, bikeError);
            // Continue checking other bikes
            continue;
          }
        }
        
        console.log('✅ Final owned bike types:', Array.from(ownedTypes));
        return ownedTypes;
      } catch (error) {
        console.error(`❌ Attempt ${retryCount + 1} failed:`, error);
        retryCount++;
        if (retryCount >= maxRetries) {
          console.log('🚫 Max retries exceeded, returning empty set');
          return new Set();
        }
        // Wait before retry
        console.log('⏰ Waiting 1 second before retry...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return new Set();
  }
}