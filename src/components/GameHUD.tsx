import React from "react";
import { motion } from "framer-motion";
import { Heart, Trophy, Zap, Shield, Timer } from "lucide-react";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Card } from "./ui/card";

interface GameHUDProps {
  score?: number;
  highScore?: number;
  health?: number;
  maxHealth?: number;
  stage?: number;
  combo?: number;
  comboMultiplier?: number;
  activePowerUps?: Array<{
    id: string;
    name: string;
    icon: string;
    duration: number;
    timeRemaining: number;
  }>;
  timeRemaining?: number;
  onPause?: () => void;
}

const GameHUD = ({
  score = 0,
  highScore = 0,
  health = 100,
  maxHealth = 100,
  stage = 1,
  combo = 0,
  comboMultiplier = 1,
  activePowerUps = [],
  timeRemaining = 60,
}: GameHUDProps) => {
  // Calculate health percentage
  const healthPercentage = (health / maxHealth) * 100;

  // Determine health color based on percentage
  const getHealthColor = () => {
    if (healthPercentage > 60) return "text-green-500";
    if (healthPercentage > 30) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div
      className="fixed top-0 left-0 right-0 p-2 bg-background/80 backdrop-blur-sm border-b"
      style={{ zIndex: 45 }}
    >
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          {/* Left section - Score and High Score */}
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <Trophy className="h-4 w-4 text-yellow-500" />
              <motion.span
                className="font-bold"
                key={score}
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 0.3 }}
              >
                {score.toLocaleString()}
              </motion.span>
            </div>
            <div className="text-xs text-muted-foreground">
              High: {highScore.toLocaleString()}
            </div>
          </div>

          {/* Center section - Stage and Combo */}
          <div className="flex flex-col items-center">
            <Badge variant="outline" className="mb-1">
              Stage {stage}
            </Badge>
            {combo > 0 && (
              <motion.div
                className="flex items-center gap-1"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
              >
                <Zap className="h-3 w-3 text-purple-500" />
                <span className="text-xs font-bold">
                  {combo}x{" "}
                  <span className="text-purple-500">{comboMultiplier}x</span>
                </span>
              </motion.div>
            )}
          </div>

          {/* Right section - Health */}
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1">
              <Heart className={`h-4 w-4 ${getHealthColor()}`} />
              <span className={`font-bold ${getHealthColor()}`}>{health}</span>
            </div>
            <Progress value={healthPercentage} className="h-1.5 w-16" />
          </div>
        </div>

        {/* Power-ups section */}
        {activePowerUps.length > 0 && (
          <div className="flex justify-center gap-2 mt-2">
            {activePowerUps.map((powerUp) => (
              <Card
                key={powerUp.id}
                className="p-1 flex items-center gap-1 bg-primary/10 border-primary/20"
              >
                {powerUp.icon === "shield" && (
                  <Shield className="h-3 w-3 text-blue-500" />
                )}
                {powerUp.icon === "zap" && (
                  <Zap className="h-3 w-3 text-yellow-500" />
                )}
                <div className="text-xs">{powerUp.name}</div>
                <Progress
                  value={(powerUp.timeRemaining / powerUp.duration) * 100}
                  className="h-1 w-8"
                />
              </Card>
            ))}
          </div>
        )}

        {/* Time remaining (if applicable) */}
        {timeRemaining > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1">
            <Timer className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">
              {Math.floor(timeRemaining / 60)}:
              {(timeRemaining % 60).toString().padStart(2, "0")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GameHUD;
