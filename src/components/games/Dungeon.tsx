'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import styles from './GameStyles.module.css';

export default function Dungeon() {
    const [level, setLevel] = useState(1);
    const [gameOver, setGameOver] = useState(false);
    const [message, setMessage] = useState('Three doors stand before you...');
    const [saved, setSaved] = useState(false);

    const chooseDoor = (doorIndex: number) => {
        if (gameOver) return;

        // Logic: 1 = Trap, 2 = Empty, 3 = Treasure (Next Level)
        // Randomized each time
        const rand = Math.random();

        // 33% Trap (GameOver), 66% Safe (Advance) for simplicity in "Light" version
        // Or Trap/Nothing/Exit. 
        // Let's do: 30% Trap, 70% Advance for fun
        if (rand < 0.3) {
            setGameOver(true);
            setMessage(`Door ${doorIndex + 1} was trapped! You fell into a pit.`);
        } else {
            setLevel(l => l + 1);
            setMessage(`Door ${doorIndex + 1} was safe. You perform deep exploration.`);
        }
    };

    const restart = () => {
        setLevel(1);
        setGameOver(false);
        setMessage('Three doors stand before you...');
        setSaved(false);
    };

    const saveScore = async () => {
        if (!window.ethereum) return alert('No Wallet');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract("YOUR_CONTRACT", ["function submitScore(uint256,uint256) external"], signer);
            await contract.submitScore(501, level * 100);
            setSaved(true);
        } catch (e) { console.error(e); alert('Error saving'); }
    };

    return (
        <div className={styles.container}>
            <div className={styles.statusPanel}>
                <div className={styles.stat}>Dungeon Depth: Level {level}</div>
            </div>

            <div className={styles.gameDisplay} style={{ height: 150 }}>
                <p className={styles.message}>{message}</p>
            </div>

            {!gameOver ? (
                <div className={styles.controls} style={{ marginTop: '2rem' }}>
                    {[0, 1, 2].map(i => (
                        <button key={i} onClick={() => chooseDoor(i)} className={styles.actionBtn} style={{ fontSize: '2rem' }}>
                            🚪 {i + 1}
                        </button>
                    ))}
                </div>
            ) : (
                <div className={styles.result}>
                    <h2>GAME OVER</h2>
                    <p>Reached Level {level}</p>
                    {!saved && <button onClick={saveScore} className={styles.secondaryBtn}>Engrave Score</button>}
                    {saved && <span className={styles.success}>Engraved!</span>}
                    <button onClick={restart} className={styles.primaryBtn} style={{ marginTop: '1rem' }}>Enter Again</button>
                </div>
            )}
        </div>
    );
}
