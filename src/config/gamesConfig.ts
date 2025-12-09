export interface Game {
    id: string;
    slug: string;
    name: string;
    description: string;
    status: 'active' | 'coming_soon' | 'maintenance';
}

export const games: Game[] = [
    {
        id: 'base-street-run',
        slug: 'runner',
        name: 'Base Street Run',
        description: 'Dodge obstacles and collect coins in this crypto-themed endless runner.',
        status: 'active',
    },
];
