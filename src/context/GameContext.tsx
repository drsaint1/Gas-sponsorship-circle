// Enhanced Game state management with NFT bikes and Dynamic wallet integration
import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { CircleService } from '../services/CircleService';
import type { BikeNFT, BikeType, DailyChallenge } from '../services/CircleService';
import { GameMode } from '../services/CircleService';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { isEthereumWallet } from '@dynamic-labs/ethereum';

interface GameSession {
  sessionId: number;
  player: string;
  score: number;
  distance: number;
  vehiclesDodged: number;
  timestamp: number;
  completed: boolean;
  rewardsClaimed: string;
}

interface Tournament {
  id: number;
  entryFee: string;
  prizePool: string;
  startTime: number;
  endTime: number;
  playerCount: number;
  finalized: boolean;
  winner?: string;
}

interface OwnedBike extends BikeNFT {
  tokenId: number;
}

interface GameContextType {
  circleService: CircleService | null;
  isConnected: boolean;
  walletAddress: string;
  smartAccountAddress: string;
  usdcBalance: string;
  
  // NFT Bike System
  ownedBikes: OwnedBike[];
  selectedBike: OwnedBike | null;
  hasAnyBikes: boolean;
  mintedBikeTypes: Set<BikeType>;
  
  // Game State
  currentSessionId: number | null;
  currentGameMode: GameMode | null;
  gameStarted: boolean;
  gameCompleted: boolean;
  
  // Daily Challenges
  dailyChallenge: DailyChallenge | null;
  hasDailyChallenge: boolean;
  
  // UI State
  loading: boolean;
  error: string | null;
  
  // Game Data
  playerSessions: GameSession[];
  activeTournaments: Tournament[];
  playerRewards: string;
  raceTokenBalance: number;
  
  // Actions
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  
  // NFT Actions
  mintBike: (bikeType: BikeType, bikeName: string) => Promise<void>;
  selectBike: (bike: OwnedBike) => void;
  
  // Game Actions
  startNewGame: (gameMode: GameMode) => Promise<void>;
  completeCurrentGame: (score: number, distance: number, vehiclesDodged: number) => Promise<void>;
  
  // Tournament Actions
  joinTournament: (tournamentId: number) => Promise<void>;
  
  // Token Actions
  claimPlayerRewards: () => Promise<void>;
  transferTokensToPlayer: (toAddress: string, amount: number) => Promise<void>;
  
  // Utility Actions
  refreshData: () => Promise<void>;
  loadDailyChallenge: () => Promise<void>;
  clearError: () => void;
}

