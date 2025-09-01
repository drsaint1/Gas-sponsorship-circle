import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import { defaultGameConfig } from '../services/CircleService';

const DebugPanel: React.FC = () => {
  const { 
    circleService, 
    isConnected, 
    smartAccountAddress, 
    playerRewards, 
    raceTokenBalance,
    refreshData 
  } = useGame();
  
  const [manualRewards, setManualRewards] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [testGameResult, setTestGameResult] = useState<string | null>(null);
  
  const checkRewardsManually = async () => {
    if (!circleService) return;
    
    setLoading(true);
    try {
      const rewards = await circleService.getPlayerRewards();
      setManualRewards(rewards);
      console.log('🔍 Manual rewards check:', rewards);
    } catch (error) {
      console.error('❌ Manual check failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const testGameCompletion = async () => {
    if (!circleService) return;
    
    setLoading(true);
    setTestGameResult('Starting test...');
    
    try {
      // Check if user has any bikes first
      const bikes = await circleService.getPlayerBikes();
      console.log('🧪 Player bikes:', bikes);
      
      if (bikes.length === 0) {
        setTestGameResult('❌ No bikes found. You need to mint a bike first to test game completion.');
        return;
      }
      
      const bikeTokenId = bikes[0]; // Use first bike
      console.log('🧪 Using bike token ID:', bikeTokenId);
      
      // Start game first
      const startResult = await circleService.startGame(bikeTokenId, 0); // GameMode.PRACTICE = 0
      console.log('🧪 Start game result:', startResult);
      
      if (!startResult.success) {
        setTestGameResult(`❌ Failed to start game: ${startResult.error}`);
        return;
      }
      
      const sessionId = startResult.sessionId!;
      setTestGameResult(`✅ Game started with session ID: ${sessionId}\nNow completing game...`);
      
      // Wait a bit for blockchain
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Complete game
      const completeResult = await circleService.completeGame(sessionId, 1000, 500, 10);
      console.log('🧪 Complete game result:', completeResult);
      
      setTestGameResult(prev => prev + `\n\nComplete game result: ${JSON.stringify(completeResult, null, 2)}`);
      
      // Wait and check rewards again
      setTimeout(async () => {
        const newRewards = await circleService.getPlayerRewards();
        console.log('🧪 Rewards after test:', newRewards);
        setManualRewards(newRewards);
        setTestGameResult(prev => prev + `\n\nFinal rewards: ${newRewards}`);
      }, 5000);
      
    } catch (error) {
      console.error('❌ Test game failed:', error);
      setTestGameResult(`Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };
  
  if (!isConnected) {
    return null;
  }
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      background: 'rgba(0,0,0,0.8)',
      color: 'white',
      padding: '20px',
      borderRadius: '10px',
      fontSize: '14px',
      maxWidth: '300px',
      zIndex: 1000
    }}>
      <h4>🐛 Debug Panel</h4>
      
      <div><strong>Smart Account:</strong></div>
      <div style={{ fontSize: '12px', wordBreak: 'break-all', marginBottom: '10px' }}>
        {smartAccountAddress}
      </div>
      
      <div><strong>Contract:</strong></div>
      <div style={{ fontSize: '12px', wordBreak: 'break-all', marginBottom: '10px' }}>
        {defaultGameConfig.gameContract}
      </div>
      
      <div><strong>Player Rewards (State):</strong> {playerRewards}</div>
      <div><strong>Race Token Balance:</strong> {raceTokenBalance}</div>
      
      {manualRewards !== null && (
        <div><strong>Manual Check Result:</strong> {manualRewards}</div>
      )}
      
      {testGameResult && (
        <div style={{ marginTop: '10px', fontSize: '10px', background: '#222', padding: '5px', borderRadius: '5px', maxHeight: '100px', overflow: 'auto' }}>
          <strong>Test Result:</strong>
          <pre>{testGameResult}</pre>
        </div>
      )}
      
      <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
        <button 
          onClick={checkRewardsManually}
          disabled={loading}
          style={{
            padding: '5px 10px',
            fontSize: '12px'
          }}
        >
          {loading ? 'Checking...' : 'Check Rewards'}
        </button>
        
        <button 
          onClick={testGameCompletion}
          disabled={loading}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            background: '#ff6b35'
          }}
        >
          {loading ? 'Testing...' : 'Test Complete Game'}
        </button>
        
        <button 
          onClick={refreshData}
          style={{
            padding: '5px 10px',
            fontSize: '12px'
          }}
        >
          Refresh All
        </button>
        
        <button 
          onClick={async () => {
            if (!circleService) return;
            setLoading(true);
            try {
              const rewards = await circleService.getPlayerRewards();
              console.log('🔄 Force refresh rewards:', rewards);
              setManualRewards(rewards);
              
              // Also call refreshData to update the context
              await refreshData();
            } catch (error) {
              console.error('Force refresh failed:', error);
            } finally {
              setLoading(false);
            }
          }}
          disabled={loading}
          style={{
            padding: '5px 10px',
            fontSize: '12px',
            background: '#28a745'
          }}
        >
          {loading ? 'Refreshing...' : 'Force Refresh UI'}
        </button>
      </div>
    </div>
  );
};

export default DebugPanel;