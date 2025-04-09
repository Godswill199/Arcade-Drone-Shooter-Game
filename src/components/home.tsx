import React, { useState } from "react";
import { motion } from "framer-motion";
import GameCanvas from "./GameCanvas";
import GameControls from "./GameControls";
import GameHUD from "./GameHUD";

interface GameState {
  score: number;
  health: number;
  stage: number;
  combo: number;
  activePowerups: string[];
  gameStatus: "menu" | "playing" | "paused" | "gameOver";
  specialAbilityCharge?: number;
  specialAbilityCooldown?: number;
  shieldCooldown?: number;
  shieldActive?: boolean;
}

const Home: React.FC = () => {
  // Game state management
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    health: 3,
    stage: 1,
    combo: 0,
    activePowerups: [],
    gameStatus: "menu",
    specialAbilityCharge: 75,
    specialAbilityCooldown: 0,
    shieldCooldown: 0,
    shieldActive: false,
  });

  // Handle player movement
  const handleMove = (direction: "left" | "right") => {
    // This will be implemented to control the turret movement
    console.log(`Moving ${direction}`);
  };

  // Handle player shooting
  const handleShoot = () => {
    // This will be implemented to handle the shooting mechanics
    console.log("Shooting");
  };

  // Handle special ability (special fire)
  const handleSpecialAbility = () => {
    console.log("Special ability activated");
    // Reduce special ability charge when used
    setGameState((prev) => ({
      ...prev,
      specialAbilityCharge: Math.max(0, (prev.specialAbilityCharge || 75) - 25),
      specialAbilityCooldown: 5, // 5 second cooldown
    }));

    // Reset cooldown after 5 seconds
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        specialAbilityCooldown: 0,
      }));
    }, 5000);
  };

  // Handle shield activation
  const handleShieldActivate = () => {
    console.log("Shield activated");
    setGameState((prev) => ({
      ...prev,
      shieldActive: true,
      shieldCooldown: 10, // 10 second cooldown
    }));

    // Deactivate shield after 3 seconds
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        shieldActive: false,
      }));
    }, 3000);

    // Reset cooldown after 10 seconds
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        shieldCooldown: 0,
      }));
    }, 10000);
  };

  // Update game score
  const updateScore = (points: number) => {
    setGameState((prev) => ({
      ...prev,
      score: prev.score + points,
      combo: prev.combo + 1,
    }));
  };

  // Handle enemy reaching bottom
  const handleEnemyReachedBottom = () => {
    setGameState((prev) => {
      const newHealth = prev.health - 1;
      return {
        ...prev,
        health: newHealth,
        gameStatus: newHealth <= 0 ? "gameOver" : prev.gameStatus,
        combo: 0, // Reset combo when enemy reaches bottom
      };
    });
  };

  // Handle time expired
  const handleTimeExpired = () => {
    // When time expires, advance to next stage or end game
    advanceStage();
  };

  // Start a new game
  const startGame = () => {
    setGameState({
      score: 0,
      health: 3,
      stage: 1,
      combo: 0,
      activePowerups: [],
      gameStatus: "playing",
      specialAbilityCharge: 75,
      specialAbilityCooldown: 0,
      shieldCooldown: 0,
      shieldActive: false,
    });
  };

  // Pause the game
  const pauseGame = () => {
    setGameState((prev) => ({
      ...prev,
      gameStatus: prev.gameStatus === "playing" ? "paused" : "playing",
    }));
  };

  // Collect powerup
  const collectPowerup = (powerupType: string) => {
    setGameState((prev) => ({
      ...prev,
      activePowerups: [...prev.activePowerups, powerupType],
    }));

    // Power-ups could expire after a certain time
    setTimeout(() => {
      setGameState((prev) => ({
        ...prev,
        activePowerups: prev.activePowerups.filter((p) => p !== powerupType),
      }));
    }, 10000); // 10 seconds duration for power-ups
  };

  // Advance to next stage
  const advanceStage = () => {
    setGameState((prev) => ({
      ...prev,
      stage: prev.stage + 1,
    }));
  };

  // View high scores
  const viewHighScores = () => {
    // For now, just show an alert with the high score
    alert(`Current High Score: ${gameState.score}`);
    // In a real implementation, you would navigate to a high scores screen
  };

  // Render game menu
  const renderMenu = () => (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1 className="text-4xl font-bold text-white mb-8">
        Space Drone Defense
      </h1>
      <motion.button
        className="px-8 py-3 bg-blue-600 text-white rounded-lg text-xl mb-4"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={startGame}
      >
        Start Game
      </motion.button>
      <motion.button
        className="px-8 py-3 bg-gray-600 text-white rounded-lg text-xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={viewHighScores}
      >
        High Scores
      </motion.button>
    </motion.div>
  );

  // Render game over screen
  const renderGameOver = () => (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-80 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1 className="text-4xl font-bold text-red-500 mb-4">Game Over</h1>
      <p className="text-2xl text-white mb-8">Final Score: {gameState.score}</p>
      <motion.button
        className="px-8 py-3 bg-blue-600 text-white rounded-lg text-xl mb-4"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={startGame}
      >
        Play Again
      </motion.button>
      <motion.button
        className="px-8 py-3 bg-gray-600 text-white rounded-lg text-xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() =>
          setGameState((prev) => ({ ...prev, gameStatus: "menu" }))
        }
      >
        Main Menu
      </motion.button>
    </motion.div>
  );

  // Render pause menu
  const renderPauseMenu = () => (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 z-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <h1 className="text-4xl font-bold text-white mb-8">Game Paused</h1>
      <motion.button
        className="px-8 py-3 bg-blue-600 text-white rounded-lg text-xl mb-4"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={pauseGame}
      >
        Resume
      </motion.button>
      <motion.button
        className="px-8 py-3 bg-red-600 text-white rounded-lg text-xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() =>
          setGameState((prev) => ({ ...prev, gameStatus: "menu" }))
        }
      >
        Quit Game
      </motion.button>
    </motion.div>
  );

  return (
    <div className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Game Canvas - Main gameplay area */}
      <GameCanvas
        gameStatus={gameState.gameStatus}
        stage={gameState.stage}
        onEnemyDestroyed={updateScore}
        onEnemyReachedBottom={handleEnemyReachedBottom}
        onPowerUpCollected={collectPowerup}
        onTimeExpired={handleTimeExpired}
        activePowerups={gameState.activePowerups}
        onSpecialFire={handleSpecialAbility}
        onShieldActivate={handleShieldActivate}
      />

      {/* Game HUD - Score, health, stage info */}
      <GameHUD
        score={gameState.score}
        health={gameState.health}
        stage={gameState.stage}
        combo={gameState.combo}
        activePowerups={gameState.activePowerups}
        onPause={pauseGame}
      />

      {/* Game Controls - Touch controls for movement and shooting */}
      <GameControls
        onMove={handleMove}
        onShoot={handleShoot}
        onSpecialAbility={handleSpecialAbility}
        onShieldActivate={handleShieldActivate}
        specialAbilityCharge={gameState.specialAbilityCharge}
        specialAbilityCooldown={gameState.specialAbilityCooldown}
        shieldCooldown={gameState.shieldCooldown}
        shieldActive={gameState.shieldActive}
        gameStatus={gameState.gameStatus}
      />

      {/* Conditional rendering of game menus */}
      {gameState.gameStatus === "menu" && renderMenu()}
      {gameState.gameStatus === "gameOver" && renderGameOver()}
      {gameState.gameStatus === "paused" && renderPauseMenu()}
    </div>
  );
};

export default Home;