const GameContext = createContext<GameContextType | null>(null);

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  const { primaryWallet } = useDynamicContext(); // Get Dynamic wallet context
  const [circleService, setCircleService] = useState<CircleService | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [walletAddress, setWalletAddress] = useState(''); // EOA wallet
  const [smartAccountAddress, setSmartAccountAddress] = useState(''); // Smart Account
  const [usdcBalance, setUsdcBalance] = useState('0');
  
  // NFT Bike State
  const [ownedBikes, setOwnedBikes] = useState<OwnedBike[]>([]);
  const [selectedBike, setSelectedBike] = useState<OwnedBike | null>(null);
  const [hasAnyBikes, setHasAnyBikes] = useState(false);
  const [mintedBikeTypes, setMintedBikeTypes] = useState<Set<BikeType>>(new Set());
  
  // Game State
  const [currentSessionId, setCurrentSessionId] = useState<number | null>(null);
  const [currentGameMode, setCurrentGameMode] = useState<GameMode | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  
  // Daily Challenge State
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [hasDailyChallenge, setHasDailyChallenge] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [playerSessions, setPlayerSessions] = useState<GameSession[]>([]);
  const [activeTournaments, setActiveTournaments] = useState<Tournament[]>([]);
  const [playerRewards, setPlayerRewards] = useState('0');
  const [raceTokenBalance, setRaceTokenBalance] = useState(0);

  const connectWallet = useCallback(async () => {
    console.log('🚀 connectWallet called');
    
    if (!primaryWallet) {
      console.log('❌ No primary wallet available');
      setError('No wallet connected. Please connect your wallet using the Dynamic widget above.');
      return;
    }

    if (!isEthereumWallet(primaryWallet)) {
      console.log('❌ Not an Ethereum wallet');
      setError('Please connect an Ethereum-compatible wallet.');
      return;
    }

    console.log('⏳ Starting wallet connection process...');
    setLoading(true);
    setError(null);
    
    try {
      const service = new CircleService();
      await service.initialize();
      
      // Use Dynamic's wallet connection method
      const smartAccountAddress = await service.connectWithDynamicWallet(primaryWallet);
      
      setCircleService(service);
      setWalletAddress(service.getEOAAddress());
      setSmartAccountAddress(smartAccountAddress);
      
      const balance = await service.getUSDCBalance();
      setUsdcBalance(balance);
      
      setIsConnected(true);
      await loadDailyChallenge();
      await loadGameData(); // Load after circle service is set
      
      
      setLoading(false);
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }, [primaryWallet]);

  const disconnectWallet = () => {
    setIsConnected(false);
    setWalletAddress('');
    setSmartAccountAddress('');
    setUsdcBalance('0');
    setCircleService(null);
    setCurrentSessionId(null);
    setCurrentGameMode(null);
    setGameStarted(false);
    setGameCompleted(false);
    setPlayerRewards('0');
    setRaceTokenBalance(0);
    setOwnedBikes([]);
    setSelectedBike(null);
    setHasAnyBikes(false);
    setDailyChallenge(null);
    setHasDailyChallenge(false);
  };

  const loadGameData = async () => {
    try {
      if (!circleService) return;
      
      setActiveTournaments([
        {
          id: 1,
          entryFee: '5000000',
          prizePool: '50000000',
          startTime: Date.now(),
          endTime: Date.now() + (24 * 60 * 60 * 1000),
          playerCount: 12,
          finalized: false,
        },
      ]);
      
      // Load actual rewards from blockchain
      const rewards = await circleService.getPlayerRewards();
      setPlayerRewards(rewards.toString());
      setRaceTokenBalance(rewards);
      
      setPlayerSessions([]);
    } catch (err) {
      console.error('Error loading game data:', err);
      setPlayerRewards('0');
      setRaceTokenBalance(0);
    }
  };

  // ===== NFT BIKE FUNCTIONS =====
  
  const loadPlayerBikes = useCallback(async () => {
    if (!isConnected || !circleService) {
      console.log('❌ loadPlayerBikes: Not connected or no service');
      return;
    }
    
    console.log('🔄 Loading player bikes...');
    
    try {
      // Use the more reliable method to get owned bike types
      const ownedBikeTypes = await circleService.getOwnedBikeTypesReliable();
      console.log('📋 Owned bike types from blockchain:', Array.from(ownedBikeTypes));
      setMintedBikeTypes(ownedBikeTypes);
      
      // Also get the full bike details for game selection
      const bikeTokenIds = await circleService.getPlayerBikes();
      console.log('🎫 Token IDs found:', bikeTokenIds);
      const bikes: OwnedBike[] = [];
      
      for (const tokenId of bikeTokenIds) {
        const bikeNFT = await circleService.getBikeNFT(tokenId);
        if (bikeNFT) {
          console.log(`🏍️ Bike ${tokenId}:`, bikeNFT);
          bikes.push({ ...bikeNFT, tokenId });
        }
      }
      
      console.log('✅ Total bikes loaded:', bikes.length);
      setOwnedBikes(bikes);
      setHasAnyBikes(bikes.length > 0);
      
      if (bikes.length > 0 && !selectedBike) {
        setSelectedBike(bikes[0]);
      }
    } catch (err) {
      console.error('❌ Error loading player bikes:', err);
      setOwnedBikes([]);
      setHasAnyBikes(false);
      setMintedBikeTypes(new Set());
    }
  }, [isConnected, circleService]);
  

  const mintBike = async (bikeType: BikeType, bikeName: string) => {
    if (!isConnected || !circleService) {
      setError('Wallet not connected');
      return;
    }
    
    console.log(`🚀 Starting mint for bike type ${bikeType} (${bikeName})`);
    setLoading(true);
    setError(null);
    
    try {
      const result = await circleService.mintBike(bikeType, bikeName);
      console.log('💰 Mint result:', result);
      
      if (result.success) {
        console.log('✅ Mint successful, updating UI immediately');
        // Immediately show as minted in UI
        setMintedBikeTypes(prev => new Set([...prev, bikeType]));
        
        // Wait for blockchain to sync, then verify on-chain
        console.log('⏰ Waiting 2 seconds before verification...');
        setTimeout(async () => {
          try {
            console.log(`🔍 Verifying bike type ${bikeType} ownership on-chain...`);
            // Verify the bike is actually owned on-chain
            const isActuallyOwned = await circleService.checkBikeTypeOwnership(bikeType);
            console.log(`🎯 Verification result for bike type ${bikeType}:`, isActuallyOwned);
            
            if (isActuallyOwned) {
              console.log('✅ Confirmed on-chain, refreshing data...');
              // Confirmed on-chain, refresh all data
              await loadPlayerBikes();
              const newBalance = await circleService.getUSDCBalance();
              setUsdcBalance(newBalance);
            } else {
              console.log('⏳ Not found on-chain yet, trying again in 5 seconds...');
              // Not found on-chain yet, try again after longer delay
              setTimeout(async () => {
                console.log('🔄 Second verification attempt...');
                await loadPlayerBikes();
                const newBalance = await circleService.getUSDCBalance();
                setUsdcBalance(newBalance);
              }, 5000);
            }
          } catch (verifyError) {
            console.error('❌ Verification failed, doing fallback refresh:', verifyError);
            // Fallback - just refresh data anyway
            await loadPlayerBikes();
            const newBalance = await circleService.getUSDCBalance();
            setUsdcBalance(newBalance);
          }
        }, 2000);
        
      } else {
        // Handle timeout case specially
        if (result.error?.includes('timeout')) {
          console.log('⏰ Transaction timed out, but may still be processing...');
          // Don't update UI immediately for timeout case
          // Set a longer retry for verification
          setTimeout(async () => {
            console.log('🔄 Checking if timed-out transaction completed...');
            await loadPlayerBikes();
            const newBalance = await circleService.getUSDCBalance();
            setUsdcBalance(newBalance);
          }, 10000); // Wait 10 seconds for timeouts
        }
        throw new Error(result.error || 'Failed to mint bike');
      }
    } catch (err) {
      console.error('❌ Mint failed:', err);
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  const selectBike = (bike: OwnedBike) => {
    setSelectedBike(bike);
  };
  
  // ===== GAME FUNCTIONS =====
  
  const startNewGame = async (gameMode: GameMode) => {
    if (!isConnected || !circleService) {
      setError('Wallet not connected');
      return;
    }
    
    if (!selectedBike) {
      setError('No bike selected. Please select a bike to race.');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await circleService.startGame(selectedBike.tokenId, gameMode);
      
      if (result.success) {
        setCurrentSessionId(result.sessionId || Date.now());
        setCurrentGameMode(gameMode);
        setGameStarted(true);
        setGameCompleted(false);
        
        // Update balance if it's a ranked race (has entry fee)
        if (gameMode === GameMode.RANKED) {
          const newBalance = await circleService.getUSDCBalance();
          setUsdcBalance(newBalance);
        }
      } else {
        throw new Error(result.error || 'Failed to start game');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const completeCurrentGame = async (score: number, distance: number, vehiclesDodged: number) => {
    if (!isConnected || !circleService || currentSessionId === null) {
      setError('No active game session');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await circleService.completeGame(currentSessionId, score, distance, vehiclesDodged);
      
      if (result.success) {
        setGameCompleted(true);
        setGameStarted(false);
        setCurrentGameMode(null);
        
        // Don't auto-claim rewards - let player claim manually
        // Refresh rewards from blockchain to get updated balance
        try {
          const updatedRewards = await circleService.getPlayerRewards();
          setPlayerRewards(updatedRewards.toString());
          setRaceTokenBalance(updatedRewards);
        } catch (rewardError) {
          console.error('Failed to refresh rewards:', rewardError);
        }
      } else {
        throw new Error(result.error || 'Failed to complete game');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const joinTournament = async (tournamentId: number) => {
    if (!isConnected || !circleService) {
      setError('Wallet not connected');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await circleService.enterTournament(tournamentId);
      
      if (result.success) {
        const newBalance = await circleService.getUSDCBalance();
        setUsdcBalance(newBalance);
      } else {
        throw new Error(result.error || 'Failed to join tournament');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Claim rewards
  const claimPlayerRewards = async () => {
    if (!isConnected || !circleService) {
      setError('Wallet not connected');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const currentRewards = parseFloat(playerRewards);
      if (currentRewards <= 0) {
        setError('No rewards available to claim');
        return;
      }
      
      const result = await circleService.claimRewards();
      
      if (result.success) {
        // Wait a moment for blockchain to process, then refresh
        setTimeout(async () => {
          try {
            const updatedRewards = await circleService.getPlayerRewards();
            setPlayerRewards(updatedRewards.toString());
            setRaceTokenBalance(updatedRewards);
          } catch (refreshError) {
            console.error('Failed to refresh after claim:', refreshError);
            // Fallback to clearing the state
            setPlayerRewards('0');
            setRaceTokenBalance(0);
          }
        }, 2000); // Wait 2 seconds for blockchain processing
      } else {
        throw new Error(result.error || 'Failed to claim rewards');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // ===== TOKEN TRANSFER FUNCTIONS =====
  
  const transferTokensToPlayer = async (toAddress: string, amount: number) => {
    if (!isConnected || !circleService) {
      setError('Wallet not connected');
      return;
    }
    
    if (amount <= 0) {
      setError('Invalid transfer amount');
      return;
    }
    
    if (raceTokenBalance < amount) {
      setError('Insufficient RACE token balance');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const result = await circleService.transferTokensToPlayer(toAddress, amount);
      
      if (result.success) {
        setRaceTokenBalance(raceTokenBalance - amount);
        const currentRewards = parseFloat(playerRewards);
        setPlayerRewards((currentRewards - amount).toString());
      } else {
        throw new Error(result.error || 'Failed to transfer tokens');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };
  
  // ===== DAILY CHALLENGE FUNCTIONS =====
  
  const loadDailyChallenge = async () => {
    if (!isConnected || !circleService) return;
    
    try {
      const challenge = await circleService.getDailyChallenge();
      if (challenge) {
        setDailyChallenge(challenge);
        setHasDailyChallenge(true);
      }
    } catch (err) {
      // Handle error silently
    }
  };

  // Refresh all data
  const refreshData = async () => {
    if (!isConnected || !circleService) return;
    
    setLoading(true);
    try {
      const balance = await circleService.getUSDCBalance();
      setUsdcBalance(balance);
      
      const rewards = await circleService.getPlayerRewards();
      setPlayerRewards(rewards.toString());
      setRaceTokenBalance(rewards);
      
      await loadPlayerBikes();
      await loadDailyChallenge();
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  useEffect(() => {
    const handleDynamicWalletConnection = async () => {
      console.log('🔌 Dynamic wallet connection check:', { 
        hasPrimaryWallet: !!primaryWallet, 
        isEthereum: primaryWallet ? isEthereumWallet(primaryWallet) : false,
        isConnected 
      });
      
      if (primaryWallet && isEthereumWallet(primaryWallet) && !isConnected) {
        console.log('🔗 Auto-connecting to previously connected wallet...');
        await connectWallet();
      } else if (!primaryWallet) {
        console.log('❌ No primary wallet found on page load');
        // Wait a bit for Dynamic to initialize, then check again
        setTimeout(async () => {
          console.log('🔄 Rechecking for wallet after 2 seconds...');
          if (primaryWallet && isEthereumWallet(primaryWallet) && !isConnected) {
            console.log('🔗 Delayed auto-connect attempt...');
            await connectWallet();
          }
        }, 2000);
      } else if (isConnected) {
        console.log('✅ Already connected');
      }
    };
    
    handleDynamicWalletConnection();
  }, [primaryWallet, isConnected, connectWallet]);

  // Separate effect to load player bikes when connection is established
  useEffect(() => {
    if (isConnected && circleService) {
      console.log('🔄 Connection established, loading player bikes...');
      loadPlayerBikes();
    }
  }, [isConnected, circleService, loadPlayerBikes]);

  const value: GameContextType = {
    // Circle service
    circleService,
    isConnected,
    walletAddress,
    smartAccountAddress,
    usdcBalance,
    
    // NFT Bike System
    ownedBikes,
    selectedBike,
    hasAnyBikes,
    mintedBikeTypes,
    
    // Game state
    currentSessionId,
    currentGameMode,
    gameStarted,
    gameCompleted,
    
    // Daily Challenges
    dailyChallenge,
    hasDailyChallenge,
    
    // UI state
    loading,
    error,
    
    // Game data
    playerSessions,
    activeTournaments,
    playerRewards,
    raceTokenBalance,
    
    // Actions
    connectWallet,
    disconnectWallet,
    
    // NFT Actions
    mintBike,
    selectBike,
    
    // Game Actions
    startNewGame,
    completeCurrentGame,
    
    // Tournament Actions
    joinTournament,
    
    // Token Actions
    claimPlayerRewards,
    transferTokensToPlayer,
    
    // Utility Actions
    refreshData,
    loadDailyChallenge,
    clearError,
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};