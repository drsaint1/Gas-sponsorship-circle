// components/CarGame.tsx - Clean game logic without blockchain integration
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";
import { useGame } from './context/GameContext';

interface GameStats {
  score: number;
  distance: number;
  vehiclesDodged: number;
  bonusBoxesCollected: number;
  lapTime: number;
  gameCompleted: boolean;
}

interface PlayerProfile {
  id: string;
  level: number;
  totalXp: number;
  highScore: number;
  gamesPlayed: number;
  totalDistance: number;
  totalVehiclesDodged: number;
  totalBonusBoxesCollected: number;
  bestLapTime: number;
  winRate: number;
  createdAt: number;
  lastPlayedAt: number;
}

interface BikeGameProps {
  bikeType: "sports" | "lady" | "chopper";
  onBackToMenu?: () => void;
}

const BikeRunner: React.FC<BikeGameProps> = ({ bikeType, onBackToMenu }) => {
  const { completeCurrentGame, selectedBike, walletRaceTokenBalance } = useGame();
  // Three.js refs
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | undefined>(undefined);
  const rendererRef = useRef<THREE.WebGLRenderer | undefined>(undefined);
  const cameraRef = useRef<THREE.PerspectiveCamera | undefined>(undefined);
  const carRef = useRef<THREE.Group | undefined>(undefined);
  const roadRef = useRef<THREE.Mesh | undefined>(undefined);
  const roadLinesRef = useRef<THREE.Mesh[]>([]);
  const oncomingVehiclesRef = useRef<THREE.Group[]>([]);
  const bonusBoxesRef = useRef<THREE.Group[]>([]);
  const goldenKeysRef = useRef<THREE.Group[]>([]);
  const invisibilityIndicatorRef = useRef<THREE.Mesh | undefined>(undefined);
  const animationIdRef = useRef<number | undefined>(undefined);
  const frameCountRef = useRef<number>(0);

  // Game state
  const [score, setScore] = useState(0);
  const [speed, setSpeed] = useState(1.0);
  const [gameRunning, setGameRunning] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [tokensEarnedThisGame, setTokensEarnedThisGame] = useState(0);
  const [showTokenAnimation, setShowTokenAnimation] = useState(false);
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(
    null
  );
  const [showMissionComplete, setShowMissionComplete] = useState<string | null>(
    null
  );
  const [invisibilityActive, setInvisibilityActive] = useState(false);
  const [invisibilityCountdown, setInvisibilityCountdown] = useState(0);
  const [walletProcessing, setWalletProcessing] = useState(false);
  const [walletLoadingMessage, setWalletLoadingMessage] = useState("");

  // Use ref for gameRunning in animate to avoid stale state
  const gameRunningRef = useRef(false);

  // Enhanced game stats tracking with refs for real-time updates
  const gameStatsRef = useRef({
    distance: 0,
    vehiclesDodged: 0,
    bonusBoxesCollected: 0,
    gameStartTime: Date.now(),
    finalScore: 0,
    lapTime: 0,
  });

  // Separate state for display (synced from ref)
  const [gameStatsDisplay, setGameStatsDisplay] = useState({
    distance: 0,
    vehiclesDodged: 0,
    bonusBoxesCollected: 0,
  });

  // Game variables
  const gameStateRef = useRef({
    carPosition: 0,
    targetCarPosition: 0,
    baseGameSpeed: 0.008,
    speedMultiplier: 1.0,
    vehicleSpawnRate: 0.025,
    nextBonusThreshold: 70,
    gameStartTime: Date.now(),
    nextKeySpawnTime: 15,
    keySpawnInterval: 30,
    isInvisible: false,
    invisibilityTimer: 0,
    currentScore: 0,
  });

  // Input handling
  const keysRef = useRef({
    left: false,
    right: false,
    up: false,
    down: false,
  });

  // Local storage functions
  const saveProfileToLocalStorage = useCallback((profile: PlayerProfile) => {
    localStorage.setItem("bike_game_player_profile", JSON.stringify(profile));
  }, []);

  const loadProfileFromLocalStorage = useCallback((): PlayerProfile | null => {
    try {
      const saved = localStorage.getItem("bike_game_player_profile");
      if (saved) {
        const profile = JSON.parse(saved);
        return profile;
      }
    } catch (error) {
    }
    return null;
  }, []);

  // Create new player profile
  const createNewPlayerProfile = useCallback((): PlayerProfile => {
    return {
      id:
        "player_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9),
      level: 1,
      totalXp: 0,
      highScore: 0,
      gamesPlayed: 0,
      totalDistance: 0,
      totalVehiclesDodged: 0,
      totalBonusBoxesCollected: 0,
      bestLapTime: 0,
      winRate: 0,
      createdAt: Date.now(),
      lastPlayedAt: Date.now(),
    };
  }, []);

  // Calculate level from XP
  const calculateLevel = useCallback((xp: number): number => {
    return Math.floor(xp / 100) + 1;
  }, []);

  // Calculate XP gain from game performance
  const calculateXpGain = useCallback((stats: GameStats): number => {
    let xp = 10; // Base XP
    xp += Math.floor(stats.score / 10);
    xp += Math.floor(stats.distance / 100);
    xp += stats.vehiclesDodged * 4; // More XP for dodging vehicles (main challenge)
    xp += stats.bonusBoxesCollected * 5;
    if (stats.gameCompleted) xp += 25;
    if (stats.lapTime > 0 && stats.lapTime < 60) xp += 15;
    return Math.max(10, xp);
  }, []);

  // Initialize profile
  useEffect(() => {
    const existingProfile = loadProfileFromLocalStorage();
    if (existingProfile) {
      setPlayerProfile(existingProfile);
    } else {
      const newProfile = createNewPlayerProfile();
      setPlayerProfile(newProfile);
      saveProfileToLocalStorage(newProfile);
    }
  }, [
    loadProfileFromLocalStorage,
    createNewPlayerProfile,
    saveProfileToLocalStorage,
  ]);

  const showPopup = useCallback((text: string) => {
    setShowMissionComplete(text);
    setTimeout(() => setShowMissionComplete(null), 3000);
  }, []);

  // Check achievements
  const checkAchievements = useCallback(
    (stats: GameStats) => {
      if (!playerProfile) return;

      // First ride achievement
      if (playerProfile.gamesPlayed === 0) {
        showPopup("🏆 Achievement Unlocked: First Ride!");
      }

      // Speed runner achievement (1000m in one race)
      if (stats.distance >= 1000) {
        showPopup("🏆 Achievement Unlocked: Speed Runner!");
      }

      // Vehicle dodging achievements in single race
      if (stats.vehiclesDodged >= 20) {
        showPopup("🏆 Achievement Unlocked: Traffic Ninja!");
      }

      // Check total achievements
      const totalBonusBoxes =
        playerProfile.totalBonusBoxesCollected + stats.bonusBoxesCollected;
      const totalVehicles =
        playerProfile.totalVehiclesDodged + stats.vehiclesDodged;
      const totalDistance = playerProfile.totalDistance + stats.distance;

      if (totalBonusBoxes >= 50) {
        showPopup("🏆 Achievement Unlocked: Collector Master!");
      }

      if (totalVehicles >= 100) {
        showPopup("🏆 Achievement Unlocked: Traffic Dodger!");
      }

      if (totalVehicles >= 500) {
        showPopup("🏆 Achievement Unlocked: Highway Legend!");
      }

      if (totalDistance >= 10000) {
        showPopup("🏆 Achievement Unlocked: Distance Legend!");
      }
    },
    [playerProfile, showPopup]
  );

  // Updated stats sync function
  const updateDisplayStats = useCallback(() => {
    setGameStatsDisplay({
      distance: gameStatsRef.current.distance,
      vehiclesDodged: gameStatsRef.current.vehiclesDodged,
      bonusBoxesCollected: gameStatsRef.current.bonusBoxesCollected,
    });
  }, []);

  // Create road lines properly
  const createRoadLines = useCallback(() => {
    if (!sceneRef.current) return;

    roadLinesRef.current.forEach((line) => {
      if (sceneRef.current) {
        sceneRef.current.remove(line);
      }
    });
    roadLinesRef.current = [];

    const lineSpacing = 8;
    const lineLength = 4;
    const numLines = 500;

    for (let i = 0; i < numLines; i++) {
      const zPosition = i * lineSpacing - 2000;

      const lineGeometry = new THREE.PlaneGeometry(0.2, lineLength);
      const lineMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.rotation.x = -Math.PI / 2;
      line.position.set(0, 0.005, zPosition);
      sceneRef.current.add(line);
      roadLinesRef.current.push(line);

      const leftLine = new THREE.Mesh(
        lineGeometry.clone(),
        lineMaterial.clone()
      );
      leftLine.rotation.x = -Math.PI / 2;
      leftLine.position.set(-3, 0.005, zPosition);
      sceneRef.current.add(leftLine);
      roadLinesRef.current.push(leftLine);

      const rightLine = new THREE.Mesh(
        lineGeometry.clone(),
        lineMaterial.clone()
      );
      rightLine.rotation.x = -Math.PI / 2;
      rightLine.position.set(3, 0.005, zPosition);
      sceneRef.current.add(rightLine);
      roadLinesRef.current.push(rightLine);
    }
  }, []);

  // Create desert environment with houses and street lights
  const createDesertEnvironment = useCallback(() => {
    if (!sceneRef.current) return;

    // Reusable materials to reduce texture units
    const desertMaterial = new THREE.MeshLambertMaterial({ color: 0xdeb887 }); // Sandy brown color
    const poleMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 }); // Gray pole
    const lightMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffaa,
      emissive: 0x444400,
    }); // Light
    const cactusMaterial = new THREE.MeshLambertMaterial({ color: 0x228b22 }); // Cactus green
    const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 }); // Brown rocks

    // Desert ground on both sides of the road
    const leftDesertGeometry = new THREE.PlaneGeometry(20, 4000);
    const rightDesertGeometry = new THREE.PlaneGeometry(20, 4000);

    const leftDesert = new THREE.Mesh(leftDesertGeometry, desertMaterial);
    leftDesert.rotation.x = -Math.PI / 2;
    leftDesert.position.set(-16, -0.02, 1000); // Left side of road
    leftDesert.receiveShadow = true;
    sceneRef.current.add(leftDesert);

    const rightDesert = new THREE.Mesh(
      rightDesertGeometry,
      desertMaterial.clone()
    );
    rightDesert.rotation.x = -Math.PI / 2;
    rightDesert.position.set(16, -0.02, 1000); // Right side of road
    rightDesert.receiveShadow = true;
    sceneRef.current.add(rightDesert);

    // Add random street lights (no houses)
    for (let i = 0; i < 12; i++) {
      // Only add street light if random chance
      if (Math.random() < 0.6) {
        // 60% chance for each light
        const zPosition = -50 + i * 80 + Math.random() * 40; // More spread out
        const side = Math.random() < 0.5 ? -1 : 1; // Random side
        const xPosition = side * 7; // Close to road edge

        // Street light pole
        const poleGeometry = new THREE.CylinderGeometry(0.1, 0.1, 6);
        const pole = new THREE.Mesh(poleGeometry, poleMaterial);
        pole.position.set(xPosition, 3, zPosition);
        sceneRef.current.add(pole);

        // Light fixture
        const lightGeometry = new THREE.SphereGeometry(0.3);
        const light = new THREE.Mesh(lightGeometry, lightMaterial);
        light.position.set(xPosition, 5.8, zPosition);
        sceneRef.current.add(light);
      }
    }

    // Add some desert vegetation (cacti and bushes)
    for (let i = 0; i < 8; i++) {
      const zPosition = -50 + Math.random() * 3600;
      const side = Math.random() < 0.5 ? -1 : 1;
      const xPosition = side * (12 + Math.random() * 8);

      if (Math.random() < 0.6) {
        // Cactus
        const cactusGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2);
        const cactus = new THREE.Mesh(cactusGeometry, cactusMaterial);
        cactus.position.set(xPosition, 1, zPosition);
        sceneRef.current.add(cactus);

        // Cactus arms
        if (Math.random() < 0.7) {
          const armGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1);
          const leftArm = new THREE.Mesh(armGeometry, cactusMaterial);
          leftArm.rotation.z = Math.PI / 2;
          leftArm.position.set(xPosition - 0.8, 1.5, zPosition);
          sceneRef.current.add(leftArm);

          if (Math.random() < 0.5) {
            const rightArm = new THREE.Mesh(armGeometry, cactusMaterial);
            rightArm.rotation.z = -Math.PI / 2;
            rightArm.position.set(xPosition + 0.8, 1.2, zPosition);
            sceneRef.current.add(rightArm);
          }
        }
      } else {
        // Desert bush
        const bushGeometry = new THREE.SphereGeometry(0.5, 8, 6);
        const bushMaterial = new THREE.MeshLambertMaterial({ color: 0x6b8e23 });
        const bush = new THREE.Mesh(bushGeometry, bushMaterial);
        bush.position.set(xPosition, 0.5, zPosition);
        bush.scale.set(1, 0.6, 1); // Flatten it a bit
        sceneRef.current.add(bush);
      }
    }

    // Add some rocks scattered around
    for (let i = 0; i < 5; i++) {
      const zPosition = -50 + Math.random() * 3600;
      const side = Math.random() < 0.5 ? -1 : 1;
      const xPosition = side * (10 + Math.random() * 12);

      const rockGeometry = new THREE.SphereGeometry(
        0.3 + Math.random() * 0.4,
        6,
        4
      );
      const rock = new THREE.Mesh(rockGeometry, rockMaterial);
      rock.position.set(xPosition, Math.random() * 0.2, zPosition);
      rock.scale.set(1, 0.5 + Math.random() * 0.5, 1);
      sceneRef.current.add(rock);
    }
  }, []);

  // Create oncoming vehicle
  const createOncomingVehicle = useCallback((carZ: number) => {
    if (!sceneRef.current) return;

    const vehicleGroup = new THREE.Group();

    // Create different types of vehicles
    const vehicleType = Math.random();

    if (vehicleType < 0.3) {
      // Sedan car
      const bodyGeometry = new THREE.BoxGeometry(2.0, 0.6, 3.2);
      const bodyMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.15, 0.7, 0.4), // Blues
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.8;
      body.castShadow = true;
      vehicleGroup.add(body);

      // Roof
      const roofGeometry = new THREE.BoxGeometry(1.6, 0.4, 1.8);
      const roofMaterial = new THREE.MeshLambertMaterial({
        color: bodyMaterial.color.clone().multiplyScalar(0.8),
      });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = 1.2;
      roof.position.z = 0.2;
      roof.castShadow = true;
      vehicleGroup.add(roof);
    } else if (vehicleType < 0.6) {
      // SUV/Truck
      const bodyGeometry = new THREE.BoxGeometry(2.2, 0.8, 4.0);
      const bodyMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.45, 0.6, 0.3), // Greens
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 1.0;
      body.castShadow = true;
      vehicleGroup.add(body);

      // Cabin
      const cabinGeometry = new THREE.BoxGeometry(2.0, 0.6, 2.0);
      const cabinMaterial = new THREE.MeshLambertMaterial({
        color: bodyMaterial.color.clone().multiplyScalar(0.9),
      });
      const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
      cabin.position.y = 1.6;
      cabin.position.z = 0.5;
      cabin.castShadow = true;
      vehicleGroup.add(cabin);
    } else {
      // Sports car
      const bodyGeometry = new THREE.BoxGeometry(1.8, 0.5, 3.0);
      const bodyMaterial = new THREE.MeshLambertMaterial({
        color: new THREE.Color().setHSL(Math.random() * 0.1 + 0.85, 0.8, 0.5), // Reds
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.y = 0.6;
      body.castShadow = true;
      vehicleGroup.add(body);

      // Low profile roof
      const roofGeometry = new THREE.BoxGeometry(1.4, 0.3, 1.2);
      const roofMaterial = new THREE.MeshLambertMaterial({
        color: bodyMaterial.color.clone().multiplyScalar(0.7),
      });
      const roof = new THREE.Mesh(roofGeometry, roofMaterial);
      roof.position.y = 0.95;
      roof.position.z = -0.2;
      roof.castShadow = true;
      vehicleGroup.add(roof);
    }

    // Add wheels to all vehicle types
    const wheelGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff }); // White wheels
    const wheelPositions = [
      [-0.9, 0.25, 1.0],
      [0.9, 0.25, 1.0],
      [-0.9, 0.25, -1.0],
      [0.9, 0.25, -1.0],
    ];

    wheelPositions.forEach((pos) => {
      const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(pos[0], pos[1], pos[2]);
      wheel.castShadow = true;
      vehicleGroup.add(wheel);
    });

    // Add headlights
    const headlightGeometry = new THREE.SphereGeometry(0.15);
    const headlightMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffdd,
      emissive: 0x444433,
    });
    const leftHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    leftHeadlight.position.set(-0.7, 0.9, 1.8);
    vehicleGroup.add(leftHeadlight);

    const rightHeadlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    rightHeadlight.position.set(0.7, 0.9, 1.8);
    vehicleGroup.add(rightHeadlight);

    // Position the vehicle
    const lanes = [-4.5, -1.5, 1.5, 4.5];
    const laneIndex = Math.floor(Math.random() * lanes.length);
    const spawnDistance = Math.random() * 200 + 150;

    // Vehicles spawn ahead and move towards the player
    vehicleGroup.position.set(lanes[laneIndex], 0, carZ - spawnDistance);

    // Store vehicle speed for movement
    (vehicleGroup as any).userData = {
      speed: 0.8 + Math.random() * 0.4, // Random speed between 0.8 and 1.2
      lane: laneIndex,
    };

    sceneRef.current.add(vehicleGroup);
    oncomingVehiclesRef.current.push(vehicleGroup);
  }, []);

  const createBonusBox = useCallback((carZ: number) => {
    if (!sceneRef.current) return;

    const bonusGroup = new THREE.Group();

    const boxGeometry = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    const boxMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const box = new THREE.Mesh(boxGeometry, boxMaterial);
    box.position.y = 0.75;
    box.castShadow = true;
    bonusGroup.add(box);

    const symbolGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 6);
    const symbolMaterial = new THREE.MeshLambertMaterial({ color: 0xffd700 });
    const symbol = new THREE.Mesh(symbolGeometry, symbolMaterial);
    symbol.position.y = 1.6;
    symbol.rotation.x = -Math.PI / 2;
    symbol.castShadow = true;
    bonusGroup.add(symbol);

    const lanes = [-4.5, -1.5, 1.5, 4.5];
    const laneIndex = Math.floor(Math.random() * lanes.length);
    const randomDistance = Math.random() * 200 + 100;
    bonusGroup.position.set(lanes[laneIndex], 0, carZ - randomDistance);

    sceneRef.current.add(bonusGroup);
    bonusBoxesRef.current.push(bonusGroup);
  }, []);

  const createGoldenKey = useCallback((carZ: number) => {
    if (!sceneRef.current) return;

    const keyGroup = new THREE.Group();
    const handleGeometry = new THREE.TorusGeometry(0.6, 0.15);
    const keyMaterial = new THREE.MeshLambertMaterial({
      color: 0xffd700,
      emissive: 0x332200,
    });
    const handle = new THREE.Mesh(handleGeometry, keyMaterial);
    handle.position.y = 1;
    handle.castShadow = true;
    keyGroup.add(handle);

    const shaftGeometry = new THREE.BoxGeometry(0.2, 0.2, 1.5);
    const shaft = new THREE.Mesh(shaftGeometry, keyMaterial);
    shaft.position.set(0, 1, -0.75);
    shaft.castShadow = true;
    keyGroup.add(shaft);

    (keyGroup as any).userData = { rotationSpeed: 0.05 };

    const lanes = [-4.5, -1.5, 1.5, 4.5];
    const laneIndex = Math.floor(Math.random() * lanes.length);
    const randomDistance = Math.random() * 400 + 200;
    keyGroup.position.set(lanes[laneIndex], 0, carZ - randomDistance);

    sceneRef.current.add(keyGroup);
    goldenKeysRef.current.push(keyGroup);
  }, []);

  const activateInvisibility = useCallback(() => {

    const totalDuration = 15000; // 15 seconds

    gameStateRef.current.isInvisible = true;
    gameStateRef.current.invisibilityTimer = totalDuration;
    setInvisibilityActive(true);
    setInvisibilityCountdown(Math.ceil(totalDuration / 1000));

    if (invisibilityIndicatorRef.current) {
      invisibilityIndicatorRef.current.visible = true;
    }

    if (carRef.current) {
      carRef.current.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material && !Array.isArray(mesh.material)) {
          mesh.material.transparent = true;
          (mesh.material as any).opacity = 0.7;
        }
      });
    }

    showPopup(`⚡ INVISIBLE MODE ACTIVATED (15s) ⚡`);
  }, [showPopup]);

  const deactivateInvisibility = useCallback(() => {

    gameStateRef.current.isInvisible = false;
    gameStateRef.current.invisibilityTimer = 0;
    setInvisibilityActive(false);
    setInvisibilityCountdown(0);

    if (invisibilityIndicatorRef.current) {
      invisibilityIndicatorRef.current.visible = false;
    }

    if (carRef.current) {
      carRef.current.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material && !Array.isArray(mesh.material)) {
          mesh.material.transparent = false;
          (mesh.material as any).opacity = 1.0;
        }
      });
    }

  }, []);

  // Animation function
  const animate = useCallback(() => {
    if (!gameRunningRef.current) {
      return;
    }
    if (!rendererRef.current) {
      return;
    }
    if (!sceneRef.current) {
      return;
    }
    if (!cameraRef.current) {
      return;
    }
    if (!carRef.current) {
      return;
    }

    // Debug log every 60 frames (roughly 1 second at 60fps)
    if (frameCountRef.current % 60 === 0) {
    }
    frameCountRef.current = (frameCountRef.current || 0) + 1;

    const car = carRef.current;
    const camera = cameraRef.current;
    const renderer = rendererRef.current;
    const scene = sceneRef.current;
    const road = roadRef.current;
    const roadLines = roadLinesRef.current;

    if (keysRef.current.up) {
      gameStateRef.current.speedMultiplier = Math.min(
        2.0,
        gameStateRef.current.speedMultiplier + 0.02
      );
    }
    if (keysRef.current.down) {
      gameStateRef.current.speedMultiplier = Math.max(
        0.2,
        gameStateRef.current.speedMultiplier - 0.02
      );
    }

    const currentGameSpeed =
      gameStateRef.current.baseGameSpeed * gameStateRef.current.speedMultiplier;
    setSpeed(gameStateRef.current.speedMultiplier);

    if (gameStateRef.current.isInvisible) {
      gameStateRef.current.invisibilityTimer -= 16;

      const secondsLeft = Math.ceil(
        gameStateRef.current.invisibilityTimer / 1000
      );
      setInvisibilityCountdown(Math.max(0, secondsLeft));

      if (invisibilityIndicatorRef.current) {
        invisibilityIndicatorRef.current.rotation.y += 0.1;
      }

      if (gameStateRef.current.invisibilityTimer <= 0) {
        deactivateInvisibility();
      }
    }

    car.position.z -= currentGameSpeed * 30;

    const newDistance = Math.floor(
      (Date.now() - gameStatsRef.current.gameStartTime) / 100
    );
    gameStatsRef.current.distance = newDistance;

    if (newDistance % 10 === 0) {
      updateDisplayStats();
    }

    camera.position.z = car.position.z + 12;
    camera.lookAt(car.position.x, 0, car.position.z - 3);

    if (road) road.position.z = car.position.z - 1000;

    roadLines.forEach((line) => {
      if (line.position.z > car.position.z + 50) {
        line.position.z -= 4000;
      }
    });

    if (keysRef.current.left && gameStateRef.current.carPosition > -1) {
      gameStateRef.current.carPosition -= 0.08;
      gameStateRef.current.targetCarPosition = gameStateRef.current.carPosition;
    }
    if (keysRef.current.right && gameStateRef.current.carPosition < 1) {
      gameStateRef.current.carPosition += 0.08;
      gameStateRef.current.targetCarPosition = gameStateRef.current.carPosition;
    }

    if (
      Math.abs(
        gameStateRef.current.targetCarPosition -
          gameStateRef.current.carPosition
      ) > 0.01
    ) {
      const moveSpeed = 0.12;
      if (
        gameStateRef.current.targetCarPosition >
        gameStateRef.current.carPosition
      ) {
        gameStateRef.current.carPosition = Math.min(
          gameStateRef.current.targetCarPosition,
          gameStateRef.current.carPosition + moveSpeed
        );
      } else {
        gameStateRef.current.carPosition = Math.max(
          gameStateRef.current.targetCarPosition,
          gameStateRef.current.carPosition - moveSpeed
        );
      }
    }

    gameStateRef.current.carPosition = Math.max(
      -1,
      Math.min(1, gameStateRef.current.carPosition)
    );
    car.position.x = gameStateRef.current.carPosition * 4.5;

    // Spawn oncoming vehicles
    if (Math.random() < gameStateRef.current.vehicleSpawnRate) {
      createOncomingVehicle(car.position.z);
    }

    if (
      gameStateRef.current.currentScore >=
      gameStateRef.current.nextBonusThreshold
    ) {
      createBonusBox(car.position.z);
      gameStateRef.current.nextBonusThreshold += 70;
    }

    const gameTimeElapsed =
      (Date.now() - gameStateRef.current.gameStartTime) / 1000;
    if (gameTimeElapsed >= gameStateRef.current.nextKeySpawnTime) {
      createGoldenKey(car.position.z);
      gameStateRef.current.nextKeySpawnTime +=
        gameStateRef.current.keySpawnInterval;
    }

    goldenKeysRef.current.forEach((key) => {
      key.rotation.y += (key as any).userData.rotationSpeed;
    });

    // Move oncoming vehicles
    oncomingVehiclesRef.current.forEach((vehicle) => {
      // Move vehicles towards the player
      vehicle.position.z +=
        (vehicle as any).userData.speed * currentGameSpeed * 35;
    });

    // Bonus box collisions
    for (let i = bonusBoxesRef.current.length - 1; i >= 0; i--) {
      const bonusBox = bonusBoxesRef.current[i];

      if (bonusBox.position.z > car.position.z + 10) {
        scene.remove(bonusBox);
        bonusBoxesRef.current.splice(i, 1);
      } else if (
        Math.abs(bonusBox.position.z - car.position.z) < 2.5 &&
        Math.abs(bonusBox.position.x - car.position.x) < 1.8
      ) {
        scene.remove(bonusBox);
        bonusBoxesRef.current.splice(i, 1);

        gameStateRef.current.currentScore += 30;
        setScore(gameStateRef.current.currentScore);
        gameStatsRef.current.bonusBoxesCollected++;

        showPopup("+30 POINTS!");
      }
    }

    // Golden key collisions
    for (let i = goldenKeysRef.current.length - 1; i >= 0; i--) {
      const key = goldenKeysRef.current[i];

      if (key.position.z > car.position.z + 10) {
        scene.remove(key);
        goldenKeysRef.current.splice(i, 1);
      } else if (
        Math.abs(key.position.z - car.position.z) < 2.5 &&
        Math.abs(key.position.x - car.position.x) < 1.8
      ) {
        scene.remove(key);
        goldenKeysRef.current.splice(i, 1);
        activateInvisibility();
      }
    }

    // Oncoming vehicle collisions
    for (let i = oncomingVehiclesRef.current.length - 1; i >= 0; i--) {
      const vehicle = oncomingVehiclesRef.current[i];

      if (vehicle.position.z > car.position.z + 15) {
        // Vehicle passed the player - award points for dodging
        scene.remove(vehicle);
        oncomingVehiclesRef.current.splice(i, 1);

        gameStateRef.current.currentScore += 10;
        setScore(gameStateRef.current.currentScore);
        gameStatsRef.current.vehiclesDodged++;
      } else if (
        !gameStateRef.current.isInvisible &&
        Math.abs(vehicle.position.z - car.position.z) < 3.0 &&
        Math.abs(vehicle.position.x - car.position.x) < 2.0
      ) {
        endGame();
        return;
      }
    }

    gameStateRef.current.baseGameSpeed += 0.000015;
    gameStateRef.current.vehicleSpawnRate = Math.min(
      0.045,
      gameStateRef.current.vehicleSpawnRate + 0.000012
    );

    renderer.render(scene, camera);
    animationIdRef.current = requestAnimationFrame(animate);
  }, [
    createOncomingVehicle,
    createBonusBox,
    createGoldenKey,
    activateInvisibility,
    deactivateInvisibility,
    showPopup,
    updateDisplayStats,
  ]);

  // Game ending function
  const endGame = useCallback(async () => {

    setGameRunning(false);
    gameRunningRef.current = false;
    setGameOver(true);

    const gameEndTime = Date.now();
    const lapTime = (gameEndTime - gameStatsRef.current.gameStartTime) / 1000;
    gameStatsRef.current.lapTime = lapTime;
    gameStatsRef.current.finalScore = gameStateRef.current.currentScore;

    updateDisplayStats();

    // Calculate token rewards
    const baseReward = 10;
    const bikeBonus = selectedBike ? Math.floor((selectedBike.speed + selectedBike.acceleration + selectedBike.handling) / 100) : 0;
    const scoreBonus = Math.floor(gameStatsRef.current.finalScore / 100);
    const distanceBonus = Math.floor(gameStatsRef.current.distance / 1000) * 5;
    const dodgeBonus = gameStatsRef.current.vehiclesDodged * 2;
    
    const totalRewards = baseReward + bikeBonus + scoreBonus + distanceBonus + dodgeBonus;
    setTokensEarnedThisGame(totalRewards);

    // Complete game on blockchain (Circle integration)
    try {
      // Show initial processing message
      setWalletProcessing(true);
      setWalletLoadingMessage("Calculating your rewards...");
      
      // Brief delay to show calculation
      await new Promise(resolve => setTimeout(resolve, 800));
      setWalletLoadingMessage("Preparing token claim transaction...");
      
      // Another delay for preparation
      await new Promise(resolve => setTimeout(resolve, 600));
      setWalletLoadingMessage("Approve token claim in your wallet");
      
      // Call the actual blockchain transaction
      await completeCurrentGame(
        gameStatsRef.current.finalScore,
        gameStatsRef.current.distance,
        gameStatsRef.current.vehiclesDodged
      );
      
      // Success - add small delay to show completion
      setWalletLoadingMessage("✅ Transaction confirmed! Tokens claimed successfully.");
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      setWalletProcessing(false);
      setWalletLoadingMessage("");
      showPopup(`🎁 ${totalRewards} RACE tokens earned!`);
      setShowTokenAnimation(true);
      setTimeout(() => setShowTokenAnimation(false), 3000);
    } catch (error) {
      setWalletProcessing(false);
      setWalletLoadingMessage("");
      showPopup("⚠️ Failed to save to blockchain");
    }

    if (!playerProfile) return;

    try {
      const gameStats: GameStats = {
        score: gameStatsRef.current.finalScore,
        distance: gameStatsRef.current.distance,
        vehiclesDodged: gameStatsRef.current.vehiclesDodged,
        bonusBoxesCollected: gameStatsRef.current.bonusBoxesCollected,
        lapTime: gameStatsRef.current.lapTime,
        gameCompleted: true,
      };

      // Check achievements
      checkAchievements(gameStats);

      const xpGained = calculateXpGain(gameStats);

      const updatedProfile: PlayerProfile = {
        ...playerProfile,
        gamesPlayed: playerProfile.gamesPlayed + 1,
        totalXp: playerProfile.totalXp + xpGained,
        totalDistance: playerProfile.totalDistance + gameStats.distance,
        totalVehiclesDodged:
          playerProfile.totalVehiclesDodged + gameStats.vehiclesDodged,
        totalBonusBoxesCollected:
          playerProfile.totalBonusBoxesCollected +
          gameStats.bonusBoxesCollected,
        lastPlayedAt: Date.now(),
      };

      if (gameStats.score > updatedProfile.highScore) {
        updatedProfile.highScore = gameStats.score;
      }

      if (
        gameStats.lapTime > 0 &&
        (updatedProfile.bestLapTime === 0 ||
          gameStats.lapTime < updatedProfile.bestLapTime)
      ) {
        updatedProfile.bestLapTime = gameStats.lapTime;
      }

      if (gameStats.gameCompleted) {
        updatedProfile.winRate =
          (updatedProfile.winRate * (updatedProfile.gamesPlayed - 1) + 1) /
          updatedProfile.gamesPlayed;
      } else {
        updatedProfile.winRate =
          (updatedProfile.winRate * (updatedProfile.gamesPlayed - 1)) /
          updatedProfile.gamesPlayed;
      }

      updatedProfile.level = calculateLevel(updatedProfile.totalXp);

      setPlayerProfile(updatedProfile);
      saveProfileToLocalStorage(updatedProfile);

    } catch (error) {
      showPopup("⚠️ Game ended with errors");
    }
  }, [
    updateDisplayStats,
    playerProfile,
    checkAchievements,
    calculateXpGain,
    calculateLevel,
    saveProfileToLocalStorage,
    showPopup,
    completeCurrentGame,
  ]);

  const restartGame = useCallback(() => {

    setGameRunning(false);
    gameRunningRef.current = false;

    if (animationIdRef.current) {
      cancelAnimationFrame(animationIdRef.current);
    }

    if (sceneRef.current) {
      oncomingVehiclesRef.current.forEach((vehicle) =>
        sceneRef.current!.remove(vehicle)
      );
      bonusBoxesRef.current.forEach((box) => sceneRef.current!.remove(box));
      goldenKeysRef.current.forEach((key) => sceneRef.current!.remove(key));
    }

    oncomingVehiclesRef.current = [];
    bonusBoxesRef.current = [];
    goldenKeysRef.current = [];

    setScore(0);
    setSpeed(1.0);
    setGameOver(false);
    setTokensEarnedThisGame(0);
    setShowTokenAnimation(false);
    setInvisibilityActive(false);
    setInvisibilityCountdown(0);
    setShowMissionComplete(null);

    gameStateRef.current = {
      carPosition: 0,
      targetCarPosition: 0,
      baseGameSpeed: 0.008,
      speedMultiplier: 1.0,
      vehicleSpawnRate: 0.025,
      nextBonusThreshold: 70,
      gameStartTime: Date.now(),
      nextKeySpawnTime: 15,
      keySpawnInterval: 30,
      isInvisible: false,
      invisibilityTimer: 0,
      currentScore: 0,
    };

    gameStatsRef.current = {
      distance: 0,
      vehiclesDodged: 0,
      bonusBoxesCollected: 0,
      gameStartTime: Date.now(),
      finalScore: 0,
      lapTime: 0,
    };

    setGameStatsDisplay({
      distance: 0,
      vehiclesDodged: 0,
      bonusBoxesCollected: 0,
    });

    if (carRef.current) {
      carRef.current.position.set(0, 0, 8);
      carRef.current.children.forEach((child) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material && !Array.isArray(mesh.material)) {
          mesh.material.transparent = false;
          (mesh.material as any).opacity = 1.0;
        }
      });
    }

    if (invisibilityIndicatorRef.current) {
      invisibilityIndicatorRef.current.visible = false;
    }

    createRoadLines();

    setTimeout(() => {
      setGameRunning(true);
      gameRunningRef.current = true;
      setTimeout(() => {
        animate();
      }, 50);
    }, 100);
  }, [createRoadLines, animate]);

  // Initialize Three.js scene
  const init = useCallback(() => {
    if (!mountRef.current) {
      return;
    }


    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    scene.fog = new THREE.Fog(0x888888, 70, 150);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 8, 12);
    camera.lookAt(0, 0, -3);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x87ceeb, 1);
    renderer.shadowMap.enabled = false; // Disable shadows for better performance

    // Ensure canvas styling
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";

    rendererRef.current = renderer;

    while (mountRef.current.firstChild) {
      mountRef.current.removeChild(mountRef.current.firstChild);
    }
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const roadGeometry = new THREE.PlaneGeometry(12, 4000);
    const roadMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = -0.01;
    road.position.z = -1000;
    scene.add(road);
    roadRef.current = road;

    createRoadLines();
    createDesertEnvironment();

    const bikeGroup = createBikeModel(bikeType);

    // Set up invisibility indicator reference
    const invisibilityIndicator = bikeGroup.children.find(
      (child) =>
        child instanceof THREE.Mesh &&
        child.material &&
        (child.material as any).color &&
        (child.material as any).color.getHex() === 0xffff00
    ) as THREE.Mesh;
    if (invisibilityIndicator) {
      invisibilityIndicatorRef.current = invisibilityIndicator;
    }

    bikeGroup.position.set(0, 0, 8);
    scene.add(bikeGroup);
    carRef.current = bikeGroup; // Keep carRef name for consistency with existing code

    // Initialize stats
    gameStatsRef.current = {
      distance: 0,
      vehiclesDodged: 0,
      bonusBoxesCollected: 0,
      gameStartTime: Date.now(),
      finalScore: 0,
      lapTime: 0,
    };

    updateDisplayStats();


    // Render once immediately to make sure we can see something
    renderer.render(scene, camera);

    setGameRunning(true);
    gameRunningRef.current = true;

    setTimeout(() => {
      animate();
    }, 50);
  }, [createRoadLines, updateDisplayStats, animate, bikeType]);

  // Function to create bike model based on type
  const createBikeModel = useCallback((type: "sports" | "lady" | "chopper") => {
    const bikeGroup = new THREE.Group();

    if (type === "sports") {
      // === SPORTS BIKE (Realistic Design) ===
      createSportsBike(bikeGroup);
    } else if (type === "lady") {
      // === LADY'S BIKE (Simple Design) ===
      createLadysBike(bikeGroup);
    } else {
      // === CHOPPER BIKE (Heavy Duty Design) ===
      createChopperBike(bikeGroup);
    }

    return bikeGroup;
  }, []);

  // Sports Bike Creation Function
  const createSportsBike = (bikeGroup: THREE.Group) => {
    // Main frame
    const frameGeometry = new THREE.BoxGeometry(0.1, 0.1, 2.5);
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0xff4444 }); // Bright red frame
    const mainFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    mainFrame.position.set(0, 0.8, 0);
    mainFrame.castShadow = true;
    bikeGroup.add(mainFrame);

    // Engine
    const engineGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.4);
    const engineMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff88 }); // Bright green engine
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.set(0, 0.5, 0);
    engine.castShadow = true;
    bikeGroup.add(engine);

    // Gas tank
    const tankGeometry = new THREE.CylinderGeometry(0.3, 0.25, 0.8);
    const tankMaterial = new THREE.MeshLambertMaterial({ color: 0x0066cc });
    const tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(0, 1.0, 0.2);
    tank.castShadow = true;
    bikeGroup.add(tank);

    // Seat
    const seatGeometry = new THREE.BoxGeometry(0.4, 0.1, 0.6);
    const seatMaterial = new THREE.MeshLambertMaterial({ color: 0xffaa00 }); // Bright orange seat
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(0, 1.0, -0.4);
    seat.castShadow = true;
    bikeGroup.add(seat);

    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.15);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 }); // Bright yellow wheels

    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.35, 1.2);
    frontWheel.castShadow = true;
    bikeGroup.add(frontWheel);

    const rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.position.set(0, 0.35, -0.8);
    rearWheel.castShadow = true;
    bikeGroup.add(rearWheel);

    // Handlebars
    const handlebarGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8);
    const handlebarMaterial = new THREE.MeshLambertMaterial({
      color: 0xff00ff,
    }); // Bright magenta handlebars
    const handlebars = new THREE.Mesh(handlebarGeometry, handlebarMaterial);
    handlebars.rotation.z = Math.PI / 2;
    handlebars.position.set(0, 1.2, 1.0);
    handlebars.castShadow = true;
    bikeGroup.add(handlebars);

    // Exhaust
    const exhaustGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.6);
    const exhaustMaterial = new THREE.MeshLambertMaterial({ color: 0x00ffff }); // Bright cyan exhaust
    const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.rotation.z = Math.PI / 2;
    exhaust.position.set(0.3, 0.3, -0.2);
    exhaust.castShadow = true;
    bikeGroup.add(exhaust);

    // Add invisibility indicator
    const indicatorGeometry = new THREE.SphereGeometry(0.3);
    const indicatorMaterial = new THREE.MeshLambertMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });
    const invisibilityIndicator = new THREE.Mesh(
      indicatorGeometry,
      indicatorMaterial
    );
    invisibilityIndicator.position.set(0, 1.8, 0);
    invisibilityIndicator.visible = false;
    bikeGroup.add(invisibilityIndicator);
  };

  // Lady's Bike Creation Function (Simple Design)
  const createLadysBike = (bikeGroup: THREE.Group) => {
    // Simple motorcycle body/frame - colorful and visible
    const frameGeometry = new THREE.BoxGeometry(0.8, 0.6, 3.2);
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0xff69b4 }); // Pink frame
    const frame = new THREE.Mesh(frameGeometry, frameMaterial);
    frame.position.y = 0.8;
    frame.castShadow = true;
    bikeGroup.add(frame);

    // Gas tank - simple and bright
    const tankGeometry = new THREE.CylinderGeometry(0.6, 0.5, 1.2);
    const tankMaterial = new THREE.MeshLambertMaterial({ color: 0x00ffff }); // Cyan tank
    const tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.rotation.z = Math.PI / 2;
    tank.position.set(0, 1.2, 0.4);
    tank.castShadow = true;
    bikeGroup.add(tank);

    // Seat - colorful
    const seatGeometry = new THREE.BoxGeometry(1.0, 0.2, 1.2);
    const seatMaterial = new THREE.MeshLambertMaterial({ color: 0xffaa00 }); // Orange seat
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(0, 1.3, -0.2);
    seat.castShadow = true;
    bikeGroup.add(seat);

    // Simple handlebars
    const handlebarGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.4);
    const handlebarMaterial = new THREE.MeshLambertMaterial({
      color: 0xcccccc,
    });
    const handlebars = new THREE.Mesh(handlebarGeometry, handlebarMaterial);
    handlebars.rotation.z = Math.PI / 2;
    handlebars.position.set(0, 1.6, 1.2);
    handlebars.castShadow = true;
    bikeGroup.add(handlebars);

    // Simple fork
    const forkGeometry = new THREE.CylinderGeometry(0.12, 0.12, 1.0);
    const forkMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
    const fork = new THREE.Mesh(forkGeometry, forkMaterial);
    fork.position.set(0, 0.7, 1.4);
    fork.castShadow = true;
    bikeGroup.add(fork);

    // Simple wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.25);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.45, 1.4);
    frontWheel.castShadow = true;
    bikeGroup.add(frontWheel);

    const rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.position.set(0, 0.45, -0.6);
    rearWheel.castShadow = true;
    bikeGroup.add(rearWheel);

    // Simple exhaust
    const exhaustGeometry = new THREE.CylinderGeometry(0.12, 0.08, 2.0);
    const exhaustMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
    const exhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    exhaust.rotation.z = Math.PI / 2;
    exhaust.position.set(0.7, 0.6, -0.1);
    exhaust.castShadow = true;
    bikeGroup.add(exhaust);

    // Colorful side panels
    const sidePanelGeometry = new THREE.BoxGeometry(0.15, 0.8, 2.0);
    const sidePanelMaterial = new THREE.MeshLambertMaterial({
      color: 0x9966ff,
    }); // Purple panels

    const leftPanel = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
    leftPanel.position.set(-0.5, 0.8, 0.2);
    leftPanel.castShadow = true;
    bikeGroup.add(leftPanel);

    const rightPanel = new THREE.Mesh(sidePanelGeometry, sidePanelMaterial);
    rightPanel.position.set(0.5, 0.8, 0.2);
    rightPanel.castShadow = true;
    bikeGroup.add(rightPanel);

    // Simple headlight
    const headlightGeometry = new THREE.SphereGeometry(0.15);
    const headlightMaterial = new THREE.MeshLambertMaterial({
      color: 0xffffdd,
      emissive: 0x332211,
    });
    const headlight = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlight.position.set(0, 0.9, 1.4);
    headlight.castShadow = true;
    bikeGroup.add(headlight);

    // Add invisibility indicator
    const indicatorGeometry = new THREE.SphereGeometry(0.3);
    const indicatorMaterial = new THREE.MeshLambertMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });
    const invisibilityIndicator = new THREE.Mesh(
      indicatorGeometry,
      indicatorMaterial
    );
    invisibilityIndicator.position.set(0, 1.8, 0);
    invisibilityIndicator.visible = false;
    bikeGroup.add(invisibilityIndicator);
  };

  // Chopper Bike Creation Function (Heavy Duty Design)
  const createChopperBike = (bikeGroup: THREE.Group) => {
    // Heavy main frame - deep blue metallic
    const frameGeometry = new THREE.BoxGeometry(0.15, 0.12, 3.0);
    const frameMaterial = new THREE.MeshLambertMaterial({ color: 0x1e3a8a }); // Deep blue frame
    const mainFrame = new THREE.Mesh(frameGeometry, frameMaterial);
    mainFrame.position.set(0, 0.9, 0);
    mainFrame.castShadow = true;
    bikeGroup.add(mainFrame);

    // Chrome details on frame
    const chromeGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.6);
    const chromeMaterial = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 }); // Chrome silver
    const chromeDetail = new THREE.Mesh(chromeGeometry, chromeMaterial);
    chromeDetail.position.set(0, 0.9, 0.5);
    chromeDetail.castShadow = true;
    bikeGroup.add(chromeDetail);

    // Large V-twin engine
    const engineGeometry = new THREE.BoxGeometry(0.8, 0.7, 0.6);
    const engineMaterial = new THREE.MeshLambertMaterial({ color: 0x7c3aed }); // Purple engine
    const engine = new THREE.Mesh(engineGeometry, engineMaterial);
    engine.position.set(0, 0.6, 0);
    engine.castShadow = true;
    bikeGroup.add(engine);

    // Chrome engine covers
    const engineCoverGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.3);
    const leftEngineCover = new THREE.Mesh(engineCoverGeometry, chromeMaterial);
    leftEngineCover.position.set(-0.3, 0.6, 0);
    leftEngineCover.castShadow = true;
    bikeGroup.add(leftEngineCover);

    const rightEngineCover = new THREE.Mesh(engineCoverGeometry, chromeMaterial);
    rightEngineCover.position.set(0.3, 0.6, 0);
    rightEngineCover.castShadow = true;
    bikeGroup.add(rightEngineCover);

    // Large teardrop gas tank
    const tankGeometry = new THREE.SphereGeometry(0.5, 16, 8);
    const tankMaterial = new THREE.MeshLambertMaterial({ color: 0xfbbf24 }); // Golden yellow tank
    const tank = new THREE.Mesh(tankGeometry, tankMaterial);
    tank.scale.set(1.2, 0.8, 1.6);
    tank.position.set(0, 1.1, 0.3);
    tank.castShadow = true;
    bikeGroup.add(tank);

    // Wide low seat
    const seatGeometry = new THREE.BoxGeometry(0.6, 0.15, 1.0);
    const seatMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 }); // Brown leather seat
    const seat = new THREE.Mesh(seatGeometry, seatMaterial);
    seat.position.set(0, 1.0, -0.5);
    seat.castShadow = true;
    bikeGroup.add(seat);

    // Large wheels with chrome rims
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2);
    const wheelMaterial = new THREE.MeshLambertMaterial({ color: 0x374151 }); // Dark gray tire
    const rimGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.22);
    const rimMaterial = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 }); // Chrome rim

    // Front wheel
    const frontWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    frontWheel.rotation.z = Math.PI / 2;
    frontWheel.position.set(0, 0.4, 1.3);
    frontWheel.castShadow = true;
    bikeGroup.add(frontWheel);

    const frontRim = new THREE.Mesh(rimGeometry, rimMaterial);
    frontRim.rotation.z = Math.PI / 2;
    frontRim.position.set(0, 0.4, 1.3);
    frontRim.castShadow = true;
    bikeGroup.add(frontRim);

    // Rear wheel
    const rearWheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
    rearWheel.rotation.z = Math.PI / 2;
    rearWheel.position.set(0, 0.4, -0.9);
    rearWheel.castShadow = true;
    bikeGroup.add(rearWheel);

    const rearRim = new THREE.Mesh(rimGeometry, rimMaterial);
    rearRim.rotation.z = Math.PI / 2;
    rearRim.position.set(0, 0.4, -0.9);
    rearRim.castShadow = true;
    bikeGroup.add(rearRim);

    // Wide high handlebars (ape hangers)
    const handlebarGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.2);
    const handlebarMaterial = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 }); // Chrome handlebars
    const handlebars = new THREE.Mesh(handlebarGeometry, handlebarMaterial);
    handlebars.rotation.z = Math.PI / 2;
    handlebars.position.set(0, 1.5, 1.1);
    handlebars.castShadow = true;
    bikeGroup.add(handlebars);

    // Handlebar grips
    const gripGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.2);
    const gripMaterial = new THREE.MeshLambertMaterial({ color: 0xef4444 }); // Red grips
    const leftGrip = new THREE.Mesh(gripGeometry, gripMaterial);
    leftGrip.rotation.z = Math.PI / 2;
    leftGrip.position.set(-0.5, 1.5, 1.1);
    leftGrip.castShadow = true;
    bikeGroup.add(leftGrip);

    const rightGrip = new THREE.Mesh(gripGeometry, gripMaterial);
    rightGrip.rotation.z = Math.PI / 2;
    rightGrip.position.set(0.5, 1.5, 1.1);
    rightGrip.castShadow = true;
    bikeGroup.add(rightGrip);

    // Dual chrome exhaust pipes
    const exhaustGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.8);
    const exhaustMaterial = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 }); // Chrome exhaust
    const leftExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    leftExhaust.rotation.z = Math.PI / 2;
    leftExhaust.position.set(-0.25, 0.4, -0.3);
    leftExhaust.castShadow = true;
    bikeGroup.add(leftExhaust);

    const rightExhaust = new THREE.Mesh(exhaustGeometry, exhaustMaterial);
    rightExhaust.rotation.z = Math.PI / 2;
    rightExhaust.position.set(0.25, 0.4, -0.3);
    rightExhaust.castShadow = true;
    bikeGroup.add(rightExhaust);

    // Sissy bar (backrest)
    const sissyBarGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8);
    const sissyBar = new THREE.Mesh(sissyBarGeometry, chromeMaterial);
    sissyBar.position.set(0, 1.4, -0.8);
    sissyBar.castShadow = true;
    bikeGroup.add(sissyBar);

    // Forward foot pegs
    const pegGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3);
    const pegMaterial = new THREE.MeshLambertMaterial({ color: 0xc0c0c0 }); // Chrome pegs
    const leftPeg = new THREE.Mesh(pegGeometry, pegMaterial);
    leftPeg.rotation.z = Math.PI / 2;
    leftPeg.position.set(-0.4, 0.3, 0.8);
    leftPeg.castShadow = true;
    bikeGroup.add(leftPeg);

    const rightPeg = new THREE.Mesh(pegGeometry, pegMaterial);
    rightPeg.rotation.z = Math.PI / 2;
    rightPeg.position.set(0.4, 0.3, 0.8);
    rightPeg.castShadow = true;
    bikeGroup.add(rightPeg);

    // Add invisibility indicator
    const indicatorGeometry = new THREE.SphereGeometry(0.3);
    const indicatorMaterial = new THREE.MeshLambertMaterial({
      color: 0xffff00,
      transparent: true,
      opacity: 0.8,
    });
    const invisibilityIndicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
    invisibilityIndicator.position.set(0, 1.8, 0);
    invisibilityIndicator.visible = false;
    bikeGroup.add(invisibilityIndicator);
  };

  // Start the game when component mounts
  useEffect(() => {
    if (!gameRunning && !gameOver) {
      const timer = setTimeout(() => {
        init();
      }, 500);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [gameRunning, gameOver, init]);

  // Setup controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyA":
        case "ArrowLeft":
          keysRef.current.left = true;
          break;
        case "KeyD":
        case "ArrowRight":
          keysRef.current.right = true;
          break;
        case "ArrowUp":
          keysRef.current.up = true;
          break;
        case "ArrowDown":
          keysRef.current.down = true;
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case "KeyA":
        case "ArrowLeft":
          keysRef.current.left = false;
          break;
        case "KeyD":
        case "ArrowRight":
          keysRef.current.right = false;
          break;
        case "ArrowUp":
          keysRef.current.up = false;
          break;
        case "ArrowDown":
          keysRef.current.down = false;
          break;
      }
    };

    const handleMouseMove = (event: MouseEvent) => {
      if (!gameRunningRef.current || !rendererRef.current) return;

      const rect = rendererRef.current.domElement.getBoundingClientRect();
      const mouseXNormalized =
        ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseYNormalized =
        ((event.clientY - rect.top) / rect.height) * 2 - 1;

      gameStateRef.current.targetCarPosition = Math.max(
        -1,
        Math.min(1, mouseXNormalized)
      );

      gameStateRef.current.speedMultiplier = Math.max(
        0.2,
        Math.min(2.0, 1.0 - mouseYNormalized * 0.5)
      );
    };

    const handleResize = () => {
      if (cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = window.innerWidth / window.innerHeight;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyUp);
    document.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyUp);
      document.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (rendererRef.current && mountRef.current) {
        try {
          if (mountRef.current.contains(rendererRef.current.domElement)) {
            mountRef.current.removeChild(rendererRef.current.domElement);
          }
          rendererRef.current.dispose();
        } catch (error) {
        }
      }
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes tokenEarn {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(30px) scale(0.8);
          }
          20% {
            opacity: 1;
            transform: translateX(-50%) translateY(0px) scale(1.1);
          }
          80% {
            opacity: 1;
            transform: translateX(-50%) translateY(-20px) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateX(-50%) translateY(-50px) scale(0.9);
          }
        }
        
        @keyframes tokenPulse {
          0%, 100% {
            box-shadow: 0 8px 32px rgba(255,215,0,0.2);
            transform: scale(1);
          }
          50% {
            box-shadow: 0 12px 40px rgba(255,215,0,0.4);
            transform: scale(1.02);
          }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          zIndex: 1,
        }}
      >
      <div
        ref={mountRef}
        style={{
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
        }}
      />

      {/* Back Button */}
      {onBackToMenu && (
        <button
          onClick={onBackToMenu}
          style={{
            position: "absolute",
            top: "80px",
            right: "20px",
            zIndex: 150,
            padding: "12px 20px",
            fontSize: "16px",
            fontWeight: "bold",
            background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)",
            color: "white",
            border: "2px solid rgba(255, 255, 255, 0.2)",
            borderRadius: "12px",
            cursor: "pointer",
            textShadow: "0 1px 3px rgba(0,0,0,0.3)",
            boxShadow: "0 4px 15px rgba(239, 68, 68, 0.3), 0 2px 8px rgba(0,0,0,0.2)",
            transition: "all 0.2s ease",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backdropFilter: "blur(10px)"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px) scale(1.05)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(239, 68, 68, 0.4), 0 3px 12px rgba(0,0,0,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0) scale(1)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(239, 68, 68, 0.3), 0 2px 8px rgba(0,0,0,0.2)";
          }}
        >
          <span style={{ fontSize: "18px" }}>←</span> BACK TO MENU
        </button>
      )}

      {/* Enhanced Game Stats Panel */}
      <div
        style={{
          position: "absolute",
          top: "20px",
          left: "20px",
          padding: "20px",
          background: "linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(30,30,50,0.9) 100%)",
          borderRadius: "16px",
          border: "2px solid rgba(255,255,255,0.1)",
          backdropFilter: "blur(15px)",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 20px rgba(102, 126, 234, 0.1)",
          color: "white",
          minWidth: "220px",
          textShadow: "0 1px 3px rgba(0,0,0,0.5)",
        }}
      >
        {/* Title */}
        <div style={{ 
          fontSize: "18px", 
          fontWeight: "bold", 
          marginBottom: "16px",
          textAlign: "center",
          background: "linear-gradient(45deg, #ffd700, #ffed4a)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text"
        }}>
          🏍️ RACE STATS
        </div>

        {/* Main Stats */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            marginBottom: "8px",
            fontSize: "20px",
            fontWeight: "bold"
          }}>
            <span style={{ color: "#ffd700" }}>🏆</span>
            <span style={{ color: "#ffd700" }}>{score.toLocaleString()}</span>
          </div>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            marginBottom: "8px",
            fontSize: "18px",
            fontWeight: "600"
          }}>
            <span style={{ color: "#00ff88" }}>⚡</span>
            <span>{speed.toFixed(1)}x Speed</span>
          </div>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            marginBottom: "8px",
            fontSize: "16px"
          }}>
            <span style={{ color: "#ff6b35" }}>📏</span>
            <span>{gameStatsDisplay.distance}m Distance</span>
          </div>
        </div>

        {/* Secondary Stats */}
        <div style={{ 
          borderTop: "1px solid rgba(255,255,255,0.1)",
          paddingTop: "12px",
          marginBottom: "12px"
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            marginBottom: "6px",
            fontSize: "14px",
            opacity: 0.9
          }}>
            <span style={{ color: "#ff4444" }}>🚗</span>
            <span>{gameStatsDisplay.vehiclesDodged} Dodged</span>
          </div>
          
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "8px", 
            fontSize: "14px",
            opacity: 0.9
          }}>
            <span style={{ color: "#ffaa00" }}>🎁</span>
            <span>{gameStatsDisplay.bonusBoxesCollected} Collected</span>
          </div>
        </div>
        {playerProfile && (
          <div style={{ 
            borderTop: "1px solid rgba(255,255,255,0.1)",
            paddingTop: "12px"
          }}>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              marginBottom: "8px",
              fontSize: "15px",
              fontWeight: "600"
            }}>
              <span style={{ color: "#a855f7" }}>⭐</span>
              <span>Level {playerProfile.level}</span>
              <span style={{ 
                fontSize: "12px", 
                opacity: 0.7,
                background: "rgba(168, 85, 247, 0.2)",
                padding: "2px 6px",
                borderRadius: "6px"
              }}>
                {playerProfile.totalXp} XP
              </span>
            </div>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              marginBottom: "4px",
              fontSize: "12px", 
              opacity: 0.8
            }}>
              <span style={{ color: "#10b981" }}>🎯</span>
              <span>Best: {playerProfile.highScore.toLocaleString()}</span>
            </div>
            <div style={{ 
              display: "flex", 
              alignItems: "center", 
              gap: "8px", 
              fontSize: "12px", 
              opacity: 0.8
            }}>
              <span style={{ color: "#3b82f6" }}>🎮</span>
              <span>{playerProfile.gamesPlayed} Games</span>
            </div>
          </div>
        )}

        {invisibilityActive && (
          <div
            style={{ 
              marginTop: "12px",
              padding: "8px 12px",
              background: "linear-gradient(45deg, #ffd700, #ffaa00)",
              borderRadius: "8px",
              color: "#1a1a1a",
              fontSize: "14px",
              fontWeight: "bold",
              textAlign: "center",
              boxShadow: "0 0 20px rgba(255, 215, 0, 0.5)",
              animation: "pulse 1s ease-in-out infinite alternate"
            }}
          >
            ⚡ INVISIBLE: {invisibilityCountdown}s ⚡
          </div>
        )}
      </div>

      {/* Controls */}
      <div
        style={{
          position: "absolute",
          bottom: "20px",
          left: "20px",
          zIndex: 100,
          color: "white",
          fontSize: "16px",
          textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
        }}
      >
        Use A/D or Arrow Keys to move • Up/Down arrows or mouse Y-axis to
        control speed
        <br />
        🚗 Dodge oncoming vehicles = +10 points • 🍯 Bonus boxes = +30 points •
        🗝️ Golden keys = Invisibility power-up
      </div>

      {/* Wallet Processing Overlay */}
      {walletProcessing && (
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            zIndex: 300,
            background: "linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,40,0.98) 100%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backdropFilter: "blur(10px)"
          }}
        >
          <div style={{
            background: "linear-gradient(135deg, rgba(255,215,0,0.1), rgba(255,165,0,0.05))",
            border: "2px solid rgba(255,215,0,0.3)",
            borderRadius: "24px",
            padding: "40px",
            textAlign: "center",
            maxWidth: "400px",
            width: "90%",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              border: "4px solid rgba(255,215,0,0.3)",
              borderTop: "4px solid #ffd700",
              borderRadius: "50%",
              margin: "0 auto 24px",
              animation: "spin 1s linear infinite"
            }} />
            
            <div style={{
              color: "#ffd700",
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "16px"
            }}>
              💰 Processing Rewards
            </div>
            
            <div style={{
              color: "#ffffff",
              fontSize: "18px",
              marginBottom: "8px",
              opacity: 0.9
            }}>
              {walletLoadingMessage}
            </div>
            
            <div style={{
              color: "#ffffff",
              fontSize: "14px",
              opacity: 0.7,
              lineHeight: "1.5"
            }}>
              Please wait while we process your token claim...
            </div>
          </div>
        </div>
      )}

      {/* Game Over Screen - Responsive Stats Panel */}
      {gameOver && !walletProcessing && (
        <div
          style={{
            position: "absolute",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            zIndex: 200,
            background: "linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,40,0.98) 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px",
            overflowY: "auto",
          }}
        >
          <div
            style={{
              background: "linear-gradient(145deg, rgba(15,15,35,0.95), rgba(25,25,55,0.95))",
              borderRadius: "16px",
              padding: "20px",
              maxWidth: "90vw",
              maxHeight: "90vh",
              width: "100%",
              border: "2px solid rgba(255,215,0,0.3)",
              boxShadow: "0 10px 30px rgba(255,215,0,0.1)",
              backdropFilter: "blur(20px)",
              overflowY: "auto",
            }}
          >
            {/* Header - Compact */}
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <div style={{ 
                fontSize: "48px", 
                marginBottom: "4px",
                filter: "drop-shadow(0 0 15px rgba(255,215,0,0.5))"
              }}>🏁</div>
              <h2 style={{ 
                color: "#ffd700", 
                fontSize: "24px", 
                fontWeight: "bold",
                margin: "0 0 4px 0",
                textShadow: "0 0 15px rgba(255,215,0,0.5)"
              }}>
                Race Complete!
              </h2>
              <p style={{ 
                color: "#a0a0ff", 
                fontSize: "14px", 
                margin: "0",
                opacity: 0.8
              }}>
                Your adventure rewards await
              </p>
            </div>

            {/* Stats Grid */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              marginBottom: "16px"
            }}>
              {/* Score Card */}
              <div style={{
                background: "linear-gradient(135deg, rgba(255,100,50,0.1), rgba(255,150,0,0.1))",
                border: "1px solid rgba(255,100,50,0.2)",
                borderRadius: "12px",
                padding: "12px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "18px", marginBottom: "2px" }}>🎯</div>
                <div style={{ color: "#ff6432", fontSize: "18px", fontWeight: "bold" }}>
                  {score.toLocaleString()}
                </div>
                <div style={{ color: "#ffffff", fontSize: "12px", opacity: 0.8 }}>Score</div>
              </div>

              {/* Distance Card */}
              <div style={{
                background: "linear-gradient(135deg, rgba(0,150,255,0.1), rgba(100,200,255,0.1))",
                border: "1px solid rgba(0,150,255,0.2)",
                borderRadius: "16px",
                padding: "16px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>🛣️</div>
                <div style={{ color: "#00aaff", fontSize: "24px", fontWeight: "bold" }}>
                  {gameStatsDisplay.distance}m
                </div>
                <div style={{ color: "#ffffff", fontSize: "14px", opacity: 0.8 }}>Distance</div>
              </div>

              {/* Vehicles Dodged Card */}
              <div style={{
                background: "linear-gradient(135deg, rgba(255,0,150,0.1), rgba(255,100,200,0.1))",
                border: "1px solid rgba(255,0,150,0.2)",
                borderRadius: "16px",
                padding: "16px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>🚗</div>
                <div style={{ color: "#ff0096", fontSize: "24px", fontWeight: "bold" }}>
                  {gameStatsDisplay.vehiclesDodged}
                </div>
                <div style={{ color: "#ffffff", fontSize: "14px", opacity: 0.8 }}>Dodged</div>
              </div>

              {/* Bonuses Card */}
              <div style={{
                background: "linear-gradient(135deg, rgba(150,255,0,0.1), rgba(200,255,100,0.1))",
                border: "1px solid rgba(150,255,0,0.2)",
                borderRadius: "16px",
                padding: "16px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>📦</div>
                <div style={{ color: "#96ff00", fontSize: "24px", fontWeight: "bold" }}>
                  {gameStatsDisplay.bonusBoxesCollected}
                </div>
                <div style={{ color: "#ffffff", fontSize: "14px", opacity: 0.8 }}>Bonuses</div>
              </div>

              {/* Time Card */}
              <div style={{
                background: "linear-gradient(135deg, rgba(200,100,255,0.1), rgba(255,150,255,0.1))",
                border: "1px solid rgba(200,100,255,0.2)",
                borderRadius: "16px",
                padding: "16px",
                textAlign: "center"
              }}>
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>⏱️</div>
                <div style={{ color: "#c864ff", fontSize: "24px", fontWeight: "bold" }}>
                  {gameStatsRef.current.lapTime > 0 ? `${gameStatsRef.current.lapTime.toFixed(1)}s` : "N/A"}
                </div>
                <div style={{ color: "#ffffff", fontSize: "14px", opacity: 0.8 }}>Time</div>
              </div>

              {/* Tokens Earned Card - HIGHLIGHT */}
              <div style={{
                background: "linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,165,0,0.15))",
                border: "2px solid rgba(255,215,0,0.4)",
                borderRadius: "16px",
                padding: "16px",
                textAlign: "center",
                boxShadow: "0 8px 32px rgba(255,215,0,0.2)",
                animation: tokensEarnedThisGame > 0 ? "tokenPulse 2s ease-in-out infinite" : "none"
              }}>
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>🎁</div>
                <div style={{ 
                  color: "#ffd700", 
                  fontSize: "28px", 
                  fontWeight: "bold",
                  textShadow: "0 0 10px rgba(255,215,0,0.5)"
                }}>
                  +{tokensEarnedThisGame}
                </div>
                <div style={{ color: "#ffd700", fontSize: "14px", opacity: 0.9, fontWeight: "bold" }}>
                  RACE Tokens
                </div>
              </div>
            </div>

            {/* Token Balance & Player Stats */}
            <div style={{
              background: "linear-gradient(135deg, rgba(255,215,0,0.08), rgba(255,165,0,0.05))",
              border: "1px solid rgba(255,215,0,0.2)",
              borderRadius: "16px",
              padding: "20px",
              marginBottom: "24px"
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "16px"
              }}>
                <div>
                  <div style={{ color: "#ffd700", fontSize: "18px", fontWeight: "bold" }}>
                    💰 Wallet Balance: {walletRaceTokenBalance.toFixed(2)} RACE
                  </div>
                  <div style={{ color: "#ffffff", fontSize: "14px", opacity: 0.7 }}>
                    🎉 Tokens automatically claimed to your wallet!
                  </div>
                </div>
                {playerProfile && (
                  <div style={{ textAlign: "right" }}>
                    <div style={{ color: "#a0a0ff", fontSize: "16px", fontWeight: "bold" }}>
                      Level {playerProfile.level} • {playerProfile.totalXp} XP
                    </div>
                    <div style={{ color: "#ffffff", fontSize: "14px", opacity: 0.7 }}>
                      High Score: {playerProfile.highScore.toLocaleString()} • Games: {playerProfile.gamesPlayed}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ 
              display: "flex", 
              gap: "16px", 
              justifyContent: "center",
              flexWrap: "wrap"
            }}>
              {/* Rewards Auto-Claimed Message */}
              <div style={{
                background: "linear-gradient(45deg, #28a745, #20c997)",
                border: "2px solid rgba(40,167,69,0.5)",
                color: "white",
                padding: "16px 32px",
                fontSize: "16px",
                fontWeight: "bold",
                borderRadius: "12px",
                boxShadow: "0 6px 20px rgba(40,167,69,0.3)",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}>
                ✅ Rewards Automatically Claimed to Your Wallet!
              </div>

              {/* Race Again Button */}
              <button
                onClick={restartGame}
                style={{
                  background: "linear-gradient(45deg, #00aaff, #0088cc)",
                  border: "2px solid rgba(0,170,255,0.3)",
                  color: "white",
                  padding: "16px 32px",
                  fontSize: "16px",
                  fontWeight: "bold",
                  borderRadius: "12px",
                  cursor: "pointer",
                  boxShadow: "0 6px 20px rgba(0,170,255,0.3)",
                  transition: "all 0.2s ease",
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                }}
              >
                🏁 Race Again
              </button>
              
              {/* Back to Menu Button */}
              {onBackToMenu && (
                <button
                  onClick={onBackToMenu}
                  style={{
                    background: "linear-gradient(45deg, #6c757d, #5a6268)",
                    border: "2px solid rgba(108,117,125,0.3)",
                    color: "white",
                    padding: "16px 32px",
                    fontSize: "16px",
                    fontWeight: "bold",
                    borderRadius: "12px",
                    cursor: "pointer",
                    boxShadow: "0 6px 20px rgba(108,117,125,0.3)",
                    transition: "all 0.2s ease",
                    textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                  }}
                >
                  🏠 Main Menu
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Token Earned Animation */}
      {showTokenAnimation && (
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 300,
            animation: "tokenEarn 3s ease-out forwards",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, rgba(255,215,0,0.95), rgba(255,165,0,0.9))",
              border: "2px solid rgba(255,215,0,0.8)",
              borderRadius: "20px",
              padding: "20px 30px",
              color: "#000",
              fontSize: "24px",
              fontWeight: "bold",
              textAlign: "center",
              boxShadow: "0 10px 30px rgba(255,215,0,0.4)",
              backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "8px" }}>🎁</div>
            <div>+{tokensEarnedThisGame} RACE</div>
            <div style={{ fontSize: "14px", opacity: 0.8, marginTop: "4px" }}>Tokens Earned!</div>
          </div>
        </div>
      )}

      {/* Mission Complete Popup */}
      {showMissionComplete && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 150,
            background: "rgba(0,0,0,0.9)",
            color: "#ffd700",
            padding: "20px 30px",
            borderRadius: "10px",
            fontSize: "24px",
            fontWeight: "bold",
            textAlign: "center",
            border: "2px solid #ffd700",
          }}
        >
          {showMissionComplete}
        </div>
      )}
      </div>
    </>
  );
};

export default BikeRunner;