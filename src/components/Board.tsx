import { useState, useEffect, useRef } from 'react';
import { useGame } from '../context/GameContext';
import Dice from './Dice';
import styles from './Board.module.css';

/* =========================================================
   CONNECTED GRID PATH GENERATION
   Creates a snaking path where tiles touch each other.
   ========================================================= */
function generateConnectedPath(
    totalTiles: number,
    width: number,
    tileSize: number,
    rowGap: number
): { x: number; y: number; isEdge: boolean; side: 'left' | 'right' | 'none' }[] {
    const positions: { x: number; y: number; isEdge: boolean; side: 'left' | 'right' | 'none' }[] = [];
    const padding = 40;
    const usableWidth = width - padding * 2;
    const tilesPerRow = Math.floor(usableWidth / tileSize);
    const startY = 60;

    for (let i = 0; i < totalTiles; i++) {
        const row = Math.floor(i / tilesPerRow);
        const col = i % tilesPerRow;
        const isReversed = row % 2 === 1;

        // Current column index in the visual direction
        const visualCol = isReversed ? (tilesPerRow - 1 - col) : col;
        
        const x = padding + (visualCol * tileSize) + (tileSize / 2);
        const y = startY + (row * (tileSize + rowGap)) + (tileSize / 2);

        // Meta info for connecting curves/visuals
        const isEdge = col === 0 || col === tilesPerRow - 1;
        let side: 'left' | 'right' | 'none' = 'none';
        if (col === 0) side = isReversed ? 'right' : 'left';
        if (col === tilesPerRow - 1) side = isReversed ? 'left' : 'right';

        positions.push({ x, y, isEdge, side });
    }

    return positions;
}

/* =========================================================
   BOARD COMPONENT
   ========================================================= */
export default function Board() {
    const { tiles, players } = useGame();
    const containerRef = useRef<HTMLDivElement>(null);
    const [dimensions, setDimensions] = useState({ width: 850, height: 600 });
    const tileSize = 70; // Larger tiles that touch
    const rowGap = 25;   // Space between rows for the "turn"

    useEffect(() => {
        if (!containerRef.current) return;
        const update = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                setDimensions({ width: rect.width, height: 800 });
            }
        };
        const observer = new ResizeObserver(update);
        observer.observe(containerRef.current);
        update();
        return () => observer.disconnect();
    }, []);

    const positions = generateConnectedPath(tiles.length, dimensions.width, tileSize, rowGap);
    const maxY = positions.length > 0 ? Math.max(...positions.map(p => p.y)) + 100 : 600;

    return (
        <div className={styles.boardWrapper}>
            <div 
                className={styles.boardContainer} 
                ref={containerRef} 
                style={{ height: `${maxY}px` }}
            >
                {/* 🌳 Garden Background */}
                <div className={styles.gardenBg} />
                
                {/* ☁️ Animated Clouds */}
                <div className={styles.clouds}>
                    <div className={`${styles.cloud} ${styles.cloud1}`} />
                    <div className={`${styles.cloud} ${styles.cloud2}`} />
                </div>

                {/* 🔳 Connected Tiles Grid */}
                <div className={styles.tilesLayer}>
                    {tiles.map((tile, i) => {
                        const pos = positions[i];
                        if (!pos) return null;

                        const playersHere = players.filter(p => p.currentPosition === i);
                        const isStart = tile.type === 'Start';
                        const isFinish = tile.type === 'Finish';

                        // Check if we need a vertical connector to the next row
                        const isLastInRow = (i + 1) % Math.floor((dimensions.width - 80) / tileSize) === 0;
                        const hasNextInRow = (i + 1) < tiles.length && (i + 1) % Math.floor((dimensions.width - 80) / tileSize) !== 0;

                        return (
                            <div
                                key={tile.position}
                                className={`
                                    ${styles.gardenTile} 
                                    ${styles['type-' + tile.type]}
                                    ${isStart ? styles.tileStart : ''}
                                    ${isFinish ? styles.tileFinish : ''}
                                    ${hasNextInRow ? styles.hasRightNeighbor : ''}
                                `}
                                style={{
                                    left: `${pos.x}px`,
                                    top: `${pos.y}px`,
                                    width: `${tileSize}px`,
                                    height: `${tileSize}px`,
                                }}
                            >
                                <span className={styles.tileNumber}>{i + 1}</span>
                                
                                <div className={styles.tileInner}>
                                    {tile.type === 'Red' && <span className={styles.tileIcon}>⚡</span>}
                                    {tile.type === 'Green' && <span className={styles.tileIcon}>🐝</span>}
                                    {tile.type === 'Blue' && <span className={styles.tileIcon}>💎</span>}
                                    {tile.type === 'Yellow' && <span className={styles.tileIcon}>❓</span>}
                                    {isStart && <span className={styles.tileIcon}>🏁</span>}
                                    {isFinish && <span className={styles.tileIcon}>🏆</span>}
                                </div>

                                {/* 🔗 Vertical Turn Connector */}
                                {isLastInRow && (i + 1) < tiles.length && (
                                    <div className={styles.rowConnector} style={{ height: `${rowGap + 10}px` }} />
                                )}

                                {/* ♟️ Players */}
                                {playersHere.length > 0 && (
                                    <div className={styles.pawnContainer}>
                                        {playersHere.map(p => (
                                            <div
                                                key={p.id}
                                                className={styles.pawn}
                                                style={{ '--pawn-color': p.color } as React.CSSProperties}
                                                title={p.name}
                                            >
                                                <div className={styles.pawnBody} />
                                                <div className={styles.pawnHead}>
                                                    {p.avatar && <span className={styles.pawnFace}>{p.avatar}</span>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 🎲 Dice Area */}
            <div className={styles.diceArea}>
                <Dice />
            </div>
        </div>
    );
}
