'use client';

import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import styles from './GameStyles.module.css'; // Shared styles

export default function Survival() {
    const [health, setHealth] = useState(100);
    const [score, setScore] = useState(0); // Seconds survived
    const [gameOver, setGameOver] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [message, setMessage] = useState('Survive as long as you can!');
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        if (!isPlaying || gameOver) return;

        const timer = setInterval(() => {
            setScore(s => s + 1);
            setHealth(h => Math.max(0, h - 2)); // Drain 2 health per second
        }, 1000);

        return () => clearInterval(timer);
    }, [isPlaying, gameOver]);

    useEffect(() => {
        if (health <= 0 && isPlaying) {
            setGameOver(true);
            setIsPlaying(false);
            setMessage(`You died! Survived for ${score} seconds.`);
        }
    }, [health, isPlaying, score]);

    const startGame = () => {
        setHealth(100);
        setScore(0);
        setGameOver(false);
        setIsPlaying(true);
        setMessage('Health is dropping! Find food!');
        setSaved(false);
    };

    const forage = () => {
        if (!isPlaying) return;
        const luck = Math.random();
        if (luck > 0.7) {
            setHealth(h => Math.min(100, h + 15));
            setMessage('Found an apple! (+15 HP)');
        } else if (luck > 0.3) {
            setHealth(h => Math.min(100, h + 5));
            setMessage('Found some berries. (+5 HP)');
        } else {
            setHealth(h => Math.max(0, h - 10));
            setMessage('Ate a poisonous mushroom! (-10 HP)');
        }
    };

    const saveScore = async () => {
        if (!window.ethereum) return alert('No Wallet');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            // Demo address
            const contract = new ethers.Contract("YOUR_CONTRACT", ["function submitScore(uint256,uint256) external"], signer);
            await contract.submitScore(201, score);
            setSaved(true);
        } catch (e) { console.error(e); alert('Error saving'); }
    };

    return (
        <div className={styles.container}>
            <div className={styles.statusPanel}>
                <div className={styles.stat}>HP: {health}%</div>
                <div className={styles.stat}>Time: {score}s</div>
            </div>

            <div className={styles.gameDisplay}>
                <div className={styles.healthBar}>
                    <div className={styles.healthFill} style={{ width: `${health}%`, background: health < 30 ? 'red' : '#4ade80' }} />
                </div>
                <p className={styles.message}>{message}</p>
            </div>

            <div className={styles.controls}>
                {!isPlaying ? (
                    <button onClick={startGame} className={styles.primaryBtn}>{gameOver ? 'Try Again' : 'Start Survival'}</button>
                ) : (
                    <button onClick={forage} className={styles.actionBtn}>Forage for Food</button>
                )}
            </div>

            {gameOver && (
                <div className={styles.result}>
                    <p>Score: {score}</p>
                    {!saved && <button onClick={saveScore} className={styles.secondaryBtn}>Save Score</button>}
                    {saved && <span className={styles.success}>Saved!</span>}
                </div>
            )}
        </div>
    );
}
