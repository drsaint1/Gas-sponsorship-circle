// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title BikeRacerGame
 * @dev NFT-powered gasless bike racing game with Circle integration
 * Features: NFT bike minting, practice races, daily challenges, gasless token transfers
 */
contract BikeRacerGame is ERC721, ERC721Enumerable, Ownable, ReentrancyGuard, Pausable {
    
    // ===== STATE VARIABLES =====
    
    IERC20 public immutable usdc;
    IERC20 public raceToken; // Our custom ERC20 reward token
    
    uint256 public constant PRACTICE_FEE = 0; // Free practice races
    uint256 public constant RANKED_ENTRY_FEE = 5 * 10**6; // 5 USDC (6 decimals)
    uint256 public constant SPORTS_BIKE_PRICE = 1 * 10**6; // 1 USDC
    uint256 public constant LADY_BIKE_PRICE = 3 * 10**6; // 3 USDC  
    uint256 public constant CHOPPER_BIKE_PRICE = 5 * 10**6; // 5 USDC
    
    uint256 private _tokenIdCounter;
    
    // ===== BIKE STRUCTS =====
    
    enum BikeType { SPORTS, LADY, CHOPPER }
    
    struct BikeNFT {
        BikeType bikeType;
        uint256 speed;        // 1-100
        uint256 acceleration; // 1-100  
        uint256 handling;     // 1-100
        uint256 mintTime;
        uint256 totalRaces;
        uint256 totalWins;
        string name;
    }
    
    struct GameSession {
        address player;
        uint256 bikeTokenId;
        uint256 score;
        uint256 distance;
        uint256 vehiclesDodged;
        uint256 timestamp;
        bool completed;
        uint256 rewardsClaimed;
        GameMode gameMode;
    }
    
    enum GameMode { PRACTICE, RANKED, DAILY_CHALLENGE }
    
    struct DailyChallenge {
        uint256 challengeDate; // timestamp of the day
        uint256 targetScore;
        uint256 rewardAmount;
        bool active;
    }
    
    struct Tournament {
        uint256 entryFee;
        uint256 prizePool;
        uint256 startTime;
        uint256 endTime;
        address[] participants;
        mapping(address => uint256) playerScores;
        bool finalized;
        address winner;
        uint256 maxParticipants;
    }
    
    // ===== MAPPINGS & ARRAYS =====
    
    mapping(uint256 => BikeNFT) public bikeNFTs;
    mapping(uint256 => GameSession) public gameSessions;
    mapping(address => uint256[]) public playerSessions;
    mapping(address => uint256[]) public ownedBikes;
    mapping(address => uint256) public playerRewards;
    mapping(uint256 => Tournament) public tournaments;
    mapping(uint256 => DailyChallenge) public dailyChallenges;
    mapping(address => mapping(uint256 => bool)) public completedDailyChallenges;
    mapping(uint256 => mapping(address => bool)) public challengeCompleted;
    mapping(uint256 => mapping(address => uint256)) public challengeBestScores;
    
    uint256 public nextSessionId = 1;
    uint256 public nextTournamentId = 1;
    uint256 public totalPrizePool;
    uint256 public currentChallengeDate;
    
    // ===== EVENTS =====
    
    event BikeNFTMinted(address indexed player, uint256 indexed tokenId, BikeType bikeType, string name);
    event GameStarted(address indexed player, uint256 indexed sessionId, uint256 bikeTokenId, GameMode gameMode);
    event GameCompleted(address indexed player, uint256 indexed sessionId, uint256 score, uint256 rewards, GameMode gameMode);
    event DailyChallengeCreated(uint256 indexed challengeDate, uint256 targetScore, uint256 rewardAmount);
    event DailyChallengeCompleted(address indexed player, uint256 indexed challengeDate, uint256 score, uint256 reward);
    event TokensTransferred(address indexed from, address indexed to, uint256 amount);
    event RewardsClaimed(address indexed player, uint256 amount);
    
    // ===== CONSTRUCTOR =====
    
    constructor(
        address _usdc,
        address _raceToken
    ) ERC721("BikeRacer NFT", "BIKE") Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        raceToken = IERC20(_raceToken);
        currentChallengeDate = getCurrentDay();
        _createDailyChallenge();
    }
    
    // ===== BIKE NFT FUNCTIONS =====
    
    /**
     * @dev Mint a new bike NFT with specific stats
     */
    function mintBike(BikeType _bikeType, string memory _bikeName) external nonReentrant whenNotPaused returns (uint256) {
        uint256 mintPrice = getBikeMintPrice(_bikeType);
        require(usdc.transferFrom(msg.sender, address(this), mintPrice), "Mint fee transfer failed");
        
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Set bike stats based on type
        (uint256 speed, uint256 acceleration, uint256 handling) = getBikeBaseStats(_bikeType);
        
        bikeNFTs[tokenId] = BikeNFT({
            bikeType: _bikeType,
            speed: speed,
            acceleration: acceleration,
            handling: handling,
            mintTime: block.timestamp,
            totalRaces: 0,
            totalWins: 0,
            name: _bikeName
        });
        
        ownedBikes[msg.sender].push(tokenId);
        _safeMint(msg.sender, tokenId);
        
        emit BikeNFTMinted(msg.sender, tokenId, _bikeType, _bikeName);
        return tokenId;
    }
    
    /**
     * @dev Get base stats for bike types
     */
    function getBikeBaseStats(BikeType _bikeType) internal pure returns (uint256 speed, uint256 acceleration, uint256 handling) {
        if (_bikeType == BikeType.SPORTS) {
            return (95, 85, 70); // High speed, good acceleration, moderate handling
        } else if (_bikeType == BikeType.LADY) {
            return (70, 75, 90); // Moderate speed, good acceleration, excellent handling
        } else { // CHOPPER
            return (80, 60, 85); // Good speed, lower acceleration, good handling
        }
    }
    
    /**
     * @dev Get mint price for bike types
     */
    function getBikeMintPrice(BikeType _bikeType) public pure returns (uint256) {
        if (_bikeType == BikeType.SPORTS) {
            return SPORTS_BIKE_PRICE; // 1 USDC
        } else if (_bikeType == BikeType.LADY) {
            return LADY_BIKE_PRICE; // 3 USDC
        } else { // CHOPPER
            return CHOPPER_BIKE_PRICE; // 5 USDC
        }
    }
    
    // ===== GAME FUNCTIONS =====
    
    /**
     * @dev Start a new game session (practice, ranked, or daily challenge)
     */
    function startGame(uint256 _bikeTokenId, GameMode _gameMode) external nonReentrant whenNotPaused returns (uint256) {
        require(ownerOf(_bikeTokenId) == msg.sender, "You don't own this bike");
        
        // Handle fees based on game mode
        if (_gameMode == GameMode.RANKED) {
            require(usdc.transferFrom(msg.sender, address(this), RANKED_ENTRY_FEE), "Entry fee transfer failed");
            uint256 prizeContribution = (RANKED_ENTRY_FEE * 80) / 100;
            totalPrizePool += prizeContribution;
        } else if (_gameMode == GameMode.DAILY_CHALLENGE) {
            uint256 today = getCurrentDay();
            require(dailyChallenges[today].active, "No active daily challenge");
            require(!completedDailyChallenges[msg.sender][today], "Already completed today's challenge");
        }
        // Practice mode is free
        
        uint256 sessionId = nextSessionId++;
        
        gameSessions[sessionId] = GameSession({
            player: msg.sender,
            bikeTokenId: _bikeTokenId,
            score: 0,
            distance: 0,
            vehiclesDodged: 0,
            timestamp: block.timestamp,
            completed: false,
            rewardsClaimed: 0,
            gameMode: _gameMode
        });
        
        playerSessions[msg.sender].push(sessionId);
        bikeNFTs[_bikeTokenId].totalRaces++;
        
        emit GameStarted(msg.sender, sessionId, _bikeTokenId, _gameMode);
        return sessionId;
    }
    
    /**
     * @dev Complete a game session and calculate rewards
     */
    function completeGame(
        uint256 sessionId,
        uint256 score,
        uint256 distance,
        uint256 vehiclesDodged
    ) external nonReentrant {
        GameSession storage session = gameSessions[sessionId];
        require(session.player == msg.sender, "Not your session");
        require(!session.completed, "Session already completed");
        
        // Update session
        session.score = score;
        session.distance = distance;
        session.vehiclesDodged = vehiclesDodged;
        session.completed = true;
        
        BikeNFT storage bike = bikeNFTs[session.bikeTokenId];
        uint256 totalRewards = 0;
        
        // Calculate RACE token rewards based on performance and bike stats
        uint256 baseReward = 10 * 10**18; // 10 RACE tokens base
        
        // Bike stat bonuses (better bikes earn more)
        uint256 bikeBonus = ((bike.speed + bike.acceleration + bike.handling) * 10**17) / 100; // Up to 2.7 RACE bonus
        uint256 scoreBonus = (score / 100) * 10**18; // 1 RACE per 100 points
        uint256 distanceBonus = (distance / 1000) * 5 * 10**18; // 5 RACE per 1000m
        uint256 dodgeBonus = vehiclesDodged * 2 * 10**18; // 2 RACE per dodge
        
        totalRewards = baseReward + bikeBonus + scoreBonus + distanceBonus + dodgeBonus;
        
        // Handle different game modes
        if (session.gameMode == GameMode.DAILY_CHALLENGE) {
            uint256 today = getCurrentDay();
            DailyChallenge storage challenge = dailyChallenges[today];
            
            if (score >= challenge.targetScore && !completedDailyChallenges[msg.sender][today]) {
                completedDailyChallenges[msg.sender][today] = true;
                challengeCompleted[today][msg.sender] = true;
                challengeBestScores[today][msg.sender] = score;
                totalRewards += challenge.rewardAmount;
                
                emit DailyChallengeCompleted(msg.sender, today, score, challenge.rewardAmount);
            }
        } else if (session.gameMode == GameMode.PRACTICE) {
            // Practice mode gives reduced rewards
            totalRewards = totalRewards / 2;
        }
        // Ranked mode gives full rewards
        
        // Add to player rewards (to be claimed later gaslessly)
        playerRewards[msg.sender] += totalRewards;
        session.rewardsClaimed = totalRewards;
        
        emit GameCompleted(msg.sender, sessionId, score, totalRewards, session.gameMode);
    }
    
    /**
     * @dev Claim accumulated RACE token rewards (gasless)
     */
    function claimRewards() external nonReentrant {
        uint256 rewards = playerRewards[msg.sender];
        require(rewards > 0, "No rewards to claim");
        
        playerRewards[msg.sender] = 0;
        require(raceToken.transfer(msg.sender, rewards), "Reward transfer failed");
        
        emit RewardsClaimed(msg.sender, rewards);
    }
    
    /**
     * @dev Transfer RACE tokens between players (gasless)
     */
    function transferTokensToPlayer(address _to, uint256 _amount) external nonReentrant {
        uint256 senderBalance = playerRewards[msg.sender];
        require(senderBalance >= _amount, "Insufficient balance");
        require(_to != msg.sender, "Cannot transfer to yourself");
        require(_to != address(0), "Invalid recipient");
        
        playerRewards[msg.sender] -= _amount;
        playerRewards[_to] += _amount;
        
        emit TokensTransferred(msg.sender, _to, _amount);
    }
    
    // ===== DAILY CHALLENGE FUNCTIONS =====
    
    /**
     * @dev Create daily challenge (automated)
     */
    function _createDailyChallenge() internal {
        uint256 today = getCurrentDay();
        uint256 targetScore = 500 + (block.timestamp % 1000); // Random target between 500-1500
        uint256 rewardAmount = 50 * 10**18; // 50 RACE tokens
        
        dailyChallenges[today].challengeDate = today;
        dailyChallenges[today].targetScore = targetScore;
        dailyChallenges[today].rewardAmount = rewardAmount;
        dailyChallenges[today].active = true;
        
        emit DailyChallengeCreated(today, targetScore, rewardAmount);
    }
    
    /**
     * @dev Update daily challenge if needed
     */
    function updateDailyChallenge() external {
        uint256 today = getCurrentDay();
        if (today > currentChallengeDate) {
            dailyChallenges[currentChallengeDate].active = false;
            currentChallengeDate = today;
            _createDailyChallenge();
        }
    }
    
    function getCurrentDay() internal view returns (uint256) {
        return block.timestamp / 86400; // 24 hours in seconds
    }
    
    // ===== VIEW FUNCTIONS =====
    
    function getPlayerBikes(address player) external view returns (uint256[] memory) {
        return ownedBikes[player];
    }
    
    function getPlayerSessions(address player) external view returns (uint256[] memory) {
        return playerSessions[player];
    }
    
    function getGameSession(uint256 sessionId) external view returns (GameSession memory) {
        return gameSessions[sessionId];
    }
    
    function getBikeNFT(uint256 tokenId) external view returns (BikeNFT memory) {
        return bikeNFTs[tokenId];
    }
    
    function getPlayerRewards(address player) external view returns (uint256) {
        return playerRewards[player];
    }
    
    function getDailyChallenge(uint256 challengeDate) external view returns (uint256, uint256, bool) {
        DailyChallenge storage challenge = dailyChallenges[challengeDate];
        return (challenge.targetScore, challenge.rewardAmount, challenge.active);
    }
    
    function hasCompletedDailyChallenge(address player, uint256 challengeDate) external view returns (bool) {
        return completedDailyChallenges[player][challengeDate];
    }
    
    // ===== ADMIN FUNCTIONS =====
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function withdrawFees() external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this)) - totalPrizePool;
        require(balance > 0, "No fees to withdraw");
        require(usdc.transfer(owner(), balance), "Fee withdrawal failed");
    }
    
    function updateRaceToken(address _raceToken) external onlyOwner {
        raceToken = IERC20(_raceToken);
    }
    
    // ===== REQUIRED OVERRIDES =====
    
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable) returns (address) {
        return super._update(to, tokenId, auth);
    }
    
    function _increaseBalance(address account, uint128 value) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        _requireOwned(tokenId);
        
        BikeNFT memory bike = bikeNFTs[tokenId];
        string memory bikeTypeName = getBikeTypeName(bike.bikeType);
        
        return string(abi.encodePacked(
            "data:application/json;base64,",
            "eyJuYW1lIjoiQmlrZSBSYWNlciAjIiwgInR5cGUiOiIiLCAic3BlZWQiOiIiLCAiYWNjZWxlcmF0aW9uIjoiIiwgImhhbmRsaW5nIjoiIn0="
        ));
    }
    
    function getBikeTypeName(BikeType bikeType) internal pure returns (string memory) {
        if (bikeType == BikeType.SPORTS) return "Sports";
        if (bikeType == BikeType.LADY) return "Lady";
        return "Chopper";
    }
}