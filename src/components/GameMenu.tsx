// components/GameMenu.tsx - Main game menu with Circle integration
import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { BikeType, GameMode } from '../services/CircleService';
import TournamentList from './TournamentList';
import './BikeStats.css';

interface GameMenuProps {
  onBikeSelect: (bikeType: "sports" | "lady" | "chopper") => void;
}

const GameMenu: React.FC<GameMenuProps> = ({ onBikeSelect }) => {
  const [activeTab, setActiveTab] = useState<'vehicles' | 'tournaments'>('vehicles');
  const [mintingBikeType, setMintingBikeType] = useState<BikeType | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const { startNewGame, loading, error, clearError, usdcBalance, mintBike, circleService, mintedBikeTypes } = useGame();

  // const formatUSDC = (balance: string) => {
  //   const balanceNum = parseFloat(balance);
  //   return balanceNum.toFixed(2);
  // };


  const hasEnoughForMint = (bikeType: BikeType) => {
    if (!circleService) return false;
    const balance = parseFloat(usdcBalance);
    const mintPrice = parseFloat(circleService.getBikeMintPrice(bikeType)) / 1000000;
    return balance >= mintPrice;
  };

  const handleMintBike = async (bikeType: BikeType, bikeName: string) => {
    if (!hasEnoughForMint(bikeType)) {
      const price = circleService?.getBikeMintPriceFormatted(bikeType) || '0';
      setSuccessMessage(`❌ Insufficient USDC balance for purchasing (${price} USDC required)`);
      setTimeout(() => setSuccessMessage(null), 5000);
      return;
    }

    try {
      setMintingBikeType(bikeType);
      await mintBike(bikeType, bikeName);
      
      // Show success message
      const bikeTypeName = bikeType === BikeType.SPORTS ? 'Sports Bike' : 
                          bikeType === BikeType.LADY ? "Lady's Bike" : 'Chopper Bike';
      setSuccessMessage(`🎉 Success! Your ${bikeTypeName} NFT has been purchased successfully! ✅ Transaction completed. 🏍️ Bike ready for racing!`);
      setTimeout(() => setSuccessMessage(null), 8000);
    } catch (err) {
      setSuccessMessage('❌ Purchase failed. Please try again.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } finally {
      setMintingBikeType(null);
    }
  };

  const getBikeStats = (bikeType: BikeType) => {
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
  };

  const isBikeTypeMinted = (bikeType: BikeType) => {
    return mintedBikeTypes.has(bikeType);
  };


  const handleStartGame = async (bikeType: "sports" | "lady" | "chopper") => {
    try {
      await startNewGame(GameMode.PRACTICE); // Default to practice mode
      onBikeSelect(bikeType);
    } catch (err) {
      // Handle error silently or show user message if needed
    }
  };

  return (
    <div className="app">
      <div className="menu-container">
        <div className="menu-content">
          <h1 className="game-title">🏍️ Circle Bike Runner</h1>
          <p className="game-subtitle">Experience gasless Web3 gaming with Circle Smart Accounts</p>
        </div>

        {error && (
          <div className="error-message">
            <span>{error}</span>
            <button className="close-error" onClick={clearError}>×</button>
          </div>
        )}

      {successMessage && (
        <div style={{
          padding: '16px 20px',
          marginBottom: '24px',
          backgroundColor: successMessage.includes('❌') ? '#fed7d7' : '#c6f6d5',
          border: `1px solid ${successMessage.includes('❌') ? '#fc8181' : '#68d391'}`,
          borderRadius: '12px',
          color: successMessage.includes('❌') ? '#c53030' : '#2f855a',
          fontSize: '14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <span>{successMessage}</span>
          <button 
            onClick={() => setSuccessMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '0 4px'
            }}
          >×</button>
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '32px',
        padding: '4px',
        background: '#f1f5f9',
        borderRadius: '12px',
        maxWidth: '300px',
        margin: '0 auto 32px'
      }}>
        <button 
          onClick={() => setActiveTab('vehicles')}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'vehicles' ? '#fff' : 'transparent',
            color: activeTab === 'vehicles' ? '#1a202c' : '#718096',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'vehicles' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
          }}
        >
          🏍️ Bikes
        </button>
        <button 
          onClick={() => setActiveTab('tournaments')}
          style={{
            flex: 1,
            padding: '12px 20px',
            borderRadius: '8px',
            border: 'none',
            background: activeTab === 'tournaments' ? '#fff' : 'transparent',
            color: activeTab === 'tournaments' ? '#1a202c' : '#718096',
            fontSize: '14px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: activeTab === 'tournaments' ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'
          }}
        >
          🏆 Tournaments
        </button>
      </div>

      {/* Start Racing Section */}
      {mintedBikeTypes.size > 0 && (
        <div style={{
          marginBottom: '40px',
          padding: '24px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '16px',
          textAlign: 'center',
          color: 'white'
        }}>
          <div style={{
            width: '48px',
            height: '48px',
            background: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: '20px'
          }}>
            🎮
          </div>
          <h3 style={{ 
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '8px',
            margin: '0 0 8px 0'
          }}>
            Ready to Race!
          </h3>
          <p style={{ 
            marginBottom: '20px',
            opacity: 0.9,
            fontSize: '14px',
            margin: '0 0 20px 0'
          }}>
            You have {mintedBikeTypes.size} bike{mintedBikeTypes.size > 1 ? 's' : ''} ready for racing!
          </p>
          <button
            onClick={() => {
              // Select the first available bike type for the game
              const bikeTypes: ("sports" | "lady" | "chopper")[] = ["sports", "lady", "chopper"];
              const availableBike = bikeTypes.find((type) => {
                const bikeTypeEnum = type === "sports" ? BikeType.SPORTS : 
                                   type === "lady" ? BikeType.LADY : BikeType.CHOPPER;
                return mintedBikeTypes.has(bikeTypeEnum);
              });
              if (availableBike) {
                handleStartGame(availableBike);
              }
            }}
            disabled={loading}
            style={{
              padding: '12px 32px',
              fontSize: '16px',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '2px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '12px',
              cursor: 'pointer',
              fontWeight: '600',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateY(0px)';
            }}
          >
            🚀 Start Racing!
          </button>
        </div>
      )}

      {/* Content Sections */}
      {activeTab === 'vehicles' && (
        <div>
          {/* Section Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '32px'
          }}>
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1a202c',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              🏍️ NFT Bike Collection
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#718096',
              margin: '0'
            }}>
              Each bike has unique stats affecting your earnings. Better stats = more RACE tokens!
            </p>
          </div>

          {/* Bike Cards Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '24px',
            marginBottom: '40px'
          }}>
            <div className="bike-options">
              <div className="bike-option">
                <div className="bike-icon">🏍️</div>
                <h3>Sports Bike NFT</h3>
                <p>High-speed racer with excellent performance</p>
                
                <div className="bike-stats">
                  <div className="stat">
                    <span className="stat-label">⚡ Speed:</span>
                    <span className="stat-value">{getBikeStats(BikeType.SPORTS).speed}/100</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">🚀 Acceleration:</span>
                    <span className="stat-value">{getBikeStats(BikeType.SPORTS).acceleration}/100</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">🎯 Handling:</span>
                    <span className="stat-value">{getBikeStats(BikeType.SPORTS).handling}/100</span>
                  </div>
                </div>

                <div className="bike-features">
                  <p>• Red frame with bright colors</p>
                  <p>• Yellow wheels & high performance</p>
                  <p>• Best for experienced racers</p>
                </div>
                
                <button 
                  onClick={() => handleMintBike(BikeType.SPORTS, "Lightning Sports")}
                  disabled={mintingBikeType === BikeType.SPORTS || !hasEnoughForMint(BikeType.SPORTS) || isBikeTypeMinted(BikeType.SPORTS)}
                  className={`mint-bike-button ${isBikeTypeMinted(BikeType.SPORTS) ? 'minted' : ''}`}
                >
                  {isBikeTypeMinted(BikeType.SPORTS) ? '✅ Purchased!' : 
                   mintingBikeType === BikeType.SPORTS ? '⏳ Purchasing...' : 
                   `🔥 Purchase NFT (${circleService?.getBikeMintPriceFormatted(BikeType.SPORTS) || '1'} USDC)`}
                </button>
              </div>
              
              <div className="bike-option">
                <div className="bike-icon">🛵</div>
                <h3>Lady's Bike NFT</h3>
                <p>Balanced cruiser with excellent handling</p>
                
                <div className="bike-stats">
                  <div className="stat">
                    <span className="stat-label">⚡ Speed:</span>
                    <span className="stat-value">{getBikeStats(BikeType.LADY).speed}/100</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">🚀 Acceleration:</span>
                    <span className="stat-value">{getBikeStats(BikeType.LADY).acceleration}/100</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">🎯 Handling:</span>
                    <span className="stat-value">{getBikeStats(BikeType.LADY).handling}/100</span>
                  </div>
                </div>

                <div className="bike-features">
                  <p>• Pink frame with cyan tank</p>
                  <p>• Purple side panels & smooth ride</p>
                  <p>• Perfect for precision racing</p>
                </div>
                
                <button 
                  onClick={() => handleMintBike(BikeType.LADY, "Elegant Cruiser")}
                  disabled={mintingBikeType === BikeType.LADY || !hasEnoughForMint(BikeType.LADY) || isBikeTypeMinted(BikeType.LADY)}
                  className={`mint-bike-button ${isBikeTypeMinted(BikeType.LADY) ? 'minted' : ''}`}
                >
                  {isBikeTypeMinted(BikeType.LADY) ? '✅ Purchased!' : 
                   mintingBikeType === BikeType.LADY ? '⏳ Purchasing...' : 
                   `💎 Purchase NFT (${circleService?.getBikeMintPriceFormatted(BikeType.LADY) || '3'} USDC)`}
                </button>
              </div>
              
              <div className="bike-option">
                <div className="bike-icon">🛵</div>
                <h3>Chopper Bike NFT</h3>
                <p>Heavy-duty cruiser with premium styling</p>
                
                <div className="bike-stats">
                  <div className="stat">
                    <span className="stat-label">⚡ Speed:</span>
                    <span className="stat-value">{getBikeStats(BikeType.CHOPPER).speed}/100</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">🚀 Acceleration:</span>
                    <span className="stat-value">{getBikeStats(BikeType.CHOPPER).acceleration}/100</span>
                  </div>
                  <div className="stat">
                    <span className="stat-label">🎯 Handling:</span>
                    <span className="stat-value">{getBikeStats(BikeType.CHOPPER).handling}/100</span>
                  </div>
                </div>

                <div className="bike-features">
                  <p>• Black frame with chrome details</p>
                  <p>• Wide handlebars & powerful engine</p>
                  <p>• Premium collector's edition</p>
                </div>
                
                <button 
                  onClick={() => handleMintBike(BikeType.CHOPPER, "Chrome Thunder")}
                  disabled={mintingBikeType === BikeType.CHOPPER || !hasEnoughForMint(BikeType.CHOPPER) || isBikeTypeMinted(BikeType.CHOPPER)}
                  className={`mint-bike-button ${isBikeTypeMinted(BikeType.CHOPPER) ? 'minted' : ''}`}
                >
                  {isBikeTypeMinted(BikeType.CHOPPER) ? '✅ Purchased!' : 
                   mintingBikeType === BikeType.CHOPPER ? '⏳ Purchasing...' : 
                   `👑 Purchase NFT (${circleService?.getBikeMintPriceFormatted(BikeType.CHOPPER) || '5'} USDC)`}
                </button>
              </div>
            </div>
          </div>

          <div className="game-instructions">
            <h3>How to Play</h3>
            <div className="instructions-grid">
              <div className="instruction">
                <span className="key">A/D or ←/→</span>
                <span>Move left/right</span>
              </div>
              <div className="instruction">
                <span className="key">↑/↓ or Mouse</span>
                <span>Control speed</span>
              </div>
              <div className="instruction">
                <span className="emoji">🚗</span>
                <span>Dodge vehicles (+10 points)</span>
              </div>
              <div className="instruction">
                <span className="emoji">📦</span>
                <span>Collect bonus boxes (+30 points)</span>
              </div>
              <div className="instruction">
                <span className="emoji">🗝️</span>
                <span>Golden keys = Invisibility</span>
              </div>
            </div>
          </div>
        </div>
      )}

        {activeTab === 'tournaments' && <TournamentList />}
      </div>
    </div>
  );
};

export default GameMenu;