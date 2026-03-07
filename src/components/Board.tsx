import { useGame } from '../context/GameContext';
import styles from './Board.module.css';

export default function Board() {
    const { tiles, players } = useGame();

    const getTileColor = (tile: any) => {
        switch (tile.type) {
            case 'Green': return 'var(--color-green)';
            case 'Red': return 'var(--color-red)';
            case 'Yellow': return 'var(--color-yellow)';
            case 'Blue': return 'var(--color-blue)';
            case 'Start': return '#fff';
            case 'Finish': return '#FFD700'; // Gold
            default: return '#fff';
        }
    };

    const getTileSymbol = (type: string) => {
        switch (type) {
            case 'Green': return '+';
            case 'Red': return 'x';
            case 'Yellow': return '?';
            case 'Blue': return '★';
            case 'Start': return '🏁';
            case 'Finish': return '🏆';
            default: return '';
        }
    };

    // 8x8 Grid mapping with empty rows to create visual 'S' track space
    const getTileGridCoords = (index: number) => {
        if (index <= 7) return { row: 8, col: index + 1 };
        if (index === 8) return { row: 7, col: 8 };
        if (index >= 9 && index <= 16) return { row: 6, col: 8 - (index - 9) };
        if (index === 17) return { row: 5, col: 1 };
        if (index >= 18 && index <= 25) return { row: 4, col: (index - 18) + 1 };
        if (index === 26) return { row: 3, col: 8 };
        if (index >= 27 && index <= 34) return { row: 2, col: 8 - (index - 27) };
        if (index === 35) return { row: 1, col: 1 };
        return { row: 1, col: 1 };
    };

    const getTileStyles = (index: number) => {
        const coords = getTileGridCoords(index);
        const prevCoords = index > 0 ? getTileGridCoords(index - 1) : null;
        const nextCoords = index < 35 ? getTileGridCoords(index + 1) : null;

        const connectsLeft = (prevCoords?.row === coords.row && prevCoords?.col === coords.col - 1) || (nextCoords?.row === coords.row && nextCoords?.col === coords.col - 1);
        const connectsRight = (prevCoords?.row === coords.row && prevCoords?.col === coords.col + 1) || (nextCoords?.row === coords.row && nextCoords?.col === coords.col + 1);
        const connectsTop = (prevCoords?.col === coords.col && prevCoords?.row === coords.row - 1) || (nextCoords?.col === coords.col && nextCoords?.row === coords.row - 1);
        const connectsBottom = (prevCoords?.col === coords.col && prevCoords?.row === coords.row + 1) || (nextCoords?.col === coords.col && nextCoords?.row === coords.row + 1);

        const radius = '35px';
        const innerRadius = '15px';
        let borderTopLeftRadius = '0px';
        let borderTopRightRadius = '0px';
        let borderBottomRightRadius = '0px';
        let borderBottomLeftRadius = '0px';

        // Outer corners
        if (!connectsTop && !connectsLeft) borderTopLeftRadius = radius;
        if (!connectsTop && !connectsRight) borderTopRightRadius = radius;
        if (!connectsBottom && !connectsRight) borderBottomRightRadius = radius;
        if (!connectsBottom && !connectsLeft) borderBottomLeftRadius = radius;

        // Inner corners (elbows)
        if (connectsTop && connectsLeft) borderTopLeftRadius = innerRadius;
        if (connectsTop && connectsRight) borderTopRightRadius = innerRadius;
        if (connectsBottom && connectsRight) borderBottomRightRadius = innerRadius;
        if (connectsBottom && connectsLeft) borderBottomLeftRadius = innerRadius;

        // Start/End explicit caps
        if (index === 0) {
            borderTopLeftRadius = radius;
            borderBottomLeftRadius = radius;
        }

        if (index === 35) {
            borderTopLeftRadius = radius;
            borderTopRightRadius = radius;
            borderBottomRightRadius = radius;
        }

        return {
            gridRow: coords.row,
            gridColumn: coords.col,
            borderTopLeftRadius,
            borderTopRightRadius,
            borderBottomRightRadius,
            borderBottomLeftRadius
        };
    };

    const getDirectionArrow = (index: number) => {
        if (index === 35) return null;
        const coords = getTileGridCoords(index);
        const nextCoords = getTileGridCoords(index + 1);

        if (nextCoords.row < coords.row) return 'up';
        if (nextCoords.col > coords.col) return 'right';
        if (nextCoords.col < coords.col) return 'left';
        return null;
    };

    return (
        <div className={styles.boardWrapper}>
            <div className={styles.boardDecorations}>
                <div className={styles.startBanner}>INÍCIO ➔</div>
                <div className={styles.finishBanner}>CHEGADA</div>
            </div>

            <div className={styles.boardContainer}>
                <div className={styles.grid}>
                    {tiles.map((tile) => {
                        const playersOnTile = players.filter(p => p.currentPosition === tile.position);
                        const dynamicStyles = getTileStyles(tile.position);
                        const arrowDir = getDirectionArrow(tile.position);

                        return (
                            <div
                                key={tile.position}
                                className={styles.tile}
                                style={{
                                    ...dynamicStyles,
                                    backgroundColor: getTileColor(tile)
                                }}
                            >
                                <span className={styles.tileNumber}>{tile.position === 0 || tile.position === 35 ? '' : tile.position + 1}</span>
                                <span className={styles.tileSymbol}>{getTileSymbol(tile.type)}</span>

                                {arrowDir && (
                                    <div className={`${styles.arrow} ${styles['arrow-' + arrowDir]}`}>
                                        ➔
                                    </div>
                                )}

                                <div className={styles.playersArea}>
                                    {playersOnTile.map((p, pIdx) => (
                                        <div
                                            key={p.id}
                                            className={`${styles.pawn} ${p.globalRank === 1 ? styles.goldAura : p.globalRank === 2 ? styles.silverAura : p.globalRank === 3 ? styles.bronzeAura : ''}`}
                                            style={{
                                                backgroundColor: p.color,
                                                transform: `translate(${pIdx * 6}px, ${-pIdx * 6}px)`
                                            }}
                                            title={`${p.name}${p.globalRank ? ` (${p.globalRank}º Global)` : ''}`}
                                        >
                                            {p.avatar && <span className={styles.pawnAvatar}>{p.avatar}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
