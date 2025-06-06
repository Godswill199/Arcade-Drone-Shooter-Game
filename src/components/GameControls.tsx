import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Crosshair,
  Zap,
  Shield,
  RotateCcw,
  Laser,
  Flame,
  Target,
} from "lucide-react";
import { BulletType } from "@/hooks/useProjectiles";

interface GameControlsProps {
  onMove: (position: number) => void;
  onShoot: (chargeLevel?: number) => void;
  onSpecialAbility?: () => void;
  onShieldActivate?: () => void;
  onChangeBulletType?: (type: BulletType) => void;
  weaponCooldown?: number;
  specialAbilityCooldown?: number;
  specialAbilityCharge?: number;
  shieldCooldown?: number;
  shieldActive?: boolean;
  weaponType?: string;
  currentBulletType?: BulletType;
  isGameActive?: boolean;
  gameStatus?: "menu" | "playing" | "paused" | "gameOver";
}

const GameControls = ({
  onMove = () => {},
  onShoot = () => {},
  onSpecialAbility = () => {},
  onShieldActivate = () => {},
  onChangeBulletType = () => {},
  weaponCooldown = 0,
  specialAbilityCooldown = 0,
  specialAbilityCharge = 100,
  shieldCooldown = 0,
  shieldActive = false,
  weaponType = "standard",
  currentBulletType = "standard",
  isGameActive = true,
  gameStatus = "playing",
}: GameControlsProps) => {
  const [touchPosition, setTouchPosition] = useState<number>(50);
  const [isShooting, setIsShooting] = useState<boolean>(false);
  const [isSpecialActive, setIsSpecialActive] = useState<boolean>(false);
  const [specialCooldownTimer, setSpecialCooldownTimer] = useState<
    number | null
  >(null);
  const [shieldCooldownTimer, setShieldCooldownTimer] = useState<number | null>(
    null,
  );
  const [touchStartPosition, setTouchStartPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [currentTouchPosition, setCurrentTouchPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  // Handle movement based on slider position
  useEffect(() => {
    onMove(touchPosition);
  }, [touchPosition, onMove]);

  // Handle special ability cooldown timer
  useEffect(() => {
    if (specialAbilityCooldown > 0 && !specialCooldownTimer) {
      const timer = window.setInterval(() => {
        setSpecialCooldownTimer((prev) => {
          if (prev === null) return null;
          return prev - 1;
        });
      }, 1000);
      setSpecialCooldownTimer(specialAbilityCooldown);

      return () => clearInterval(timer);
    } else if (specialAbilityCooldown === 0) {
      setSpecialCooldownTimer(null);
    }
  }, [specialAbilityCooldown]);

  // Handle shield cooldown timer
  useEffect(() => {
    if (shieldCooldown > 0 && !shieldCooldownTimer) {
      const timer = window.setInterval(() => {
        setShieldCooldownTimer((prev) => {
          if (prev === null) return null;
          if (prev <= 1) {
            clearInterval(timer);
            return null;
          }
          return prev - 1;
        });
      }, 1000);
      setShieldCooldownTimer(shieldCooldown);

      return () => clearInterval(timer);
    } else if (shieldCooldown === 0) {
      setShieldCooldownTimer(null);
    }
  }, [shieldCooldown]);

  // Charge shot mechanics
  const [isCharging, setIsCharging] = useState(false);
  const [chargeLevel, setChargeLevel] = useState(0);
  const [chargeStartTime, setChargeStartTime] = useState<number | null>(null);
  const maxChargeLevel = 5;

  // Handle shooting animation and charge mechanics
  const handleShootStart = () => {
    if (weaponCooldown === 0 && isGameActive && gameStatus === "playing") {
      setIsCharging(true);
      setChargeStartTime(Date.now());
      setChargeLevel(0);
    }
  };

  const handleShootEnd = () => {
    if (isCharging && isGameActive && gameStatus === "playing") {
      setIsShooting(true);
      onShoot(chargeLevel); // Pass charge level to the shoot handler
      setTimeout(() => setIsShooting(false), 200);
      setIsCharging(false);
      setChargeStartTime(null);
      setChargeLevel(0);
    }
  };

  // Update charge level while button is held
  useEffect(() => {
    if (!isCharging || !chargeStartTime) return;

    const chargeInterval = setInterval(() => {
      if (chargeStartTime) {
        const chargeTime = Date.now() - chargeStartTime;
        const newChargeLevel = Math.min(
          Math.floor(chargeTime / 300),
          maxChargeLevel,
        );
        setChargeLevel(newChargeLevel);
      }
    }, 100);

    return () => clearInterval(chargeInterval);
  }, [isCharging, chargeStartTime]);

  // Handle special ability
  const handleSpecialAbility = () => {
    if (
      specialAbilityCooldown === 0 &&
      specialAbilityCharge >= 25 &&
      isGameActive &&
      gameStatus === "playing"
    ) {
      setIsSpecialActive(true);
      onSpecialAbility();
      setTimeout(() => setIsSpecialActive(false), 300);
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t border-border p-4 rounded-t-xl shadow-lg"
      style={{ height: "auto", maxHeight: "35vh", zIndex: 30 }}
    >
      <div className="flex flex-col gap-4">
        {/* Weapon info and special ability */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex flex-wrap justify-center w-full gap-2 mb-2">
            <Badge
              variant="outline"
              className={`flex items-center gap-1 px-3 py-1.5 ${currentBulletType === "standard" ? "bg-primary/20 border-primary" : ""}`}
              onClick={() => onChangeBulletType("standard")}
            >
              <Crosshair size={14} />
              <span>Standard</span>
            </Badge>

            <Badge
              variant="outline"
              className={`flex items-center gap-1 px-3 py-1.5 ${currentBulletType === "laser" ? "bg-cyan-500/20 border-cyan-500" : ""}`}
              onClick={() => onChangeBulletType("laser")}
            >
              <Zap size={14} className="text-cyan-400" />
              <span>Laser</span>
            </Badge>

            <Badge
              variant="outline"
              className={`flex items-center gap-1 px-3 py-1.5 ${currentBulletType === "plasma" ? "bg-green-500/20 border-green-500" : ""}`}
              onClick={() => onChangeBulletType("plasma")}
            >
              <Flame size={14} className="text-green-400" />
              <span>Plasma</span>
            </Badge>

            <Badge
              variant="outline"
              className={`flex items-center gap-1 px-3 py-1.5 ${currentBulletType === "explosive" ? "bg-orange-500/20 border-orange-500" : ""}`}
              onClick={() => onChangeBulletType("explosive")}
            >
              <Target size={14} className="text-orange-400" />
              <span>Explosive</span>
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Progress value={specialAbilityCharge} className="w-20 h-2" />
            <span className="text-xs text-muted-foreground">
              {specialAbilityCharge}%
            </span>
          </div>
        </div>

        {/* Movement control - Virtual joystick */}
        <div className="px-4 relative h-16 bg-gray-800/30 rounded-full overflow-hidden touch-none">
          <div
            className="absolute inset-0"
            onTouchStart={(e) => {
              const touch = e.touches[0];
              const rect = e.currentTarget.getBoundingClientRect();
              const x = touch.clientX - rect.left;
              const y = touch.clientY - rect.top;
              setTouchStartPosition({ x, y });
              setCurrentTouchPosition({ x, y });

              // Calculate position as percentage (0-100)
              const position = (x / rect.width) * 100;
              setTouchPosition(Math.max(0, Math.min(100, position)));
            }}
            onTouchMove={(e) => {
              if (!touchStartPosition) return;

              const touch = e.touches[0];
              const rect = e.currentTarget.getBoundingClientRect();
              const x = touch.clientX - rect.left;
              setCurrentTouchPosition({ ...touchStartPosition, x });

              // Calculate position as percentage (0-100)
              const position = (x / rect.width) * 100;
              setTouchPosition(Math.max(0, Math.min(100, position)));
            }}
            onTouchEnd={() => {
              setTouchStartPosition(null);
              setCurrentTouchPosition(null);
            }}
          >
            {/* Visual indicator */}
            {currentTouchPosition && (
              <motion.div
                className="absolute top-1/2 w-12 h-12 bg-primary/50 rounded-full border-2 border-primary"
                style={{
                  left: currentTouchPosition.x,
                  top: "50%",
                  x: "-50%",
                  y: "-50%",
                }}
                transition={{ type: "spring", damping: 10 }}
              />
            )}

            {/* Fallback for non-touch devices */}
            <Slider
              value={[touchPosition]}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) => setTouchPosition(value[0])}
              className="touch-none opacity-0"
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-between items-center gap-4">
          {/* Special ability button */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            animate={isSpecialActive ? { scale: [1, 1.1, 1] } : {}}
            className="w-1/3"
          >
            <Button
              variant="outline"
              size="lg"
              className={`w-full h-16 rounded-xl ${specialAbilityCooldown > 0 || specialAbilityCharge < 25 ? "opacity-50" : ""}`}
              onClick={handleSpecialAbility}
              disabled={
                specialAbilityCooldown > 0 ||
                specialAbilityCharge < 25 ||
                !isGameActive
              }
            >
              {specialAbilityCooldown > 0 || specialCooldownTimer ? (
                <div className="flex flex-col items-center">
                  <RotateCcw size={20} className="animate-spin" />
                  <span className="text-xs mt-1">
                    {specialCooldownTimer || specialAbilityCooldown}s
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Zap size={24} />
                  <span className="text-xs mt-1">Special</span>
                </div>
              )}
            </Button>
          </motion.div>

          {/* Main shoot button */}
          <motion.div
            whileTap={{ scale: 0.95 }}
            animate={isShooting ? { scale: [1, 0.9, 1] } : {}}
            className="w-1/2"
          >
            <Button
              variant="default"
              size="lg"
              className={`w-full h-20 rounded-full ${weaponCooldown > 0 ? "opacity-70" : ""}`}
              onPointerDown={handleShootStart}
              onPointerUp={handleShootEnd}
              onPointerLeave={handleShootEnd}
              disabled={weaponCooldown > 0 || !isGameActive}
            >
              {weaponCooldown > 0 ? (
                <div className="flex flex-col items-center">
                  <RotateCcw size={24} className="animate-spin" />
                  <span className="text-xs mt-1">
                    {weaponCooldown.toFixed(1)}s
                  </span>
                </div>
              ) : isCharging && chargeLevel > 0 ? (
                <div className="flex flex-col items-center">
                  <Crosshair
                    size={32}
                    className={
                      chargeLevel >= maxChargeLevel ? "text-red-500" : ""
                    }
                  />
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden mt-1">
                    <div
                      className={`h-full ${chargeLevel >= maxChargeLevel ? "bg-red-600 animate-pulse" : "bg-orange-400"}`}
                      style={{
                        width: `${(chargeLevel / maxChargeLevel) * 100}%`,
                      }}
                    ></div>
                  </div>
                  <span className="text-xs mt-1">CHARGING</span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Crosshair size={32} />
                  <span className="text-xs mt-1">HOLD TO CHARGE</span>
                </div>
              )}
            </Button>
          </motion.div>

          {/* Shield/defensive button */}
          <motion.div whileTap={{ scale: 0.95 }} className="w-1/3">
            <Button
              variant="outline"
              size="lg"
              className={`w-full h-16 rounded-xl ${shieldActive ? "bg-blue-500/20 border-blue-500" : ""} ${shieldCooldown > 0 ? "opacity-50" : ""}`}
              onClick={onShieldActivate}
              disabled={
                shieldCooldown > 0 || !isGameActive || gameStatus !== "playing"
              }
            >
              {shieldCooldown > 0 || shieldCooldownTimer ? (
                <div className="flex flex-col items-center">
                  <RotateCcw size={20} className="animate-spin" />
                  <span className="text-xs mt-1">
                    {shieldCooldownTimer || shieldCooldown}s
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Shield
                    size={24}
                    className={shieldActive ? "text-blue-500" : ""}
                  />
                  <span className="text-xs mt-1">Shield</span>
                </div>
              )}
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default GameControls;
