import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import styles from './BatchImporter.module.css';

interface BatchImporterProps {
    classId?: string;
    gradeLevel?: string;
    onClose?: () => void;
}

export function BatchImporter(props: BatchImporterProps) {
    const { classId, onClose } = props;
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
                skill_id: q.skill_id || data.skill_id || 'math_basic',
                question: q.question,
                answer: q.answer,
                options: q.options
            }));

            if (classId) {
                const { error } = await supabase.from('custom_questions').insert(questionsToInsert);
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
                placeholder='[ { "question": "...", "answer": "A", "options": ["A","B","C","D"], "skill_id": "math_basic" } ]'
            />
            
            <div className={styles.actions}>
                <button onClick={handleImport} className={styles.importBtn}>Processar Lote</button>
                <button onClick={() => setJsonInput('')} className={styles.clearBtn}>Limpar</button>
            </div>
            
            {status && <p className={styles.status}>{status}</p>}

            <div className={styles.tips}>
                <h3>IDs de Habilidades Disponíveis:</h3>
                <ul>
                    <li><strong>math_basic:</strong> Soma e Subtração</li>
                    <li><strong>math_logic:</strong> Raciocínio Lógico</li>
                    <li><strong>math_expressions:</strong> Multiplicação e Divisão</li>
                    <li><strong>math_fractions:</strong> Frações</li>
                    <li><strong>port_grammar:</strong> Gramática</li>
                    <li><strong>port_reading:</strong> Leitura e Interpretação</li>
                    <li><strong>sci_nature:</strong> Natureza e Meio Ambiente</li>
                    <li><strong>sci_body:</strong> Corpo Humano</li>
                </ul>
            </div>
        </div>
    );
}

export default BatchImporter;
