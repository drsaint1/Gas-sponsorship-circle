// components/WalletStatus.tsx - Display wallet status and balance
import React from 'react';
import { useGame } from '../context/GameContext';

const WalletStatus: React.FC = () => {
  const { 
    walletAddress, 
    smartAccountAddress,
    usdcBalance, 
    playerRewards,
    loading,
    claimPlayerRewards,
    refreshData,
    disconnectWallet
  } = useGame();

  const formatUSDC = (balance: string) => {
    const balanceNum = parseFloat(balance);
    return balanceNum.toFixed(2); // Balance already converted by CircleService
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  };

  return (
    <div className="wallet-status">
      <div className="wallet-info">
        <div className="wallet-addresses">
          <div className="wallet-address">
            <span className="label">👤 EOA Wallet:</span>
            <span 
              className="address copyable" 
              title={`${walletAddress} - Click to copy`}
              onClick={() => copyToClipboard(walletAddress)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {formatAddress(walletAddress)}
              <span style={{ fontSize: '0.8em', opacity: 0.7 }}>⧉</span>
            </span>
          </div>
          
          <div className="wallet-address">
            <span className="label">🏦 Smart Account:</span>
            <span 
              className="address copyable" 
              title={`${smartAccountAddress} - Click to copy`}
              onClick={() => copyToClipboard(smartAccountAddress)}
              style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {formatAddress(smartAccountAddress)}
              <span style={{ fontSize: '0.8em', opacity: 0.7 }}>⧉</span>
            </span>
          </div>
        </div>
        
        <div className="balances">
          <div className="balance-item">
            <span className="balance-label">💰 USDC:</span>
            <span className="balance-value">{formatUSDC(usdcBalance)}</span>
          </div>
          
          <div className="balance-item">
            <span className="balance-label">🎁 RACE Rewards:</span>
            <span className="balance-value">{playerRewards}</span>
            {parseFloat(playerRewards) > 0 && (
              <button 
                onClick={claimPlayerRewards}
                disabled={loading}
                className="claim-button"
              >
                Claim
              </button>
            )}
          </div>
        </div>
        
        <div className="wallet-actions">
          <button 
            onClick={refreshData}
            disabled={loading}
            className="refresh-button"
            title="Refresh balances"
          >
            🔄
          </button>
          
          <button 
            onClick={disconnectWallet}
            disabled={loading}
            className="disconnect-button"
            title="Disconnect wallet"
          >
            🔌
          </button>
        </div>
      </div>
    </div>
  );
};

export default WalletStatus;