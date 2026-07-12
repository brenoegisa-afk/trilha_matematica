import { useMemo } from 'react';
import type { NodeMastery } from '../core/types';
import { DiagnosticService } from '../core/learning/DiagnosticService';
import styles from './StudentGraphModal.module.css';

interface StudentGraphModalProps {
    studentName: string;
    nodeMastery: Record<string, NodeMastery>;
    onClose: () => void;
}

const YEAR_LABEL: Record<number, string> = {
    1: '1º ano', 2: '2º ano', 3: '3º ano', 4: '4º ano', 5: '5º ano'
};

/**
 * Mostra ao professor a progressão de UM aluno pelo grafo curricular:
 * o que domina, o que pratica, onde travou (+ pré-requisito a reforçar) e
 * os equívocos capturados (distratores escolhidos). Essa é a visão que
 * transforma o "node_mastery" bruto em ação pedagógica.
 */
export default function StudentGraphModal({ studentName, nodeMastery, onClose }: StudentGraphModalProps) {
    const progress = useMemo(
        () => DiagnosticService.generateGraphProgress(nodeMastery || {}),
        [nodeMastery]
    );

    const hasData = progress.mastered.length + progress.inProgress.length + progress.struggling.length > 0;
    const pct = (a: number) => `${Math.round(a * 100)}%`;

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <div className={styles.header}>
                    <div>
                        <h2 className={styles.title}>{studentName}</h2>
                        <p className={styles.subtitle}>Progressão na trilha de matemática</p>
                    </div>
                    <button className={styles.closeBtn} onClick={onClose}>&times;</button>
                </div>

                {!hasData ? (
                    <div className={styles.empty}>
                        Este aluno ainda não jogou o suficiente para gerar dados de progressão.
                    </div>
                ) : (
                    <div className={styles.content}>
                        <div className={styles.statRow}>
                            <div className={styles.stat}>
                                <div className={styles.statVal}>{progress.masteredCount}</div>
                                <div className={styles.statLabel}>Habilidades dominadas</div>
                            </div>
                            <div className={styles.stat}>
                                <div className={styles.statVal}>
                                    {progress.deepestMastered > 0 ? YEAR_LABEL[progress.deepestMastered] : '—'}
                                </div>
                                <div className={styles.statLabel}>Nível mais avançado</div>
                            </div>
                            <div className={styles.stat}>
                                <div className={styles.statVal} style={{ color: progress.struggling.length ? 'var(--color-red)' : 'var(--color-green)' }}>
                                    {progress.struggling.length}
                                </div>
                                <div className={styles.statLabel}>Pontos travados</div>
                            </div>
                        </div>

                        {progress.struggling.length > 0 && (
                            <section className={styles.section}>
                                <h3 className={`${styles.sectionTitle} ${styles.red}`}>⚠️ Precisa de atenção</h3>
                                {progress.struggling.map(n => (
                                    <div key={n.id} className={styles.nodeRow}>
                                        <span className={styles.nodeIcon}>{n.icon}</span>
                                        <div className={styles.nodeInfo}>
                                            <span className={styles.nodeName}>{n.name}</span>
                                            <span className={styles.nodeMeta}>
                                                {pct(n.accuracy)} de acerto em {n.attempts} tentativas
                                                {n.weakPrereqName && (
                                                    <> · <strong>Revisar antes: {n.weakPrereqName}</strong></>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}

                        {progress.inProgress.length > 0 && (
                            <section className={styles.section}>
                                <h3 className={`${styles.sectionTitle} ${styles.blue}`}>✏️ Praticando agora</h3>
                                {progress.inProgress.map(n => (
                                    <div key={n.id} className={styles.nodeRow}>
                                        <span className={styles.nodeIcon}>{n.icon}</span>
                                        <div className={styles.nodeInfo}>
                                            <span className={styles.nodeName}>{n.name}</span>
                                            <span className={styles.nodeMeta}>{pct(n.accuracy)} de acerto em {n.attempts} tentativas</span>
                                        </div>
                                    </div>
                                ))}
                            </section>
                        )}

                        {progress.mastered.length > 0 && (
                            <section className={styles.section}>
                                <h3 className={`${styles.sectionTitle} ${styles.green}`}>✅ Já domina</h3>
                                <div className={styles.chips}>
                                    {progress.mastered.map(n => (
                                        <span key={n.id} className={styles.chip}>{n.icon} {n.name}</span>
                                    ))}
                                </div>
                            </section>
                        )}

                        {progress.misconceptions.length > 0 && (
                            <section className={styles.section}>
                                <h3 className={styles.sectionTitle}>🔍 Equívocos mais comuns</h3>
                                <p className={styles.hint}>Respostas erradas que o aluno mais escolheu — pistas do raciocínio dele.</p>
                                {progress.misconceptions.slice(0, 6).map((m, i) => (
                                    <div key={i} className={styles.miscRow}>
                                        <span className={styles.miscCount}>{m.count}×</span>
                                        <span>Em <strong>{m.nodeName}</strong>, escolheu <code>{m.wrongAnswer}</code></span>
                                    </div>
                                ))}
                            </section>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
