import type { Tile, TileType } from '../types';

export class BoardEngine {
    private tiles: Tile[] = [];

    constructor(size: number = 36) {
        this.tiles = this.generateTiles(size);
    }

    private generateTiles(size: number): Tile[] {
        const tiles: Tile[] = [];
        const specialTileCounts = {
            'Green': 10,
            'Red': 10,
            'Yellow': 9,
            'Blue': 5
        };

        const scatterPool: TileType[] = [];
        Object.entries(specialTileCounts).forEach(([type, count]) => {
            for (let i = 0; i < count; i++) scatterPool.push(type as TileType);
        });

        // Shuffle
        for (let i = scatterPool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [scatterPool[i], scatterPool[j]] = [scatterPool[j], scatterPool[i]];
        }

        for (let i = 0; i < size; i++) {
            if (i === 0) {
                tiles.push({ position: i, type: 'Start' });
                continue;
            }
            if (i === size - 1) {
                tiles.push({ position: i, type: 'Finish' });
                continue;
            }
            const type = scatterPool.pop() || 'Green';
            tiles.push({ position: i, type });
        }
        return tiles;
    }

    public getTiles(): Tile[] {
        return this.tiles;
    }

    public getTileAt(position: number): Tile | undefined {
        return this.tiles.find(t => t.position === position);
    }

    public calculateNewPosition(current: number, steps: number, max: number = 35): number {
        return Math.min(max, current + steps);
    }
}
