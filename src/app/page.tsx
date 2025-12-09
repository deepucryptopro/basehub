import Link from 'next/link';
import { games } from '@/config/gamesConfig';
import styles from './page.module.css';

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <h1 className="text-gradient" style={{ fontSize: '3rem', fontWeight: 'bold' }}>
          Base Play Hub
        </h1>
        <p>The ultimate decentralized gaming platform on Base.</p>
      </div>

      <div className={styles.grid}>
        {games.map((game) => (
          <Link
            href={`/game/${game.slug}`}
            key={game.id}
            className={`${styles.card} glass-panel`}
          >
            <h2>
              {game.name} <span>-&gt;</span>
            </h2>
            <p>{game.description}</p>
            <div className={styles.status}>
              <span className={`${styles.badge} ${game.status === 'active' ? styles.active : styles.pamy}`}>
                {game.status.replace('_', ' ')}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
