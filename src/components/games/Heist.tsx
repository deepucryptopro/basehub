'use client';

import { useState } from 'react';
import { ethers } from 'ethers';
import styles from './GameStyles.module.css';

const STEPS = [
    {
        name: 'Entry', choices: [
            { label: 'Sneak in Back', risk: 0.3, reward: 10 },
            { label: 'Bribe Guard', risk: 0.1, reward: 5 }, // Costly but safe
            { label: 'Front Door Blast', risk: 0.8, reward: 50 }
        ]
    },
    {
        name: 'The Vault', choices: [
            { label: 'Crack Safe', risk: 0.5, reward: 100 },
            { label: 'Grab Loose Cash', risk: 0.1, reward: 20 },
            { label: 'Hack Terminal', risk: 0.4, reward: 60 }
        ]
    },
    {
        name: 'Escape', choices: [
            { label: 'Helicopter', risk: 0.6, reward: 50 },
            { label: 'Sewer Run', risk: 0.2, reward: 10 },
            { label: 'Blend in Crowd', risk: 0.4, reward: 30 }
        ]
    }
];

export default function Heist() {
    const [step, setStep] = useState(0); // 0, 1, 2
    const [score, setScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [log, setLog] = useState<string[]>([]);
    const [saved, setSaved] = useState(false);
    const [started, setStarted] = useState(false);

    const startGame = () => {
        setStep(0);
        setScore(0);
        setGameOver(false);
        setWon(false);
        setLog(['Mission Started. Choose your entry.']);
        setSaved(false);
        setStarted(true);
    };

    const makeChoice = (choice: any) => {
        if (Math.random() > choice.risk) {
            // Success
            const newScore = score + choice.reward;
            setScore(newScore);
            setLog(prev => [...prev, `SUCCESS: ${choice.label} worked! (+${choice.reward})`]);

            if (step < 2) {
                setStep(s => s + 1);
            } else {
                setGameOver(true);
                setWon(true);
                setLog(prev => [...prev, 'MISSION ACCOMPLISHED!']);
            }
        } else {
            // Fail
            setGameOver(true);
            setLog(prev => [...prev, `FAILED: ${choice.label} went wrong. BUSTED.`]);
        }
    };

    const saveScore = async () => {
        if (!window.ethereum) return alert('No Wallet');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract("YOUR_CONTRACT", ["function submitScore(uint256,uint256) external"], signer);
            await contract.submitScore(301, score);
            setSaved(true);
        } catch (e) { console.error(e); alert('Error saving'); }
    };

    if (!started) return (
        <div className={styles.container}>
            <p className={styles.message}>Heist Mission provided by The Agency.</p>
            <button onClick={startGame} className={styles.primaryBtn}>Accept Mission</button>
        </div>
    );

    return (
        <div className={styles.container}>
            <div className={styles.statusPanel}>
                <div className={styles.stat}>Loot: ${score}k</div>
                <div className={styles.stat}>Phase: {gameOver ? 'DONE' : STEPS[step].name}</div>
            </div>

            <div className={styles.logBox}>
                {log.map((l, i) => <div key={i}>{l}</div>)}
            </div>

            {!gameOver && (
                <div className={styles.controls}>
                    {STEPS[step].choices.map((c, i) => (
                        <button key={i} onClick={() => makeChoice(c)} className={styles.actionBtn}>
                            {c.label} <span className={styles.subtext}>(Risk: {c.risk * 100}%)</span>
                        </button>
                    ))}
                </div>
            )}

            {gameOver && (
                <div className={styles.result}>
                    <h2>{won ? 'HEIST SUCCESSFUL' : 'HEIST FAILED'}</h2>
                    {won && !saved && <button onClick={saveScore} className={styles.secondaryBtn}>Secure Loot On-Chain</button>}
                    {saved && <span className={styles.success}>Loot Secured!</span>}
                    <button onClick={startGame} className={styles.primaryBtn} style={{ marginTop: '1rem' }}>Retry</button>
                </div>
            )}
        </div>
    );
}
