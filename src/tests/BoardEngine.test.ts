import { describe, it, expect } from 'vitest';
import { BoardEngine } from '../core/game/BoardEngine';

describe('BoardEngine', () => {
    it('generates a board with 36 tiles by default', () => {
        const board = new BoardEngine();
        expect(board.getTiles()).toHaveLength(36);
    });

    it('has Start as the first tile and Finish as the last tile', () => {
        const board = new BoardEngine(20);
        const tiles = board.getTiles();
        
        expect(tiles[0].type).toBe('Start');
        expect(tiles[0].position).toBe(0);
        
        expect(tiles[19].type).toBe('Finish');
        expect(tiles[19].position).toBe(19);
    });

    it('returns undefined for out of bounds positions', () => {
        const board = new BoardEngine(15);
        expect(board.getTileAt(15)).toBeUndefined();
    });

    it('calculates the correct new position within bounds', () => {
        const board = new BoardEngine();
        const nextPos = board.calculateNewPosition(30, 6, 35);
        expect(nextPos).toBe(35); // capped at max
    });
    
    it('calculates position normally if not exceeding max', () => {
        const board = new BoardEngine();
        const nextPos = board.calculateNewPosition(5, 3, 35);
        expect(nextPos).toBe(8);
    });
});
