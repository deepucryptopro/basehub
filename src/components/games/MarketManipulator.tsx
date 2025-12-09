'use client';

import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import styles from './MarketManipulator.module.css';

const GAME_DURATION = 30; // seconds
const TICK_RATE = 100; // ms

export default function MarketManipulator() {
    const [isPlaying, setIsPlaying] = useState(false);
    const [width, setWidth] = useState(600);
    const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
    const [price, setPrice] = useState(100);
    const [priceHistory, setPriceHistory] = useState<number[]>([]);
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [saved, setSaved] = useState(false);

    // Manipulators
    const [bias, setBias] = useState(0); // Positive = upwards, Negative = downwards
    const [freeze, setFreeze] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current) {
            setWidth(containerRef.current.offsetWidth);
        }
        const handleResize = () => {
            if (containerRef.current) {
                setWidth(containerRef.current.offsetWidth);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isPlaying || gameOver) return;

        const interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 0.1) {
                    endGame();
                    return 0;
                }
                return prev - 0.1;
            });

            if (!freeze) {
                setPrice((prev) => {
                    const volatility = (Math.random() - 0.5) * 5; // -2.5 to +2.5
                    const trend = bias * 2;
                    let newPrice = prev + volatility + trend;
                    if (newPrice < 10) newPrice = 10; // Floor
                    return newPrice;
                });
            }

            setPriceHistory((prev) => [...prev, price]);
        }, TICK_RATE);

        return () => clearInterval(interval);
    }, [isPlaying, gameOver, freeze, bias, price]);

    // Decay bias
    useEffect(() => {
        if (bias === 0) return;
        const timeout = setTimeout(() => setBias(0), 2000);
        return () => clearTimeout(timeout);
    }, [bias]);

    // Decay freeze
    useEffect(() => {
        if (!freeze) return;
        const timeout = setTimeout(() => setFreeze(false), 2000);
        return () => clearTimeout(timeout);
    }, [freeze]);

    const startGame = () => {
        setIsPlaying(true);
        setGameOver(false);
        setTimeLeft(GAME_DURATION);
        setPrice(100);
        setPriceHistory([100]);
        setBias(0);
        setFreeze(false);
        setSaved(false);
    };

    const endGame = () => {
        setIsPlaying(false);
        setGameOver(true);
        // Score based on final price
        setScore(Math.floor(price));
    };

    const handlePump = () => {
        if (!isPlaying || freeze) return;
        setBias(2); // Strong upward bias
        setPrice((p) => p + 10); // Instant jump
    };

    const handleDump = () => {
        if (!isPlaying || freeze) return;
        setBias(-2); // Strong downward bias
        setPrice((p) => p - 10); // Instant drop
    };

    const handleFreeze = () => {
        if (!isPlaying) return;
        setFreeze(true);
    };

    const saveScore = async () => {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // TODO: Replace with deployed address
            const contractAddress = "YOUR_CONTRACT_ADDRESS_HERE";
            const abi = [
                "function submitScore(uint256 gameId, uint256 score) external"
            ];
            const contract = new ethers.Contract(contractAddress, abi, signer);

            // Game ID for market is 0 (or hash of 'market', needs to match contract)
            // For simplicity let's use 101 for market
            const tx = await contract.submitScore(101, score);
            await tx.wait();
            setSaved(true);
            alert('Score Saved!');
        } catch (err) {
            console.error(err);
            alert('Failed to save score. Check console.');
        }
    };

    // SVG Chart Logic
    const maxPrice = Math.max(...priceHistory, 150);
    const minPrice = Math.min(...priceHistory, 50);
    const range = maxPrice - minPrice || 100;

    const points = priceHistory.map((p, i) => {
        const x = (i / ((GAME_DURATION * 1000) / TICK_RATE)) * width;
        const y = 300 - ((p - minPrice) / range) * 300; // 300px height
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className={styles.container} ref={containerRef}>
            <div className={styles.header}>
                <div className={styles.stat}>
                    <span className={styles.label}>Est. Value</span>
                    <span className={styles.value}>${price.toFixed(2)}</span>
                </div>
                <div className={styles.stat}>
                    <span className={styles.label}>Time</span>
                    <span className={`${styles.value} ${timeLeft < 10 ? styles.dange : ''}`}>
                        {timeLeft.toFixed(1)}s
                    </span>
                </div>
            </div>

            <div className={`${styles.chart} glass-panel`}>
                <svg width="100%" height="100%" viewBox={`0 0 ${width} 300`} preserveAspectRatio="none">
                    <polyline
                        fill="none"
                        stroke={price > 100 ? '#4ade80' : '#f87171'}
                        strokeWidth="3"
                        points={points}
                    />
                </svg>
                {freeze && <div className={styles.freezeOverlay}>FROZEN</div>}
            </div>

            <div className={styles.controls}>
                {!isPlaying ? (
                    <button onClick={startGame} className={styles.startButton}>
                        {gameOver ? 'Play Again' : 'Start Trading'}
                    </button>
                ) : (
                    <>
                        <button onClick={handlePump} className={`${styles.actionBtn} ${styles.pump}`}>
                            PUMP IT
                        </button>
                        <button onClick={handleFreeze} className={`${styles.actionBtn} ${styles.freeze}`} disabled={freeze}>
                            FREEZE
                        </button>
                        <button onClick={handleDump} className={`${styles.actionBtn} ${styles.dump}`}>
                            DUMP IT
                        </button>
                    </>
                )}
            </div>

            {gameOver && (
                <div className={styles.result}>
                    <h2>Market Closed</h2>
                    <p>Final Valuation: ${score}</p>
                    {!saved ? (
                        <button onClick={saveScore} className={styles.saveBtn}>
                            Save Score On-Chain
                        </button>
                    ) : (
                        <p className={styles.savedText}>Score Saved!</p>
                    )}
                </div>
            )}
        </div>
    );
}
