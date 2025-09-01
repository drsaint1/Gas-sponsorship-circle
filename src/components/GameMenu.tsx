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
  const { startNewGame, loading, error, clearError, usdcBalance, mintBike, circleService, mintedBikeTypes, ownedBikes, selectedBike, selectBike } = useGame();

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

      {/* Bike Selection Section - Show different content based on bike ownership */}
      {ownedBikes.length > 0 ? (
        <div style={{
          marginBottom: '40px',
          padding: '32px',
          background: 'linear-gradient(135deg, #1a365d 0%, #2d3748 50%, #1a202c 100%)',
          borderRadius: '20px',
          color: 'white',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3), 0 0 20px rgba(102, 126, 234, 0.2)',
          border: '2px solid rgba(255, 255, 255, 0.1)'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h3 style={{ 
              fontSize: '28px',
              fontWeight: '700',
              marginBottom: '12px',
              margin: '0 0 12px 0',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)',
              background: 'linear-gradient(45deg, #ffd700, #ffed4a)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              🏍️ SELECT YOUR RACING BIKE
            </h3>
            <p style={{ 
              opacity: 0.95,
              fontSize: '16px',
              margin: '0',
              fontWeight: '500',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
            }}>
              Choose which bike to race with. Each bike has unique properties that affect your performance!
            </p>
          </div>

          {/* Bike Selection Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginBottom: '24px'
          }}>
            {ownedBikes.map((bike) => {
              const isSelected = selectedBike?.tokenId === bike.tokenId;
              const bikeEmoji = bike.bikeType === BikeType.SPORTS ? '🏍️' : 
                               bike.bikeType === BikeType.LADY ? '🛵' : '🏍️';
              const bikeTypeName = bike.bikeType === BikeType.SPORTS ? 'Sports' : 
                                  bike.bikeType === BikeType.LADY ? "Lady's" : 'Chopper';
              
              return (
                <div
                  key={bike.tokenId}
                  onClick={() => selectBike(bike)}
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: isSelected 
                      ? 'linear-gradient(135deg, #ffd700 0%, #ff8c00 100%)' 
                      : 'rgba(255, 255, 255, 0.15)',
                    border: isSelected 
                      ? '3px solid #ffd700' 
                      : '2px solid rgba(255, 255, 255, 0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    textAlign: 'center',
                    boxShadow: isSelected 
                      ? '0 10px 30px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.3)'
                      : '0 4px 15px rgba(0, 0, 0, 0.2)',
                    transform: isSelected ? 'scale(1.05)' : 'scale(1)',
                    color: isSelected ? '#1a202c' : 'white'
                  }}
                >
                  <div style={{ fontSize: '40px', marginBottom: '12px' }}>
                    {bikeEmoji}
                  </div>
                  <div style={{ 
                    fontSize: '18px', 
                    fontWeight: 'bold', 
                    marginBottom: '6px',
                    textShadow: isSelected ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.3)'
                  }}>
                    {bike.name}
                  </div>
                  <div style={{ 
                    fontSize: '13px', 
                    opacity: isSelected ? 0.7 : 0.8, 
                    marginBottom: '12px',
                    fontWeight: '500'
                  }}>
                    {bikeTypeName} Bike #{bike.tokenId}
                  </div>
                  <div style={{ 
                    fontSize: '12px', 
                    opacity: isSelected ? 0.8 : 0.7,
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontWeight: '600'
                  }}>
                    <span>⚡{bike.speed}</span>
                    <span>🚀{bike.acceleration}</span>
                    <span>🎯{bike.handling}</span>
                  </div>
                  {isSelected && (
                    <div style={{
                      marginTop: '12px',
                      fontSize: '14px',
                      color: '#1a202c',
                      fontWeight: 'bold',
                      background: 'rgba(255, 255, 255, 0.2)',
                      padding: '4px 8px',
                      borderRadius: '8px',
                      textShadow: 'none'
                    }}>
                      ✅ SELECTED
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Start Racing Button */}
          <div style={{ textAlign: 'center', marginTop: '32px' }}>
            <button
              onClick={() => {
                if (selectedBike) {
                  const bikeTypeString = selectedBike.bikeType === BikeType.SPORTS ? "sports" : 
                                        selectedBike.bikeType === BikeType.LADY ? "lady" : "chopper";
                  handleStartGame(bikeTypeString);
                }
              }}
              disabled={loading || !selectedBike}
              style={{
                padding: '20px 48px',
                fontSize: '20px',
                background: selectedBike 
                  ? 'linear-gradient(135deg, #ff6b35 0%, #ff8c42 50%, #f9844a 100%)' 
                  : 'rgba(255, 255, 255, 0.1)',
                color: selectedBike ? '#ffffff' : 'rgba(255, 255, 255, 0.5)',
                border: selectedBike 
                  ? '3px solid #ff8c42' 
                  : '2px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '16px',
                cursor: selectedBike ? 'pointer' : 'not-allowed',
                fontWeight: '800',
                letterSpacing: '1px',
                transition: 'all 0.3s ease',
                backdropFilter: 'blur(10px)',
                boxShadow: selectedBike 
                  ? '0 8px 25px rgba(255, 107, 53, 0.4), 0 0 20px rgba(255, 140, 66, 0.3)'
                  : 'none',
                textShadow: selectedBike ? '0 2px 4px rgba(0, 0, 0, 0.3)' : 'none',
                transform: selectedBike ? 'translateY(-2px)' : 'none'
              }}
              onMouseEnter={(e) => {
                if (selectedBike) {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 12px 35px rgba(255, 107, 53, 0.5), 0 0 30px rgba(255, 140, 66, 0.4)';
                }
              }}
              onMouseLeave={(e) => {
                if (selectedBike) {
                  e.currentTarget.style.transform = 'translateY(-2px) scale(1)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(255, 107, 53, 0.4), 0 0 20px rgba(255, 140, 66, 0.3)';
                }
              }}
            >
              {selectedBike 
                ? `🚀 RACE WITH ${selectedBike.name.toUpperCase()}!` 
                : '🏍️ SELECT A BIKE TO RACE'}
            </button>
          </div>
        </div>
      ) : (
        /* New User Section - No bikes owned */
        <div style={{
          marginBottom: '40px',
          padding: '32px',
          background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 50%, #f87171 100%)',
          borderRadius: '20px',
          color: 'white',
          boxShadow: '0 20px 40px rgba(220, 38, 38, 0.3), 0 0 20px rgba(239, 68, 68, 0.2)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            🏍️
          </div>
          <h3 style={{ 
            fontSize: '28px',
            fontWeight: '700',
            marginBottom: '12px',
            margin: '0 0 12px 0',
            textShadow: '0 2px 10px rgba(0, 0, 0, 0.3)'
          }}>
            MINT OR PURCHASE AN NFT BIKE TO START RACING
          </h3>
          <p style={{ 
            opacity: 0.95,
            fontSize: '16px',
            margin: '0 0 24px 0',
            fontWeight: '500',
            textShadow: '0 1px 3px rgba(0, 0, 0, 0.3)'
          }}>
            You need to own at least one NFT bike to participate in races!<br />
            Choose from our collection of high-performance bikes below.
          </p>
          <div style={{
            padding: '16px',
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <p style={{ 
              margin: '0',
              fontSize: '14px',
              opacity: 0.9,
              fontWeight: '500'
            }}>
              👇 Scroll down to purchase your first NFT bike and start your racing journey!
            </p>
          </div>
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
              🛒 Purchase New Bikes
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#718096',
              margin: '0'
            }}>
              Mint NFT bikes to expand your collection. Each bike has unique stats affecting your earnings!
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