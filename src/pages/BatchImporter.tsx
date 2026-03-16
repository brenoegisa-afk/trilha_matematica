import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import styles from './BatchImporter.module.css';

interface BatchImporterProps {
    classId?: string;
    gradeLevel?: string;
    onClose?: () => void;
}

export function BatchImporter(props: BatchImporterProps) {
    const { classId, gradeLevel, onClose } = props;
    const [jsonInput, setJsonInput] = useState('');
    const [status, setStatus] = useState('');

    const handleImport = async () => {
        try {
            const data = JSON.parse(jsonInput);
            let questionsList: any[] = [];

            // Intelligent extraction
            if (data.questions && Array.isArray(data.questions)) {
                questionsList = data.questions;
            } else if (Array.isArray(data)) {
                questionsList = data;
            } else if (data.subjects || data.grades) {
                // Nested structure (multi-subject or multi-grade)
                const target = data.subjects ? Object.values(data.subjects) : [data];
                target.forEach((subject: any) => {
                    if (subject.grades) {
                        Object.entries(subject.grades).forEach(([grade, pools]: [string, any]) => {
                            Object.values(pools).forEach((pool: any) => {
                                if (Array.isArray(pool)) {
                                    pool.forEach(q => questionsList.push({ ...q, grade_level: grade }));
                                }
                            });
                        });
                    }
                });
            }

            if (questionsList.length === 0) throw new Error('Nenhuma questão encontrada no formato fornecido.');

            const questionsToInsert = questionsList.map((q: any) => ({
                class_id: classId || data.classId,
                grade_level: gradeLevel || q.grade_level || data.grade || '1-2',
                question: q.question,
                answer: q.answer,
                options: q.options
            }));

            if (classId) {
                const { error } = await supabase.from('teacher_questions').insert(questionsToInsert);
                if (error) throw error;
            }

            setStatus('✅ Sucesso! ' + questionsToInsert.length + ' questões processadas.');
            if (onClose) setTimeout(onClose, 1500);
        } catch (e: any) {
            setStatus('❌ Erro: ' + (e.message || 'Formato JSON inválido.'));
        }
    };

    return (
        <div className={styles.container}>
            <h2>Ferramenta de Alimentação (Admin) 📥</h2>
            <p>Cole o JSON gerado pela IA abaixo para alimentar novas matérias e níveis.</p>
            
            <textarea 
                className={styles.textarea}
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder='{ "subject": "portuguese", "grade": "1", "questions": [...] }'
            />
            
            <div className={styles.actions}>
                <button onClick={handleImport} className={styles.importBtn}>Processar Lote</button>
                <button onClick={() => setJsonInput('')} className={styles.clearBtn}>Limpar</button>
            </div>
            
            {status && <p className={styles.status}>{status}</p>}

            <div className={styles.tips}>
                <h3>Guia de Dificuldade (BNCC):</h3>
                <ul>
                    <li><strong>1º Ano:</strong> Identificação visual, rimas, somas básicas.</li>
                    <li><strong>2º Ano:</strong> Comparação de grandezas, interpretação de frases.</li>
                    <li><strong>3º Ano:</strong> Tabuadas, concordância verbal elementar.</li>
                    <li><strong>4º Ano:</strong> Divisão exata, frações simples, gramática básica.</li>
                    <li><strong>5º Ano:</strong> Problemas de lógica multietapa, ortografia complexa.</li>
                </ul>
            </div>
        </div>
    );
}

export default BatchImporter;
