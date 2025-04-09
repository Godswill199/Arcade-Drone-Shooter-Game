import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface GameCanvasProps {
  score?: number;
  health?: number;
  stage?: number;
  isPaused?: boolean;
  onEnemyDestroyed?: (points: number) => void;
  onEnemyReachedBottom?: () => void;
  onPowerUpCollected?: (type: string) => void;
  onTimeExpired?: () => void;
  gameStatus?: "menu" | "playing" | "paused" | "gameOver";
  onSpecialFire?: () => void;
  onShieldActivate?: () => void;
}

interface Enemy {
  id: string;
  x: number;
  y: number;
  type: "basic" | "armored" | "fast" | "boss";
  health: number;
  speed: number;
  width: number;
  height: number;
}

interface Projectile {
  id: string;
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
  isSpecial?: boolean;
  damage?: number;
}

interface PowerUp {
  id: string;
  x: number;
  y: number;
  type: "rapidFire" | "shield" | "multiShot" | "bomb";
  speed: number;
  width: number;
  height: number;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  cooldown: number;
  currentCooldown: number;
  shieldActive?: boolean;
  shieldDuration?: number;
  powerUps: {
    rapidFire?: { active: boolean; duration: number; remaining: number };
    shield?: { active: boolean; duration: number; remaining: number };
    multiShot?: { active: boolean; duration: number; remaining: number };
    bomb?: { active: boolean; count: number };
  };
}

