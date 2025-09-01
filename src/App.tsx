import { useState } from 'react';
import BikeRunner from './BikeRunner';
import { GameProvider, useGame } from './context/GameContext';
import WalletStatus from './components/WalletStatus';
import GameMenu from './components/GameMenu';
import { DynamicContextProvider, DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { EthereumWalletConnectors } from '@dynamic-labs/ethereum';
import { polygonAmoy } from 'viem/chains';
import './App.css'

const environmentId = import.meta.env.VITE_DYNAMIC_ENV_ID as string;

function AppContent() {
  const [showGame, setShowGame] = useState(false);
  const { isConnected, selectedBike, circleService } = useGame();

  const handleBikeSelect = (bikeType: "sports" | "lady" | "chopper") => {
    setShowGame(true);
  };

  const handleBackToMenu = () => {
    setShowGame(false);
  };

  if (showGame && selectedBike && circleService) {
    const bikeTypeString = circleService.getBikeTypeString(selectedBike.bikeType);
    return <BikeRunner bikeType={bikeTypeString} onBackToMenu={handleBackToMenu} />;
  }

  // Show welcome screen if not connected - Dynamic widget handles connection
  if (!isConnected) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{
          maxWidth: '800px',
          width: '100%',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '60px 40px',
          textAlign: 'center',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 32px',
            fontSize: '32px'
          }}>
            🏍️
          </div>
          
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            color: '#1a202c',
            marginBottom: '16px',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          }}>
            Circle Bike Runner
          </h1>
          
          <p style={{
            fontSize: '18px',
            color: '#718096',
            marginBottom: '48px',
            lineHeight: '1.6'
          }}>
            Experience gasless Web3 gaming with Circle Smart Accounts.<br />
            Purchase NFT bikes, race, and earn tokens seamlessly.
          </p>

          <div style={{
            background: '#f7fafc',
            borderRadius: '16px',
            padding: '32px',
            marginBottom: '40px',
            border: '1px solid #e2e8f0'
          }}>
            <h3 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#2d3748',
              marginBottom: '24px'
            }}>
              Connect Your Wallet to Get Started
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>⚡</div>
                <div>
                  <div style={{ fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>Gasless Transactions</div>
                  <div style={{ color: '#718096', fontSize: '12px' }}>Pay only with USDC</div>
                </div>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px'
                }}>🏆</div>
                <div>
                  <div style={{ fontWeight: '600', color: '#2d3748', fontSize: '14px' }}>Earn Rewards</div>
                  <div style={{ color: '#718096', fontSize: '12px' }}>RACE tokens & NFTs</div>
                </div>
              </div>
            </div>
            
            <p style={{
              color: '#667eea',
              fontSize: '14px',
              fontWeight: '500',
              margin: '0'
            }}>
              👆 Click the wallet button in the top-right corner to connect
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <WalletStatus />
      <GameMenu onBikeSelect={handleBikeSelect} />
    </div>
  );
}

function App() {
  // Configure Dynamic for Arbitrum Sepolia
  const evmNetworks = [
    {
      chainId: polygonAmoy.id,
      networkId: polygonAmoy.id,
      name: polygonAmoy.name,
      nativeCurrency: polygonAmoy.nativeCurrency,
      rpcUrls: [...polygonAmoy.rpcUrls.default.http],
      iconUrls: [],
      blockExplorerUrls: [polygonAmoy.blockExplorers.default.url],
    },
  ];

  return (
    <DynamicContextProvider
      settings={{
        environmentId,
        walletConnectors: [EthereumWalletConnectors],
        overrides: { evmNetworks },
      }}
    >
      <div className="app-root">
        <div className="wallet-widget">
          <DynamicWidget />
        </div>

        <GameProvider>
          <AppContent />
        </GameProvider>
      </div>
    </DynamicContextProvider>
  );
}

export default App
