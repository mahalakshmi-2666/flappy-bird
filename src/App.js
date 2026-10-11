import React, { useEffect, useRef, useState } from "react";
import "./App.css";

const WIDTH = 400;
const HEIGHT = 600;
const BIRD_X = 90;
const BIRD_RADIUS = 14;
const GRAVITY = 0.22;
const FLAP_POWER = -4.5;
const PILLAR_WIDTH = 58;
const PILLAR_GAP = 165;

function App() {
  const canvasRef = useRef(null);
  const gameRef = useRef({});
  const [status, setStatus] = useState("ready");
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let animationId;
    let lastTime = 0;
    let spawnTimer = 0;
    let lastUiUpdate = 0;

    const resetGame = () => ({
      birdY: 260,
      velocity: 0,
      pillars: [],
      score: 0,
      level: 1,
      elapsed: 0,
      status: "ready",
      startedAt: 0,
      groundOffset: 0,
    });

    gameRef.current = resetGame();

    function startGame() {
      const game = gameRef.current;

      if (game.status === "over") {
        gameRef.current = resetGame();
        setScore(0);
        setLevel(1);
      }

      const current = gameRef.current;

      if (current.status === "ready") {
        current.status = "playing";
        current.startedAt = performance.now();
        current.velocity = FLAP_POWER;
        setStatus("playing");
      } else if (current.status === "playing") {
        current.velocity = FLAP_POWER;
      }
    }

    function endGame() {
      const game = gameRef.current;

      if (game.status !== "playing") return;

      game.status = "over";
      setStatus("over");
      setScore(game.score);
      setLevel(game.level);
    }

    function drawBird() {
      const game = gameRef.current;

      ctx.save();
      ctx.translate(BIRD_X, game.birdY);
      ctx.rotate(Math.min(Math.PI / 4, game.velocity * 0.07));

      // Bird body
      ctx.fillStyle = "#FFD93D";
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_RADIUS, 0, Math.PI * 2);
      ctx.fill();

      // Wing
      ctx.fillStyle = "#FF9F1C";
      ctx.beginPath();
      ctx.ellipse(-5, 4, 8, 5, -0.4, 0, Math.PI * 2);
      ctx.fill();

      // Eye
      ctx.fillStyle = "#FFFFFF";
      ctx.beginPath();
      ctx.arc(6, -5, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#222222";
      ctx.beginPath();
      ctx.arc(8, -5, 2.3, 0, Math.PI * 2);
      ctx.fill();

      // Beak
      ctx.fillStyle = "#FF6B35";
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(23, 4);
      ctx.lineTo(12, 7);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    function drawPillars() {
      const game = gameRef.current;

      game.pillars.forEach((pillar) => {
        const bottomY = pillar.topHeight + PILLAR_GAP;

        // Pillar gradient
        const gradient = ctx.createLinearGradient(
          pillar.x,
          0,
          pillar.x + PILLAR_WIDTH,
          0
        );
        gradient.addColorStop(0, "#16803D");
        gradient.addColorStop(0.5, "#39D353");
        gradient.addColorStop(1, "#116329");

        ctx.fillStyle = gradient;

        // Upper pillar
        ctx.fillRect(pillar.x, 0, PILLAR_WIDTH, pillar.topHeight);
        ctx.fillRect(
          pillar.x - 5,
          pillar.topHeight - 20,
          PILLAR_WIDTH + 10,
          20
        );

        // Lower pillar
        ctx.fillRect(
          pillar.x,
          bottomY,
          PILLAR_WIDTH,
          HEIGHT - bottomY
        );
        ctx.fillRect(
          pillar.x - 5,
          bottomY,
          PILLAR_WIDTH + 10,
          20
        );

        // Pillar highlights
        ctx.fillStyle = "rgba(255,255,255,0.16)";
        ctx.fillRect(pillar.x + 8, 0, 5, pillar.topHeight - 20);
        ctx.fillRect(
          pillar.x + 8,
          bottomY + 20,
          5,
          HEIGHT - bottomY - 20
        );
      });
    }

    function drawBackground() {
      const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      sky.addColorStop(0, "#55C7F7");
      sky.addColorStop(1, "#D5F5FF");

      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Clouds
      ctx.fillStyle = "rgba(255,255,255,0.7)";

      [
        [65, 100],
        [275, 165],
        [165, 300],
      ].forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 19, 0, Math.PI * 2);
        ctx.arc(x + 22, y - 8, 24, 0, Math.PI * 2);
        ctx.arc(x + 46, y, 17, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ground
      ctx.fillStyle = "#D6B36A";
      ctx.fillRect(0, HEIGHT - 30, WIDTH, 30);

      ctx.fillStyle = "#69C64B";
      ctx.fillRect(0, HEIGHT - 30, WIDTH, 8);

      ctx.fillStyle = "#B18B45";

      for (let x = -gameRef.current.groundOffset; x < WIDTH; x += 28) {
        ctx.fillRect(x, HEIGHT - 15, 14, 3);
      }
    }

    function draw() {
      drawBackground();
      drawPillars();
      drawBird();

      const game = gameRef.current;

      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "rgba(0,0,0,0.35)";
      ctx.lineWidth = 3;
      ctx.font = "bold 32px Arial";
      ctx.textAlign = "center";
      ctx.strokeText(String(game.score), WIDTH / 2, 55);
      ctx.fillText(String(game.score), WIDTH / 2, 55);

      ctx.textAlign = "left";
      ctx.font = "bold 17px Arial";
      ctx.fillStyle = "#174B25";
      ctx.fillText(`LEVEL ${game.level}`, 14, 30);
    }

    function checkCollision(pillar) {
      const game = gameRef.current;
      const birdLeft = BIRD_X - BIRD_RADIUS + 3;
      const birdRight = BIRD_X + BIRD_RADIUS - 3;
      const birdTop = game.birdY - BIRD_RADIUS + 3;
      const birdBottom = game.birdY + BIRD_RADIUS - 3;

      const overlapsX =
        birdRight > pillar.x && birdLeft < pillar.x + PILLAR_WIDTH;

      if (!overlapsX) return false;

      const bottomY = pillar.topHeight + PILLAR_GAP;

      return (
        birdTop < pillar.topHeight ||
        birdBottom > bottomY
      );
    }

    function update(delta, now) {
      const game = gameRef.current;

      if (game.status !== "playing") return;

      game.elapsed = now - game.startedAt;

      // Increase the level every 15 seconds.
      const newLevel = Math.floor(game.elapsed / 15000) + 1;

      if (newLevel !== game.level) {
        game.level = newLevel;
      }

      // Pillars get faster at every new level.
      const speed = 2.5 + (game.level - 1) * 0.65;
      const step = delta / 16.67;

      game.velocity += GRAVITY * step;
      game.birdY += game.velocity * step;
      game.groundOffset =
        (game.groundOffset + speed * step) % 28;

      spawnTimer += delta;

      if (spawnTimer >= 1450) {
        spawnTimer = 0;

        const minTop = 65;
        const maxTop = HEIGHT - 30 - PILLAR_GAP - 65;
        const topHeight =
          minTop + Math.random() * (maxTop - minTop);

        game.pillars.push({
          x: WIDTH + 10,
          topHeight,
          passed: false,
        });
      }

      game.pillars.forEach((pillar) => {
        pillar.x -= speed * step;

        if (!pillar.passed && pillar.x + PILLAR_WIDTH < BIRD_X) {
          pillar.passed = true;
          game.score += 1;
        }

        if (checkCollision(pillar)) {
          endGame();
        }
      });

      game.pillars = game.pillars.filter(
        (pillar) => pillar.x + PILLAR_WIDTH > 0
      );

      if (game.birdY - BIRD_RADIUS < 0) {
        endGame();
      }

      if (game.birdY + BIRD_RADIUS >= HEIGHT - 30) {
        endGame();
      }

      // Update React state occasionally to keep gameplay smooth.
      if (now - lastUiUpdate > 100) {
        setScore(game.score);
        setLevel(game.level);
        lastUiUpdate = now;
      }
    }

    function loop(now) {
      const delta = lastTime ? Math.min(now - lastTime, 40) : 16.67;
      lastTime = now;

      update(delta, now);
      draw();

      animationId = requestAnimationFrame(loop);
    }

    function handlePointerDown(event) {
      event.preventDefault();
      startGame();
    }

    function handleKeyDown(event) {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        startGame();
      }
    }

    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    animationId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <main className="app">
      <h1 className="game-title">🐦 Flappy Bird</h1>
      <p className="subtitle">
        Fly through the pillars and beat your high score!
      </p>

      <div className="game-container">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="game-canvas"
          aria-label="Flappy Bird game. Tap or click to fly."
        />

        {status !== "playing" && (
          <div className="game-overlay">
            {status === "ready" ? (
              <>
                <h2>Ready to Fly?</h2>
                <p>Tap anywhere on the game to start!</p>
                <p>Tap again to flap your wings.</p>
                <button
                  className="game-button"
                  onClick={() => {
                    const canvas = canvasRef.current;
                    canvas.dispatchEvent(
                      new PointerEvent("pointerdown", {
                        bubbles: true,
                      })
                    );
                  }}
                >
                  Start Game
                </button>
              </>
            ) : (
              <>
                <h2>💥 Game Over!</h2>
                <p className="final-score">
                  Your Score: <strong>{score}</strong>
                </p>
                <p>You reached Level {level}</p>
                <button
                  className="game-button"
                  onClick={() => {
                    const canvas = canvasRef.current;
                    canvas.dispatchEvent(
                      new PointerEvent("pointerdown", {
                        bubbles: true,
                      })
                    );
                  }}
                >
                  Play Again ↻
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="game-info">
        <div className="info-card">
          <span>🏆 Score</span>
          <strong>{score}</strong>
        </div>

        <div className="info-card">
          <span>🚀 Level</span>
          <strong>{level}</strong>
        </div>

        <div className="info-card">
          <span>⏱️ Next Level</span>
          <strong>
            {status === "playing"
              ? `${15 - Math.floor(
                  (gameRef.current.elapsed || 0) / 1000
                ) % 15}s`
              : "15s"}
          </strong>
        </div>
      </div>

      <p className="instructions">
        Tap or click to fly • Press SPACE to flap • Avoid the pillars!
      </p>
    </main>
  );
}

export default App;