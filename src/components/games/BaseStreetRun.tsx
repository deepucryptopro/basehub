'use client';

import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import styles from './GameStyles.module.css';

// Game Constants
const LANE_WIDTH = 100;
const TOTAL_WIDTH = LANE_WIDTH * 3;
const CANVAS_HEIGHT = 600;
const LANE_CENTERS = [LANE_WIDTH / 2, LANE_WIDTH * 1.5, LANE_WIDTH * 2.5];
const GRAVITY = 0.6;
const JUMP_FORCE = -12;
const MOVEMENT_SPEED_INITIAL = 5;

// Assets (Using colors for now)
const PLAYER_COLOR = '#0052FF'; // Base Blue
const OBSTACLE_COLOR = '#E43D28'; // Red
const COIN_COLOR = '#FFD700'; // Gold
const BG_COLOR = '#F5F5F5';
const LANE_COLOR = '#E0E0E0';

type Obstacle = {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'block' | 'rug';
    lane: number;
    passed: boolean; // For score
};

type Coin = {
    x: number;
    y: number;
    width: number;
    height: number;
    lane: number;
    collected: boolean;
};

export default function BaseStreetRun() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [gameOver, setGameOver] = useState(false);
    const [score, setScore] = useState(0);
    const [coinsCollected, setCoinsCollected] = useState(0);
    const [gameStarted, setGameStarted] = useState(false);
    const [saved, setSaved] = useState(false);

    // Game State Refs (to avoid closures in loop)
    const playerRef = useRef({
        x: LANE_CENTERS[1], // Start in middle lane
        y: CANVAS_HEIGHT - 100,
        lane: 1, // 0, 1, 2
        width: 40,
        height: 60,
        vy: 0,
        isJumping: false,
        groundY: CANVAS_HEIGHT - 100,
    });

    const obstaclesRef = useRef<Obstacle[]>([]);
    const coinsRef = useRef<Coin[]>([]);
    const speedRef = useRef(MOVEMENT_SPEED_INITIAL);
    const frameRef = useRef(0);
    const scoreRef = useRef(0);
    const loopRef = useRef<number>(0);

    const handleKeyDown = (e: KeyboardEvent) => {
        if (!gameStarted && e.code === 'Space') {
            startGame();
            return;
        }
        if (gameOver && e.code === 'Space') {
            restartGame();
            return;
        }
        if (!gameStarted || gameOver) return;

        const player = playerRef.current;

        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                if (player.lane > 0) {
                    player.lane--;
                }
                break;
            case 'ArrowRight':
            case 'KeyD':
                if (player.lane < 2) {
                    player.lane++;
                }
                break;
            case 'Space':
            case 'ArrowUp':
            case 'KeyW':
                if (!player.isJumping) {
                    player.vy = JUMP_FORCE;
                    player.isJumping = true;
                }
                break;
        }
    };

    const startGame = () => {
        setGameStarted(true);
        setGameOver(false);
        setScore(0);
        setCoinsCollected(0);
        setSaved(false);

        // Reset Physics
        playerRef.current = {
            ...playerRef.current,
            lane: 1,
            y: CANVAS_HEIGHT - 100,
            vy: 0,
            isJumping: false,
        };
        obstaclesRef.current = [];
        coinsRef.current = [];
        speedRef.current = MOVEMENT_SPEED_INITIAL;
        scoreRef.current = 0;
        frameRef.current = 0;

        if (loopRef.current) cancelAnimationFrame(loopRef.current);
        loopRef.current = requestAnimationFrame(gameLoop);
    };

    const restartGame = startGame;

    const spawnObstacle = () => {
        // Random lane
        const lane = Math.floor(Math.random() * 3);
        const type = Math.random() > 0.5 ? 'block' : 'rug';
        const width = 60;
        const height = type === 'block' ? 60 : 20; // Block is tall, rug is flat

        obstaclesRef.current.push({
            x: 0, // Set in loop based on lane
            y: -100, // Start above
            width,
            height,
            type,
            lane,
            passed: false,
        });

        // 30% chance to spawn coin in another lane
        if (Math.random() < 0.3) {
            let coinLane = Math.floor(Math.random() * 3);
            if (coinLane === lane) coinLane = (lane + 1) % 3;

            coinsRef.current.push({
                x: 0,
                y: -150, // Slightly higher/further
                width: 30,
                height: 30,
                lane: coinLane,
                collected: false,
            });
        }
    };

    const gameLoop = () => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // Update Physics
        const player = playerRef.current;

        // Horizontal Movement (Lerp for smoothness)
        const targetX = LANE_CENTERS[player.lane];
        player.x += (targetX - player.x) * 0.2;

        // Vertical Movement (Jump)
        player.y += player.vy;
        if (player.y < player.groundY) {
            player.vy += GRAVITY;
        } else {
            player.y = player.groundY;
            player.vy = 0;
            player.isJumping = false;
        }

        // Spawning
        frameRef.current++;
        // Spawn faster as speed increases
        const spawnRate = Math.max(30, 100 - Math.floor(speedRef.current * 2));
        if (frameRef.current % spawnRate === 0) {
            spawnObstacle();
        }

        // Move Obstacles & Coins
        speedRef.current += 0.002; // Gradually increase speed

        obstaclesRef.current.forEach(obs => {
            obs.y += speedRef.current;
            obs.x = LANE_CENTERS[obs.lane]; // Follow lane
        });

        coinsRef.current.forEach(coin => {
            coin.y += speedRef.current;
            coin.x = LANE_CENTERS[coin.lane];
        });

        // Cleanup off-screen
        obstaclesRef.current = obstaclesRef.current.filter(obs => obs.y < CANVAS_HEIGHT + 100);
        coinsRef.current = coinsRef.current.filter(coin => coin.y < CANVAS_HEIGHT + 100);

        // Collision Detection
        let collision = false;
        const playerRect = {
            l: player.x - player.width / 2 + 10,  // Hitbox adjustment
            r: player.x + player.width / 2 - 10,
            t: player.y - player.height / 2 + 10,
            b: player.y + player.height / 2 - 5
        };

        for (const obs of obstaclesRef.current) {
            // Simple AABB
            const obsRect = {
                l: obs.x - obs.width / 2,
                r: obs.x + obs.width / 2,
                t: obs.y - obs.height / 2,
                b: obs.y + obs.height / 2
            };

            const isColliding =
                playerRect.l < obsRect.r &&
                playerRect.r > obsRect.l &&
                playerRect.t < obsRect.b &&
                playerRect.b > obsRect.t;

            if (isColliding) {
                collision = true;
                break;
            }
        }

        // Coin Collection
        coinsRef.current.forEach(coin => {
            if (coin.collected) return;
            const coinRect = {
                l: coin.x - coin.width / 2,
                r: coin.x + coin.width / 2,
                t: coin.y - coin.height / 2,
                b: coin.y + coin.height / 2
            };
            const isColliding =
                playerRect.l < coinRect.r &&
                playerRect.r > coinRect.l &&
                playerRect.t < coinRect.b &&
                playerRect.b > coinRect.t;

            if (isColliding) {
                coin.collected = true;
                setCoinsCollected(prev => prev + 1);
                scoreRef.current += 50;
            }
        });

        // Update Score (Distance)
        scoreRef.current += speedRef.current * 0.1;
        setScore(Math.floor(scoreRef.current));

        if (collision) {
            setGameOver(true);
            setGameStarted(false);
            return; // Stop Loop
        }

        // Draw
        // Background
        ctx.fillStyle = BG_COLOR;
        ctx.fillRect(0, 0, TOTAL_WIDTH, CANVAS_HEIGHT);

        // Lanes
        ctx.strokeStyle = LANE_COLOR;
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 1; i < 3; i++) {
            ctx.moveTo(i * LANE_WIDTH, 0);
            ctx.lineTo(i * LANE_WIDTH, CANVAS_HEIGHT);
        }
        ctx.stroke();

        // Player
        ctx.fillStyle = PLAYER_COLOR;
        ctx.shadowBlur = 10;
        ctx.shadowColor = PLAYER_COLOR;
        ctx.fillRect(
            player.x - player.width / 2,
            player.y - player.height / 2,
            player.width,
            player.height
        );
        ctx.shadowBlur = 0;

        // Obstacles
        obstaclesRef.current.forEach(obs => {
            ctx.fillStyle = OBSTACLE_COLOR;
            if (obs.type === 'rug') {
                ctx.fillRect(
                    obs.x - obs.width / 2,
                    obs.y - obs.height / 2,
                    obs.width,
                    obs.height
                );
                // "RUG" Text
                ctx.fillStyle = 'white';
                ctx.font = '10px Arial';
                ctx.fillText("RUG", obs.x - 10, obs.y);

            } else {
                ctx.fillRect(
                    obs.x - obs.width / 2,
                    obs.y - obs.height / 2,
                    obs.width,
                    obs.height
                );
            }
        });

        // Coins
        coinsRef.current.forEach(coin => {
            if (coin.collected) return;
            ctx.fillStyle = COIN_COLOR;
            ctx.beginPath();
            ctx.arc(coin.x, coin.y, coin.width / 2, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'black';
            ctx.font = '12px Arial';
            ctx.fillText("₿", coin.x - 4, coin.y + 4);
        });

        loopRef.current = requestAnimationFrame(gameLoop);
    };

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [gameStarted, gameOver]);

    // Save Score Logic
    const submitScore = async () => {
        if (!window.ethereum) return alert("Install Coinbase Wallet or MetaMask");
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            // Using a placeholder address or env var. 
            // In a real app we'd fetch this from a config or context.
            // Using the one from the prompt context if available or generic placeholder.
            const CONTRACT_ADDRESS = "0xYourGameHubContractAddressHere";
            const GAME_ID = 1001; // ID for BaseStreetRun

            const contract = new ethers.Contract(
                CONTRACT_ADDRESS,
                ["function submitScore(uint256,uint256) external"],
                signer
            );

            const tx = await contract.submitScore(GAME_ID, score);
            await tx.wait();
            setSaved(true);
            alert("Score saved on-chain!");
        } catch (err) {
            console.error(err);
            alert("Failed to save score.");
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.statusPanel}>
                <div className={styles.stat}>Score: {score}</div>
                <div className={styles.stat}>Coins: {coinsCollected}</div>
            </div>

            <div style={{ position: 'relative', width: TOTAL_WIDTH, height: CANVAS_HEIGHT, margin: '0 auto', background: '#333', borderRadius: '8px', overflow: 'hidden' }}>
                <canvas
                    ref={canvasRef}
                    width={TOTAL_WIDTH}
                    height={CANVAS_HEIGHT}
                    className="cursor-none"
                    style={{ display: 'block' }}
                />

                {!gameStarted && !gameOver && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: 'white',
                        zIndex: 10
                    }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#fff' }}>BASE STREET RUN</h2>
                        <p>Press SPACE to Start</p>
                        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem', color: '#d1d5db' }}>Arrows/WASD to Move & Jump</p>
                    </div>
                )}

                {gameOver && (
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        color: 'white',
                        zIndex: 10
                    }}>
                        <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ef4444', marginBottom: '0.5rem' }}>GAME OVER</h2>
                        <p style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Final Score: {score}</p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={startGame}
                                className={styles.primaryBtn}
                            >
                                Play Again
                            </button>
                            {!saved && (
                                <button
                                    onClick={submitScore}
                                    className={styles.secondaryBtn}
                                >
                                    Save On-Chain
                                </button>
                            )}
                        </div>
                        {saved && <p style={{ color: '#4ade80', marginTop: '0.5rem' }}>Score Saved!</p>}
                    </div>
                )}
            </div>

            <p className={styles.instructions} style={{ marginTop: '1rem', textAlign: 'center' }}>
                Avoid the Rugs! Collect the Base Coins!
            </p>
        </div>
    );
}
