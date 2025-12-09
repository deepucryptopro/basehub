'use client';

import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import styles from './GameStyles.module.css';
import Image from 'next/image';

export default function Mafia() {
    const [playerHP, setPlayerHP] = useState(100);
    const [enemyHP, setEnemyHP] = useState(100);
    const [round, setRound] = useState(1);
    const [log, setLog] = useState<string[]>(['Enforcer appeared! Fight!']);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [saved, setSaved] = useState(false);

    // Animation states
    const [playerShake, setPlayerShake] = useState(false);
    const [enemyShake, setEnemyShake] = useState(false);
    const [flash, setFlash] = useState(false);

    // Reset animations
    useEffect(() => {
        if (playerShake) setTimeout(() => setPlayerShake(false), 500);
        if (enemyShake) setTimeout(() => setEnemyShake(false), 500);
        if (flash) setTimeout(() => setFlash(false), 200);
    }, [playerShake, enemyShake, flash]);

    const playerAction = (type: 'attack' | 'block' | 'dirty') => {
        if (gameOver) return;

        let playerDmg = 0;
        let defense = 0;
        let logMsg = '';

        // Player Turn
        if (type === 'attack') {
            playerDmg = Math.floor(Math.random() * 15) + 5; // 5-20
            logMsg = `You attacked for ${playerDmg} dmg.`;
            setEnemyShake(true);
            setFlash(true);
        } else if (type === 'block') {
            defense = 0.5; // 50% reduction
            logMsg = `You blocked.`;
        } else if (type === 'dirty') {
            playerDmg = Math.floor(Math.random() * 25); // 0-25 (risky)
            logMsg = `Dirty trick! ${playerDmg} dmg.`;
            if (playerDmg > 10) { setEnemyShake(true); setFlash(true); }
        }

        // Enemy Turn
        const enemyDmgRaw = Math.floor(Math.random() * 12) + 8; // 8-20
        const enemyDmg = Math.floor(enemyDmgRaw * (1 - defense));

        // Resolve
        const newEnemyHP = Math.max(0, enemyHP - playerDmg);
        const newPlayerHP = Math.max(0, playerHP - enemyDmg);

        if (enemyDmg > 0) setPlayerShake(true);

        setEnemyHP(newEnemyHP);
        setPlayerHP(newPlayerHP);
        setLog(prev => [`R${round}: ${logMsg}`, ...prev].slice(0, 4)); // Keep last 4

        if (newEnemyHP <= 0) {
            setGameOver(true);
            setWon(true);
            setLog(prev => ['Enemy Defeated! You own the block.', ...prev]);
        } else if (newPlayerHP <= 0) {
            setGameOver(true);
            setWon(false);
            setLog(prev => ['You were wasted.', ...prev]);
        } else {
            setRound(r => r + 1);
        }
    };

    const reset = () => {
        setPlayerHP(100);
        setEnemyHP(100);
        setRound(1);
        setLog(['New adversary approaches...']);
        setGameOver(false);
        setSaved(false);
    };

    const saveScore = async () => {
        if (!window.ethereum) return alert('No Wallet');
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const score = Math.max(0, playerHP);
            // Using demo contract address or environment variable in real app
            const contract = new ethers.Contract("YOUR_CONTRACT", ["function submitScore(uint256,uint256) external"], signer);
            await contract.submitScore(401, score);
            setSaved(true);
        } catch (e) { console.error(e); alert('Error saving'); }
    };

    return (
        <div className={styles.container}>
            <div className={styles.arena}>
                {/* Player Side */}
                <div className={`${styles.fighter} ${playerShake ? styles.shake : ''}`}>
                    <div className={styles.avatarFrame} style={{ borderColor: '#38bdf8' }}>
                        <Image src="/images/player.png" alt="Player" width={100} height={100} className={styles.avatarImg} />
                    </div>
                    <div className={styles.hpBarContainer}>
                        <div className={styles.hpFill} style={{ width: `${playerHP}%`, background: '#38bdf8' }} />
                    </div>
                    <span className={styles.fighterName}>YOU</span>
                </div>

                <div className={styles.vs}>VS</div>

                {/* Enemy Side */}
                <div className={`${styles.fighter} ${enemyShake ? styles.shake : ''}`}>
                    <div className={styles.avatarFrame} style={{ borderColor: '#f87171' }}>
                        <Image src="/images/boss.png" alt="Boss" width={100} height={100} className={styles.avatarImg} />
                    </div>
                    <div className={styles.hpBarContainer}>
                        <div className={styles.hpFill} style={{ width: `${enemyHP}%`, background: '#f87171' }} />
                    </div>
                    <span className={styles.fighterName}>BOSS</span>
                </div>

                {flash && <div className={styles.flashOverlay} />}
            </div>

            <div className={styles.logBox}>
                {log.map((l, i) => <div key={i} className={i === 0 ? styles.newLog : ''}>{l}</div>)}
            </div>

            {!gameOver ? (
                <div className={styles.controls}>
                    <button onClick={() => playerAction('attack')} className={`${styles.actionBtn} ${styles.atkBtn}`}>
                        👊 Attack
                    </button>
                    <button onClick={() => playerAction('block')} className={styles.actionBtn}>
                        🛡️ Block
                    </button>
                    <button onClick={() => playerAction('dirty')} className={`${styles.actionBtn} ${styles.dirtyBtn}`}>
                        🗡️ Dirty
                    </button>
                </div>
            ) : (
                <div className={styles.result}>
                    <h2>{won ? 'VICTORY' : 'DEFEAT'}</h2>
                    {won && !saved && <button onClick={saveScore} className={styles.secondaryBtn}>Claim Turf</button>}
                    {saved && <span className={styles.success}>Turf Claimed!</span>}
                    <button onClick={reset} className={styles.primaryBtn} style={{ marginTop: '1rem' }}>Next Fight</button>
                </div>
            )}
        </div>
    );
}
