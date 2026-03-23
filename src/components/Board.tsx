import { useState, useEffect, useRef, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import Dice from './Dice';
import styles from './Board.module.css';

/* =========================================================
   FARM ADVENTURE PATH - VIBRANT CHUNKY TILES
   Dual layout: Horizontal S-curve (desktop) / Vertical snake (mobile)
   ========================================================= */
const TOTAL_TILES = 36; 

// DESKTOP: Horizontal S-Curve on 1200x1000 canvas (85px spacing between tiles)
const DESKTOP_POINTS = [
    // Bottom Row (L→R) - 9 tiles (wider spacing = fewer tiles per row)
    { x: 180, y: 820 }, { x: 265, y: 820 }, { x: 350, y: 820 }, { x: 435, y: 820 }, { x: 520, y: 820 }, { x: 605, y: 820 }, { x: 690, y: 820 }, { x: 775, y: 820 }, { x: 860, y: 820 },
    // Curve 1 (Up) - 4 tiles
    { x: 940, y: 770 }, { x: 1000, y: 700 }, { x: 1000, y: 620 }, { x: 940, y: 550 },
    // Middle Row (R→L) - 9 tiles
    { x: 860, y: 500 }, { x: 775, y: 500 }, { x: 690, y: 500 }, { x: 605, y: 500 }, { x: 520, y: 500 }, { x: 435, y: 500 }, { x: 350, y: 500 }, { x: 265, y: 500 }, { x: 180, y: 500 },
    // Curve 2 (Up) - 4 tiles
    { x: 120, y: 440 }, { x: 80, y: 370 }, { x: 80, y: 300 }, { x: 120, y: 240 },
    // Top Row (L→R) - 10 tiles
    { x: 180, y: 190 }, { x: 265, y: 190 }, { x: 350, y: 190 }, { x: 435, y: 190 }, { x: 520, y: 190 }, { x: 605, y: 190 }, { x: 690, y: 190 }, { x: 775, y: 190 }, { x: 860, y: 190 }, { x: 945, y: 190 }
];

// MOBILE: Vertical snake on 380x580 canvas (compact for portrait!)
const MOBILE_POINTS = (() => {
    const points: { x: number; y: number }[] = [];
    const cols = 5;       // 5 tiles per row
    const spacingX = 64;  // smaller gap for smaller mobile tiles
    const spacingY = 64; 
    const startX = 60;    
    const startY = 40;    
    const rows = Math.ceil(TOTAL_TILES / cols);

    for (let row = 0; row < rows; row++) {
        const isReversed = row % 2 === 1;
        const tilesInRow = Math.min(cols, TOTAL_TILES - row * cols);
        for (let col = 0; col < tilesInRow; col++) {
            const actualCol = isReversed ? (cols - 1 - col) : col;
            points.push({
                x: startX + actualCol * spacingX,
                y: startY + row * spacingY
            });
        }
    }
    return points;
})();

export default function Board() {
    const { tiles, players, currentSubjectId } = useGame();
    const [boardScale, setBoardScale] = useState(1);
    const [isMobile, setIsMobile] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Responsive: detect mobile and scale to fit BOTH width AND height
    useEffect(() => {
        const handleResize = () => {
            if (!wrapperRef.current) return;
            const containerWidth = wrapperRef.current.offsetWidth;
            const mobile = containerWidth < 600;
            setIsMobile(mobile);
            
            const targetW = mobile ? 380 : 1200;
            const targetH = mobile ? 580 : 1000;
            
            // Available height: viewport minus header (~65px), HUD (~80px), board margins (~40px)
            const availableH = window.innerHeight - 185;
            
            const scaleW = (containerWidth - 20) / targetW;
            const scaleH = availableH / targetH;
            const newScale = Math.min(1, scaleW, scaleH);
            
            setBoardScale(newScale);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const boardTiles = useMemo(() => tiles.slice(0, TOTAL_TILES), [tiles]);
    const POINTS = isMobile ? MOBILE_POINTS : DESKTOP_POINTS;
    const boardW = isMobile ? 380 : 1200;
    const boardH = isMobile ? 580 : 1000;

    // SVG trail path
    const trailPath = useMemo(() => {
        if (POINTS.length === 0) return '';
        let d = `M ${POINTS[0].x} ${POINTS[0].y}`;
        for (let i = 1; i < POINTS.length; i++) {
            d += ` L ${POINTS[i].x} ${POINTS[i].y}`;
        }
        return d;
    }, [POINTS]);

    return (
        <div className={styles.boardWrapper} ref={wrapperRef}>
            <div 
                className={styles.boardContainer} 
                style={{ 
                    backgroundImage: 'url("/farm_bg.png")',
                    width: `${boardW}px`,
                    height: `${boardH}px`,
                    transform: `scale(${boardScale})`,
                    transformOrigin: 'top center',
                    marginBottom: `${(boardH * boardScale) - boardH}px`
                }}
            >
                {/* 🌈 PATH TRAIL */}
                <svg className={styles.svgLayer} viewBox={`0 0 ${boardW} ${boardH}`}>
                    <path d={trailPath} fill="none" className={styles.farmTrail} />
                </svg>

                <div className={styles.startBadge} style={{ 
                    left: `${isMobile ? POINTS[0].x - 30 : POINTS[0].x - 90}px`, 
                    top: `${POINTS[0].y - 10}px` 
                }}>START</div>
                <div className={styles.finishBadge} style={{ 
                    left: `${isMobile ? POINTS[POINTS.length - 1].x + 30 : POINTS[POINTS.length - 1].x + 70}px`, 
                    top: `${POINTS[POINTS.length - 1].y - 10}px` 
                }}>FINISH</div>

                {/* 💠 Chunky Game Tiles */}
                {boardTiles.map((tile, i) => {
                    const pos = POINTS[i];
                    if (!pos) return null;

                    const colorCycle = ['Green', 'Yellow', 'Blue', 'Red'];
                    const colorOverride = colorCycle[i % 4]; 
                    const tileClass = styles[`tile${colorOverride}`];

                    const getTileIcon = (color: string, subjectId: string) => {
                        if (subjectId === 'portuguese') {
                            if (color === 'Red') return '📖';
                            if (color === 'Green') return 'A';
                            if (color === 'Blue') return '✏️';
                            if (color === 'Yellow') return 'ABC';
                        }
                        if (subjectId === 'science') {
                            if (color === 'Red') return '🔬';
                            if (color === 'Green') return '🌱';
                            if (color === 'Blue') return '💧';
                            if (color === 'Yellow') return '🪐';
                        }
                        // Default Math
                        if (color === 'Red') return '×';
                        if (color === 'Green') return '+';
                        if (color === 'Blue') return '÷';
                        if (color === 'Yellow') return '−';
                        return '';
                    };

                    return (
                        <div
                            key={tile.position}
                            className={`${styles.chunkyTile} ${tileClass}`}
                            style={{ left: `${pos.x}px`, top: `${pos.y}px` }}
                        >
                            <div className={styles.tileInner}>
                                <div className={styles.mathMark}>
                                    {getTileIcon(colorOverride, currentSubjectId)}
                                </div>
                                <span className={styles.tileStep}>{i + 1}</span>
                            </div>
                        </div>
                    );
                })}

                {/* ♟️ Heroes Pawns */}
                {players.map(p => {
                    const pos = POINTS[p.currentPosition] || POINTS[0];
                    return (
                        <div
                            key={p.id}
                            className={styles.heroPawn}
                            style={{ 
                                left: `${pos.x}px`, 
                                top: `${pos.y}px`,
                                '--hero-accent': p.color 
                            } as React.CSSProperties}
                        >
                            <div className={styles.pawnBody}>
                                {p.avatar || '🐰'}
                                <div className={styles.playerNameTag}>{p.name}</div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className={styles.diceArea}>
                <Dice />
            </div>
        </div>
    );
}
