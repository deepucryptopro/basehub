import { games } from '@/config/gamesConfig';
import { notFound } from 'next/navigation';
import styles from './page.module.css';
import Link from 'next/link';
import BaseStreetRun from '@/components/games/BaseStreetRun';

interface Props {
    params: Promise<{
        slug: string;
    }>;
}

export function generateStaticParams() {
    return games.map((game) => ({
        slug: game.slug,
    }));
}

export default async function GamePage({ params }: Props) {
    const { slug } = await params;
    const game = games.find((g) => g.slug === slug);

    if (!game) {
        notFound();
    }

    const renderGame = () => {
        switch (game.id) {
            case 'base-street-run': return <BaseStreetRun />;
            default: return (
                <div className={styles.placeholder}>
                    <p>Coming Soon...</p>
                </div>
            );
        }
    };

    return (
        <div className={styles.container}>
            <Link href="/" className={styles.backLink}>
                &larr; Back to Hub
            </Link>

            <div className={`glass-panel ${styles.gameCard}`}>
                <h1 className="text-gradient" style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
                    {game.name}
                </h1>
                <p className={styles.description}>{game.description}</p>

                <div className={styles.gameArea}>
                    {renderGame()}
                </div>
            </div>
        </div>
    );
}
