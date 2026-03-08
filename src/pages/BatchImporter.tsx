import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import styles from './BatchImporter.module.css';

interface BatchImporterProps {
    classId: string;
    gradeLevel: string;
    onClose: () => void;
}

export const BatchImporter: React.FC<BatchImporterProps> = ({ classId, gradeLevel, onClose }) => {
    const [rawText, setRawText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleImport = async () => {
        if (!rawText.trim()) return;
        setLoading(true);
        setError(null);

        try {
            // Try to parse as JSON first (best for AI output)
            let parsedQuestions: any[] = [];

            try {
                // Find potential JSON block in text if AI included conversational filler
                const jsonMatch = rawText.match(/\[[\s\S]*\]/);
                const jsonStr = jsonMatch ? jsonMatch[0] : rawText;
                parsedQuestions = JSON.parse(jsonStr);
            } catch (e) {
                throw new Error("Não foi possível identificar o formato JSON. Certifique-se de que o ChatGPT respondeu apenas com o código [ ... ].");
            }

            if (!Array.isArray(parsedQuestions)) {
                throw new Error("O conteúdo deve ser uma lista [ ].");
            }

            // Map and validate
            const toInsert = parsedQuestions.map(q => ({
                class_id: classId,
                grade_level: q.grade_level || gradeLevel,
                question: q.question,
                answer: q.answer,
                options: q.options
            }));

            const { error: insertError } = await supabase
                .from('teacher_questions')
                .insert(toInsert);

            if (insertError) throw insertError;

            alert('Sucesso! ' + toInsert.length + ' questões importadas.');
            onClose();
        } catch (err: any) {
            setError(err.message || "Erro ao processar as questões.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h3>📦 Importador em Lote</h3>
                    <button onClick={onClose} className={styles.closeBtn}>&times;</button>
                </div>
                <div className={styles.content}>
                    <div className={styles.instructions}>
                        <p><strong>Como usar a IA:</strong></p>
                        <ol>
                            <li>Vá ao <a href="https://chatgpt.com" target="_blank" rel="noreferrer">ChatGPT</a>.</li>
                            <li>Cole o <strong>Prompt</strong> que você copiou no botão anterior.</li>
                            <li>O ChatGPT vai gerar um código. Copie esse código e cole abaixo:</li>
                        </ol>
                    </div>
                    <textarea
                        value={rawText}
                        onChange={e => setRawText(e.target.value)}
                        placeholder='Ex: [{"question": "...", "answer": "...", ...}]'
                        className={styles.textarea}
                    />
                    {error && <div className={styles.error}>{error}</div>}
                </div>
                <div className={styles.footer}>
                    <button onClick={onClose} className={styles.cancelBtn}>Cancelar</button>
                    <button
                        onClick={handleImport}
                        disabled={loading || !rawText.trim()}
                        className={styles.confirmBtn}
                    >
                        {loading ? 'Importando...' : 'Confirmar Importação'}
                    </button>
                </div>
            </div>
        </div>
    );
};
