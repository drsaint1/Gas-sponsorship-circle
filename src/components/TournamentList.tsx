// components/TournamentList.tsx - Tournament listing and management
import React from 'react';
import { useGame } from '../context/GameContext';

const TournamentList: React.FC = () => {
  const { activeTournaments, joinTournament, loading, usdcBalance } = useGame();

  const formatUSDC = (amount: string) => {
    const amountNum = parseFloat(amount);
    return (amountNum / 1000000).toFixed(2);
  };

  const formatTimeRemaining = (endTime: number) => {
    const now = Date.now();
    const remaining = Math.max(0, endTime - now);
    const hours = Math.floor(remaining / (1000 * 60 * 60));
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const canAffordEntry = (entryFee: string) => {
    const balance = parseFloat(usdcBalance);
    const fee = parseFloat(entryFee);
    return balance >= fee;
  };

  const handleJoinTournament = async (tournamentId: number) => {
    try {
      await joinTournament(tournamentId);
      alert('Successfully joined tournament! Good luck!');
    } catch (error) {
      // Handle error silently or show user notification
    }
  };

  return (
    <div className="tournament-list">
      <div className="tournament-header">
        <h2>🏆 Active Tournaments</h2>
        <p>Compete against other players for USDC prizes!</p>
      </div>

      {activeTournaments.length === 0 ? (
        <div className="no-tournaments">
          <p>No active tournaments at the moment.</p>
          <p>Check back soon for new competitions!</p>
        </div>
      ) : (
        <div className="tournaments-grid">
          {activeTournaments.map((tournament) => (
            <div key={tournament.id} className="tournament-card">
              <div className="tournament-header-card">
                <h3>Tournament #{tournament.id}</h3>
                <div className="tournament-status">
                  {tournament.finalized ? '🏁 Finished' : '🔥 Active'}
                </div>
              </div>

              <div className="tournament-stats">
                <div className="stat">
                  <span className="stat-label">Entry Fee:</span>
                  <span className="stat-value">{formatUSDC(tournament.entryFee)} USDC</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Prize Pool:</span>
                  <span className="stat-value">{formatUSDC(tournament.prizePool)} USDC</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Players:</span>
                  <span className="stat-value">{tournament.playerCount}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Time Left:</span>
                  <span className="stat-value">{formatTimeRemaining(tournament.endTime)}</span>
                </div>
              </div>

              {tournament.winner && (
                <div className="tournament-winner">
                  <span>🏆 Winner: {tournament.winner.slice(0, 8)}...</span>
                </div>
              )}

              <div className="tournament-actions">
                {!tournament.finalized ? (
                  <button
                    onClick={() => handleJoinTournament(tournament.id)}
                    disabled={loading || !canAffordEntry(tournament.entryFee)}
                    className="join-tournament-button"
                  >
                    {loading 
                      ? '⏳ Joining...' 
                      : canAffordEntry(tournament.entryFee)
                        ? `🎮 Join (${formatUSDC(tournament.entryFee)} USDC)`
                        : '💸 Insufficient Balance'
                    }
                  </button>
                ) : (
                  <div className="tournament-ended">
                    Tournament Ended
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="tournament-info">
        <div className="info-box">
          <h4>🎯 Tournament Rules</h4>
          <ul>
            <li>Highest score wins the tournament</li>
            <li>Winner receives 80% of the total prize pool</li>
            <li>Multiple entries allowed (separate fee each time)</li>
            <li>Tournament ends after the specified time limit</li>
            <li>Prizes are automatically distributed upon completion</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TournamentList;