const GameCanvas: React.FC<GameCanvasProps> = ({
  score = 0,
  health = 3,
  stage = 1,
  isPaused = false,
  onEnemyDestroyed = () => {},
  onEnemyReachedBottom = () => {},
  onPowerUpCollected = () => {},
  onTimeExpired = () => {},
  gameStatus = "playing",
  onSpecialFire,
  onShieldActivate,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [powerUps, setPowerUps] = useState<PowerUp[]>([]);
  const [player, setPlayer] = useState<Player>({
    x: 0,
    y: 0,
    width: 60,
    height: 60,
    cooldown: 500, // milliseconds
    currentCooldown: 0,
    powerUps: {},
  });
  const [gameActive, setGameActive] = useState(true);
  const [lastFrameTime, setLastFrameTime] = useState(0);
  const [enemySpawnTimer, setEnemySpawnTimer] = useState(0);
  const [powerUpSpawnTimer, setPowerUpSpawnTimer] = useState(0);
  const [stageTimer, setStageTimer] = useState(180); // 3 minutes in seconds

  // Initialize the game
  useEffect(() => {
    if (canvasRef.current) {
      const updateCanvasSize = () => {
        if (canvasRef.current) {
          const { width, height } = canvasRef.current.getBoundingClientRect();
          setCanvasSize({ width, height });

          // Initialize player position at bottom center
          setPlayer((prev) => ({
            ...prev,
            x: width / 2 - prev.width / 2,
            y: height - prev.height - 10,
          }));
        }
      };

      updateCanvasSize();
      window.addEventListener("resize", updateCanvasSize);

      return () => {
        window.removeEventListener("resize", updateCanvasSize);
      };
    }
  }, []);

  // Game loop
  useEffect(() => {
    if (isPaused || !gameActive || gameStatus !== "playing") return;

    let animationFrameId: number;

    const gameLoop = (timestamp: number) => {
      if (!lastFrameTime) {
        setLastFrameTime(timestamp);
        animationFrameId = requestAnimationFrame(gameLoop);
        return;
      }

      const deltaTime = timestamp - lastFrameTime;

      // Update game state
      updateGameState(deltaTime);

      setLastFrameTime(timestamp);
      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [
    isPaused,
    gameActive,
    lastFrameTime,
    enemies,
    projectiles,
    powerUps,
    player,
    canvasSize,
  ]);

  // Update game state based on delta time
  const updateGameState = (deltaTime: number) => {
    // Update stage timer
    if (stageTimer > 0) {
      const newTime = stageTimer - deltaTime / 1000; // Convert ms to seconds
      setStageTimer(newTime);

      // Check if time expired
      if (newTime <= 0) {
        onTimeExpired();
        return;
      }
    }
    // Spawn enemies
    const newEnemySpawnTimer = enemySpawnTimer + deltaTime;
    const spawnInterval = Math.max(2000 - stage * 100, 500); // Decrease spawn time as stage increases

    if (newEnemySpawnTimer >= spawnInterval) {
      spawnEnemy();
      setEnemySpawnTimer(0);
    } else {
      setEnemySpawnTimer(newEnemySpawnTimer);
    }

    // Spawn power-ups occasionally
    const newPowerUpSpawnTimer = powerUpSpawnTimer + deltaTime;
    if (newPowerUpSpawnTimer >= 15000) {
      // Every 15 seconds
      if (Math.random() < 0.3) {
        // 30% chance
        spawnPowerUp();
      }
      setPowerUpSpawnTimer(0);
    } else {
      setPowerUpSpawnTimer(newPowerUpSpawnTimer);
    }

    // Update player cooldown
    if (player.currentCooldown > 0) {
      setPlayer((prev) => ({
        ...prev,
        currentCooldown: Math.max(0, prev.currentCooldown - deltaTime),
      }));
    }

    // Update power-up durations
    updatePowerUps(deltaTime);

    // Move enemies
    moveEnemies(deltaTime);

    // Move projectiles
    moveProjectiles(deltaTime);

    // Move power-ups
    movePowerUps(deltaTime);

    // Check collisions
    checkCollisions();
  };

  // Spawn a new enemy
  const spawnEnemy = () => {
    if (!canvasSize.width) return;

    // Determine enemy type based on stage and randomness
    let type: Enemy["type"] = "basic";
    const rand = Math.random();

    if (stage >= 10 && rand < 0.1) {
      type = "boss";
    } else if (stage >= 5 && rand < 0.3) {
      type = "armored";
    } else if (stage >= 3 && rand < 0.4) {
      type = "fast";
    }

    // Set properties based on type
    let health = 1;
    let speed = 0.05;
    let width = 40;
    let height = 40;

    switch (type) {
      case "armored":
        health = 3;
        speed = 0.03;
        width = 50;
        height = 50;
        break;
      case "fast":
        health = 1;
        speed = 0.1;
        width = 30;
        height = 30;
        break;
      case "boss":
        health = 10;
        speed = 0.02;
        width = 80;
        height = 80;
        break;
    }

    const newEnemy: Enemy = {
      id: `enemy-${Date.now()}-${Math.random()}`,
      x: Math.random() * (canvasSize.width - width),
      y: -height,
      type,
      health,
      speed,
      width,
      height,
    };

    setEnemies((prev) => [...prev, newEnemy]);
  };

  // Spawn a power-up
  const spawnPowerUp = () => {
    if (!canvasSize.width) return;

    const types: PowerUp["type"][] = [
      "rapidFire",
      "shield",
      "multiShot",
      "bomb",
    ];
    const type = types[Math.floor(Math.random() * types.length)];

    const width = 30;
    const height = 30;

    const newPowerUp: PowerUp = {
      id: `powerup-${Date.now()}-${Math.random()}`,
      x: Math.random() * (canvasSize.width - width),
      y: -height,
      type,
      speed: 0.05,
      width,
      height,
    };

    setPowerUps((prev) => [...prev, newPowerUp]);
  };

  // Update power-up durations
  const updatePowerUps = (deltaTime: number) => {
    let powerUpUpdated = false;
    const updatedPowerUps = { ...player.powerUps };

    // Check each power-up type
    ["rapidFire", "shield", "multiShot"].forEach((type) => {
      const powerUpKey = type as keyof typeof player.powerUps;
      const powerUp = player.powerUps[powerUpKey];

      if (powerUp?.active && powerUp.remaining > 0) {
        const remaining = powerUp.remaining - deltaTime;

        if (remaining <= 0) {
          // Power-up expired
          updatedPowerUps[powerUpKey] = {
            ...powerUp,
            active: false,
            remaining: 0,
          };
        } else {
          // Update remaining time
          updatedPowerUps[powerUpKey] = {
            ...powerUp,
            remaining,
          };
        }

        powerUpUpdated = true;
      }
    });

    if (powerUpUpdated) {
      setPlayer((prev) => ({
        ...prev,
        powerUps: updatedPowerUps,
      }));
    }
  };

  // Move enemies based on their speed
  const moveEnemies = (deltaTime: number) => {
    setEnemies((prev) => {
      const updatedEnemies = prev
        .map((enemy) => {
          // Move enemy down
          const newY = enemy.y + enemy.speed * deltaTime;

          // Check if enemy reached bottom
          if (newY > canvasSize.height) {
            onEnemyReachedBottom();
            return null; // Remove this enemy
          }

          return {
            ...enemy,
            y: newY,
          };
        })
        .filter(Boolean) as Enemy[];

      return updatedEnemies;
    });
  };

  // Move projectiles based on their speed
  const moveProjectiles = (deltaTime: number) => {
    setProjectiles((prev) => {
      const updatedProjectiles = prev
        .map((projectile) => {
          // Move projectile up
          const newY = projectile.y - projectile.speed * deltaTime;

          // Remove if off screen
          if (newY < -projectile.height) {
            return null;
          }

          return {
            ...projectile,
            y: newY,
          };
        })
        .filter(Boolean) as Projectile[];

      return updatedProjectiles;
    });
  };

  // Move power-ups based on their speed
  const movePowerUps = (deltaTime: number) => {
    setPowerUps((prev) => {
      const updatedPowerUps = prev
        .map((powerUp) => {
          // Move power-up down
          const newY = powerUp.y + powerUp.speed * deltaTime;

          // Remove if off screen
          if (newY > canvasSize.height) {
            return null;
          }

          return {
            ...powerUp,
            y: newY,
          };
        })
        .filter(Boolean) as PowerUp[];

      return updatedPowerUps;
    });
  };

  // Check for collisions between game objects
  const checkCollisions = () => {
    // Check projectile-enemy collisions
    const updatedEnemies = [...enemies];
    const updatedProjectiles = [...projectiles];
    let enemiesDestroyed = false;

    // Check each projectile against each enemy
    projectiles.forEach((projectile, pIndex) => {
      enemies.forEach((enemy, eIndex) => {
        // Simple rectangle collision detection
        if (
          projectile.x < enemy.x + enemy.width &&
          projectile.x + projectile.width > enemy.x &&
          projectile.y < enemy.y + enemy.height &&
          projectile.y + projectile.height > enemy.y
        ) {
          // Hit detected
          const damage = projectile.damage || 1;
          updatedEnemies[eIndex] = {
            ...enemy,
            health: enemy.health - damage,
          };

          // Remove the projectile
          updatedProjectiles[pIndex] = null as any;

          // Check if enemy destroyed
          if (updatedEnemies[eIndex].health <= 0) {
            // Calculate points based on enemy type
            let points = 10;
            switch (enemy.type) {
              case "armored":
                points = 30;
                break;
              case "fast":
                points = 20;
                break;
              case "boss":
                points = 100;
                break;
            }

            onEnemyDestroyed(points);
            updatedEnemies[eIndex] = null as any;
            enemiesDestroyed = true;
          }
        }
      });
    });

    // Check player-powerup collisions
    const updatedPowerUps = [...powerUps];
    let powerUpCollected = false;

    powerUps.forEach((powerUp, index) => {
      // Simple rectangle collision detection with player
      if (
        player.x < powerUp.x + powerUp.width &&
        player.x + player.width > powerUp.x &&
        player.y < powerUp.y + powerUp.height &&
        player.y + player.height > powerUp.y
      ) {
        // Power-up collected
        applyPowerUp(powerUp.type);
        onPowerUpCollected(powerUp.type);
        updatedPowerUps[index] = null as any;
        powerUpCollected = true;
      }
    });

    // Check enemy-player collisions (only if shield is not active)
    if (!player.shieldActive) {
      enemies.forEach((enemy, index) => {
        // Simple rectangle collision detection with player
        if (
          player.x < enemy.x + enemy.width &&
          player.x + player.width > enemy.x &&
          player.y < enemy.y + enemy.height &&
          player.y + player.height > enemy.y
        ) {
          // Player hit by enemy
          onEnemyReachedBottom(); // Reduce player health
          updatedEnemies[index] = null as any;
          enemiesDestroyed = true;
        }
      });
    }

    // Update state if changes occurred
    if (enemiesDestroyed) {
      setEnemies(updatedEnemies.filter(Boolean) as Enemy[]);
    }

    if (updatedProjectiles.some((p) => p === null)) {
      setProjectiles(updatedProjectiles.filter(Boolean) as Projectile[]);
    }

    if (powerUpCollected) {
      setPowerUps(updatedPowerUps.filter(Boolean) as PowerUp[]);
    }
  };

  // Apply power-up effect to player
  const applyPowerUp = (type: PowerUp["type"]) => {
    const updatedPowerUps = { ...player.powerUps };

    switch (type) {
      case "rapidFire":
        updatedPowerUps.rapidFire = {
          active: true,
          duration: 10000, // 10 seconds
          remaining: 10000,
        };
        break;
      case "shield":
        updatedPowerUps.shield = {
          active: true,
          duration: 15000, // 15 seconds
          remaining: 15000,
        };
        break;
      case "multiShot":
        updatedPowerUps.multiShot = {
          active: true,
          duration: 8000, // 8 seconds
          remaining: 8000,
        };
        break;
      case "bomb":
        // Bomb immediately destroys all enemies on screen
        setEnemies([]);
        onEnemyDestroyed(enemies.length * 10); // Award points for all enemies
        break;
    }

    setPlayer((prev) => ({
      ...prev,
      powerUps: updatedPowerUps,
    }));
  };

  // Fire a projectile from the player's position
  const fireProjectile = (isSpecialFire = false) => {
    if (player.currentCooldown > 0) return;

    const projectileWidth = isSpecialFire ? 20 : 10;
    const projectileHeight = isSpecialFire ? 30 : 20;

    // Create base projectile
    const baseProjectile: Projectile = {
      id: `projectile-${Date.now()}-${Math.random()}`,
      x: player.x + player.width / 2 - projectileWidth / 2,
      y: player.y - projectileHeight,
      speed: isSpecialFire ? 0.7 : 0.5,
      width: projectileWidth,
      height: projectileHeight,
      isSpecial: isSpecialFire,
      damage: isSpecialFire ? 3 : 1,
    };

    let newProjectiles: Projectile[] = [];

    // Special fire creates a larger, more powerful projectile
    if (isSpecialFire) {
      newProjectiles = [baseProjectile];
    }
    // Check if multiShot is active
    else if (player.powerUps.multiShot?.active) {
      // Create 3 projectiles (left, center, right)
      newProjectiles = [
        {
          ...baseProjectile,
          id: `${baseProjectile.id}-1`,
          x: baseProjectile.x - 20,
        },
        { ...baseProjectile, id: `${baseProjectile.id}-2` },
        {
          ...baseProjectile,
          id: `${baseProjectile.id}-3`,
          x: baseProjectile.x + 20,
        },
      ];
    } else {
      // Just a single projectile
      newProjectiles = [baseProjectile];
    }

    setProjectiles((prev) => [...prev, ...newProjectiles]);

    // Set cooldown based on rapidFire power-up or special fire
    const cooldownTime = isSpecialFire
      ? 1000
      : player.powerUps.rapidFire?.active
        ? 200
        : 500;

    setPlayer((prev) => ({
      ...prev,
      currentCooldown: cooldownTime,
    }));
  };

  // Handle player movement
  const movePlayer = (newX: number) => {
    if (!canvasSize.width) return;

    // Ensure player stays within canvas bounds
    const clampedX = Math.max(
      0,
      Math.min(canvasSize.width - player.width, newX),
    );

    setPlayer((prev) => ({
      ...prev,
      x: clampedX,
    }));
  };

  // Handle touch/mouse movement
  const handlePointerMove = (e: React.PointerEvent) => {
    if (isPaused || !gameActive) return;

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - player.width / 2;
      movePlayer(x);
    }
  };

  // Handle touch/mouse tap for shooting
  const handlePointerDown = () => {
    if (isPaused || !gameActive) return;
    fireProjectile();
  };

  // Handle special fire ability
  const handleSpecialFire = () => {
    if (isPaused || !gameActive) return;
    fireProjectile(true);
  };

  // Handle shield activation
  const activateShield = (duration = 3000) => {
    if (isPaused || !gameActive) return;
    setPlayer((prev) => ({
      ...prev,
      shieldActive: true,
      shieldDuration: duration,
    }));

    // Deactivate shield after duration
    setTimeout(() => {
      setPlayer((prev) => ({
        ...prev,
        shieldActive: false,
        shieldDuration: 0,
      }));
    }, duration);
  };

  return (
    <div
      ref={canvasRef}
      className="relative w-full h-full bg-black overflow-hidden touch-none"
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
    >
      {/* Player turret */}
      <motion.div
        className="absolute bg-blue-500 rounded-t-lg"
        style={{
          width: player.width,
          height: player.height,
          left: player.x,
          bottom: canvasSize.height - player.y - player.height,
          backgroundImage:
            "url('https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=60&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
        animate={{ x: player.x }}
        transition={{ type: "spring", damping: 20 }}
      >
        {/* Weapon barrel */}
        <div className="absolute top-[-10px] left-[50%] w-4 h-10 bg-gray-700 transform translate-x-[-50%] rounded-t-md"></div>

        {/* Cooldown indicator */}
        {player.currentCooldown > 0 && (
          <div
            className="absolute bottom-0 left-0 bg-red-500 opacity-50 h-1"
            style={{
              width: `${(player.currentCooldown / player.cooldown) * 100}%`,
            }}
          ></div>
        )}

        {/* Shield effect */}
        {(player.powerUps.shield?.active || player.shieldActive) && (
          <div className="absolute inset-[-10px] rounded-full border-4 border-cyan-400 opacity-70 animate-pulse"></div>
        )}
      </motion.div>

      {/* Projectiles */}
      {projectiles.map((projectile) => (
        <motion.div
          key={projectile.id}
          className={`absolute ${projectile.isSpecial ? "bg-purple-500" : "bg-yellow-400"} rounded-sm`}
          style={{
            width: projectile.width,
            height: projectile.height,
            left: projectile.x,
            top: projectile.y,
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
        />
      ))}

      {/* Enemies */}
      {enemies.map((enemy) => {
        let enemyColor = "bg-red-500";
        let enemyImage = "";

        switch (enemy.type) {
          case "basic":
            enemyColor = "bg-red-500";
            enemyImage =
              "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=60&q=80";
            break;
          case "armored":
            enemyColor = "bg-gray-700";
            enemyImage =
              "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=60&q=80";
            break;
          case "fast":
            enemyColor = "bg-green-500";
            enemyImage =
              "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=60&q=80";
            break;
          case "boss":
            enemyColor = "bg-purple-700";
            enemyImage =
              "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=60&q=80";
            break;
        }

        return (
          <motion.div
            key={enemy.id}
            className={`absolute ${enemyColor} rounded-md`}
            style={{
              width: enemy.width,
              height: enemy.height,
              left: enemy.x,
              top: enemy.y,
              backgroundImage: `url('${enemyImage}')`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* Health bar for enemies with more than 1 health */}
            {enemy.health > 1 && (
              <div className="absolute top-[-8px] left-0 w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{
                    width: `${(enemy.health / (enemy.type === "boss" ? 10 : enemy.type === "armored" ? 3 : 1)) * 100}%`,
                  }}
                ></div>
              </div>
            )}
          </motion.div>
        );
      })}

      {/* Power-ups */}
      {powerUps.map((powerUp) => {
        let powerUpColor = "bg-blue-400";
        let powerUpIcon = "⚡";

        switch (powerUp.type) {
          case "rapidFire":
            powerUpColor = "bg-yellow-400";
            powerUpIcon = "⚡";
            break;
          case "shield":
            powerUpColor = "bg-cyan-400";
            powerUpIcon = "🛡️";
            break;
          case "multiShot":
            powerUpColor = "bg-purple-400";
            powerUpIcon = "🔱";
            break;
          case "bomb":
            powerUpColor = "bg-red-400";
            powerUpIcon = "💣";
            break;
        }

        return (
          <motion.div
            key={powerUp.id}
            className={`absolute ${powerUpColor} rounded-full flex items-center justify-center text-white font-bold`}
            style={{
              width: powerUp.width,
              height: powerUp.height,
              left: powerUp.x,
              top: powerUp.y,
            }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.2 }}
          >
            {powerUpIcon}
          </motion.div>
        );
      })}

      {/* Active power-up indicators */}
      <div className="absolute top-2 right-2 flex flex-col gap-2">
        {player.powerUps.rapidFire?.active && (
          <div className="bg-yellow-400 rounded-full w-8 h-8 flex items-center justify-center text-xs animate-pulse">
            ⚡
          </div>
        )}
        {player.powerUps.multiShot?.active && (
          <div className="bg-purple-400 rounded-full w-8 h-8 flex items-center justify-center text-xs animate-pulse">
            🔱
          </div>
        )}
      </div>

      {/* Pause overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black bg-opacity-70 flex items-center justify-center">
          <div className="text-white text-4xl font-bold">PAUSED</div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
