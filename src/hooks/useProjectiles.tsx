import { useState, useEffect } from "react";

export type BulletType = "standard" | "laser" | "plasma" | "explosive";

interface Projectile {
  id: string;
  x: number;
  y: number;
  speed: number;
  width: number;
  height: number;
  isSpecial?: boolean;
  isCharged?: boolean;
  chargeLevel?: number;
  damage?: number;
  bulletType?: BulletType;
}

interface Player {
  x: number;
  y: number;
  width: number;
  height: number;
  cooldown: number;
  currentCooldown: number;
  currentBulletType?: BulletType;
  powerUps: {
    rapidFire?: { active: boolean; duration: number; remaining: number };
    shield?: { active: boolean; duration: number; remaining: number };
    multiShot?: { active: boolean; duration: number; remaining: number };
    bomb?: { active: boolean; count: number };
  };
}

interface UseProjectilesProps {
  player: Player;
  setPlayer: React.Dispatch<React.SetStateAction<Player>>;
  canvasSize: { width: number; height: number };
  isPaused: boolean;
  gameActive: boolean;
  gameStatus: string;
}

export const useProjectiles = ({
  player,
  setPlayer,
  canvasSize,
  isPaused,
  gameActive,
  gameStatus,
}: UseProjectilesProps) => {
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [chargeStartTime, setChargeStartTime] = useState<number | null>(null);
  const [currentChargeLevel, setCurrentChargeLevel] = useState(0);
  const [currentBulletType, setCurrentBulletType] =
    useState<BulletType>("standard");
  const maxChargeLevel = 5; // Maximum charge level

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

  // Fire a projectile from the player's position
  const fireProjectile = (isSpecialFire = false, chargeLevel = 0) => {
    if (player.currentCooldown > 0) return;

    // Get the current bullet type (from player or hook state)
    const bulletType = player.currentBulletType || currentBulletType;

    // Determine projectile properties based on bullet type, charge level, or special fire
    const isChargedShot = chargeLevel > 0;

    // Set dimensions based on bullet type and charge
    let projectileWidth = 10;
    let projectileHeight = 20;
    let projectileSpeed = 0.5;
    let projectileDamage = 1;

    // Adjust properties based on bullet type
    switch (bulletType) {
      case "laser":
        projectileWidth = 6;
        projectileHeight = 30;
        projectileSpeed = 0.8;
        projectileDamage = 1.2;
        break;
      case "plasma":
        projectileWidth = 14;
        projectileHeight = 14;
        projectileSpeed = 0.6;
        projectileDamage = 1.5;
        break;
      case "explosive":
        projectileWidth = 16;
        projectileHeight = 16;
        projectileSpeed = 0.4;
        projectileDamage = 2;
        break;
      default: // standard
        projectileWidth = 10;
        projectileHeight = 20;
        projectileSpeed = 0.5;
        projectileDamage = 1;
    }

    // Apply modifiers for special fire or charged shots
    if (isSpecialFire) {
      projectileWidth *= 2;
      projectileHeight *= 1.5;
      projectileSpeed = 0.7;
      projectileDamage = 3;
    } else if (isChargedShot) {
      projectileWidth += chargeLevel * 2;
      projectileHeight += chargeLevel * 3;
      projectileSpeed += chargeLevel * 0.05;
      projectileDamage += Math.floor(chargeLevel / 2);
    }

    // Apply rapid fire bonus if active
    if (player.powerUps.rapidFire?.active) {
      projectileSpeed = Math.min(projectileSpeed * 1.4, 1.0); // Cap at 1.0
      projectileDamage *= 1.2;
    }

    // Create base projectile
    const baseProjectile: Projectile = {
      id: `projectile-${Date.now()}-${Math.random()}`,
      x: player.x + player.width / 2 - projectileWidth / 2,
      y: player.y - projectileHeight,
      speed: projectileSpeed,
      width: projectileWidth,
      height: projectileHeight,
      isSpecial: isSpecialFire,
      isCharged: isChargedShot,
      chargeLevel: chargeLevel,
      damage: projectileDamage,
      bulletType: bulletType,
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

    // Set cooldown based on rapidFire power-up, special fire, or charge level
    const cooldownTime = isSpecialFire
      ? 1000
      : isChargedShot
        ? 500 + chargeLevel * 100 // Longer cooldown for charged shots
        : player.powerUps.rapidFire?.active
          ? 150 // Much shorter cooldown with rapid fire (was 200)
          : 500;

    setPlayer((prev) => ({
      ...prev,
      currentCooldown: cooldownTime,
    }));
  };

  // Handle touch/mouse down for charge shot
  const handlePointerDown = () => {
    if (isPaused || !gameActive || gameStatus !== "playing") return;
    // Start charging
    setChargeStartTime(Date.now());

    // Reset charge level
    setCurrentChargeLevel(0);
  };

  // Handle touch/mouse up to release charge shot
  const handlePointerUp = () => {
    if (isPaused || !gameActive || gameStatus !== "playing" || !chargeStartTime)
      return;

    // Calculate charge level based on how long the button was held
    const chargeTime = Date.now() - chargeStartTime;
    const chargeLevel = Math.min(Math.floor(chargeTime / 300), maxChargeLevel); // 300ms per charge level, max 5 levels

    // Fire with charge level
    fireProjectile(false, chargeLevel);

    // Reset charge
    setChargeStartTime(null);
    setCurrentChargeLevel(0);
  };

  // Update charge level while charging
  useEffect(() => {
    if (!chargeStartTime || isPaused || !gameActive) return;

    const chargeInterval = setInterval(() => {
      if (chargeStartTime) {
        const chargeTime = Date.now() - chargeStartTime;
        const newChargeLevel = Math.min(
          Math.floor(chargeTime / 300),
          maxChargeLevel,
        );
        setCurrentChargeLevel(newChargeLevel);
      }
    }, 100);

    return () => clearInterval(chargeInterval);
  }, [chargeStartTime, isPaused, gameActive]);

  // Change bullet type
  const changeBulletType = (newType: BulletType) => {
    setCurrentBulletType(newType);
    setPlayer((prev) => ({
      ...prev,
      currentBulletType: newType,
    }));
  };

  return {
    projectiles,
    setProjectiles,
    moveProjectiles,
    fireProjectile,
    handlePointerDown,
    handlePointerUp,
    chargeStartTime,
    currentChargeLevel,
    maxChargeLevel,
    currentBulletType,
    changeBulletType,
  };
};
