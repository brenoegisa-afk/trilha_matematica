import { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import styles from './QuizEditor.module.css';
import { BatchImporter } from './BatchImporter';


interface Question {
    id: string;
    question: string;
    answer: string;
    options: string[];
    grade_level: string;
}

interface QuizEditorProps {
    classId: string;
    className: string;
    onClose: () => void;
}

export default function QuizEditor({ classId, className, onClose }: QuizEditorProps) {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [newQuestion, setNewQuestion] = useState({
        text: '',
        answer: '',
        options: ['', '', '', ''],
        grade: '1-2'
    });
    const [showBatchImporter, setShowBatchImporter] = useState(false);


    useEffect(() => {
        fetchQuestions();

        // Smart Grade Detection: Attempt to guess grade from class name
        const nameLower = className.toLowerCase();
        if (nameLower.includes('5')) {
            setNewQuestion(prev => ({ ...prev, grade: '5' }));
        } else if (nameLower.includes('3') || nameLower.includes('4')) {
            setNewQuestion(prev => ({ ...prev, grade: '3-4' }));
        } else if (nameLower.includes('1') || nameLower.includes('2')) {
            setNewQuestion(prev => ({ ...prev, grade: '1-2' }));
        }
    }, [classId, className]);

    const fetchQuestions = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('teacher_questions')
            .select('*')
            .eq('class_id', classId);

        if (!error && data) {
            // Need to parse options if stored as JSONB and returned as string or just use as is
            setQuestions(data.map(q => ({
                ...q,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
            })));
        }
        setLoading(false);
    };

    const handleAddQuestion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newQuestion.text || !newQuestion.answer || newQuestion.options.some(o => !o)) {
            alert('Preencha todos os campos e as 4 opções!');
            return;
        }

        const { data, error } = await supabase
            .from('teacher_questions')
            .insert([{
                class_id: classId,
                grade_level: newQuestion.grade,
                question: newQuestion.text,
                answer: newQuestion.answer,
                options: newQuestion.options
            }])
            .select();

        if (!error && data) {
            setQuestions([...questions, {
                id: data[0].id,
                grade_level: data[0].grade_level,
                question: data[0].question,
                answer: data[0].answer,
                options: data[0].options
            }]);
            setNewQuestion({ text: '', answer: '', options: ['', '', '', ''], grade: '1-2' });
        } else {
            alert('Erro ao salvar pergunta: ' + error?.message);
        }
    };

    const handleDelete = async (id: string) => {
        const { error } = await supabase.from('teacher_questions').delete().eq('id', id);
        if (!error) {
            setQuestions(questions.filter(q => q.id !== id));
        }
    };

    const [copied, setCopied] = useState(false);

    const generateAIPrompt = () => {
        const gradeText = newQuestion.grade === '1-2' ? '1º e 2º Ano' : newQuestion.grade === '3-4' ? '3º e 4º Ano' : '5º Ano';

        let prompt = '';
        if (newQuestion.grade === '1-2') {
            prompt = `Gere 10 problemas matemáticos de Adição e Subtração para a turma "${className}" (crianças de 6 a 7 anos que estão aprendendo a ler).
MUITO IMPORTANTE: Como eles não sabem ler textos complexos, NÃO use historinhas. Use APENAS emojis e números diretos para representar o problema visualmente.
Exemplos de como devem ser as perguntas:
"🍎🍎 + 🍎 = ?"
"🚗🚗🚗 - 🚗 = ?"
"🐶 + 🐶🐶 = ?"
Formato esperado (responda APENAS com a lista JSON neste formato exato):
[
  {"question": "🍎 + 🍎🍎 = ?", "answer": "3", "options": ["2", "3", "4", "5"], "grade_level": "1-2"}
]`;
        } else {
            prompt = `Gere 10 problemas matemáticos ORIGINAIS para a turma "${className}", focando no nível do ${gradeText} do Ensino Fundamental. 
O tema deve ser lúdico e envolvente (ex: Piratas, Espaço, Animais).
Como já sabem ler relatar pequenos textos contextualizados (máx 2 linhas).
Formato esperado (responda APENAS com a lista JSON neste formato exato):
[
  {"question": "Enunciado Curto", "answer": "RespostaCerta", "options": ["Opção1", "Opção2", "RespostaCerta", "Opção4"], "grade_level": "${newQuestion.grade}"}
]`;
        }


        // Try to copy and provide visual fallback
        navigator.clipboard.writeText(prompt).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 3000);
            console.log("AI Prompt copied to clipboard:", prompt);
        }).catch(err => {
            console.error("Failed to copy prompt:", err);
            alert("Erro ao copiar! Verifique o console ou tente novamente.");
        });
    };


    const openExternalPool = (source: 'khan' | 'mec') => {
        const url = source === 'khan'
            ? `https://pt.khanacademy.org/search?page_search_query=matemática+${newQuestion.grade === '5' ? '5+ano' : 'ensino+fundamental'}`
            : `http://portaldoprofessor.mec.gov.br/fichaTecnicaAula.html?aula=1`;
        window.open(url, '_blank');
    };


    return (
        <div className={styles.editorOverlay}>
            <div className={styles.editorBox}>
                <header className={styles.header}>
                    <h2>Desafios Customizados: {className}</h2>
                    <button onClick={onClose} className={styles.closeBtn}>Fechar X</button>
                </header>

                <div className={styles.content}>
                    <div className={styles.aiHelperBar}>
                        <button onClick={generateAIPrompt} className={styles.aiPromptBtn} disabled={copied}>
                            {copied ? '✅ Copiado!' : '🤖 Gerar Prompt para ChatGPT'}
                        </button>
                        <button onClick={() => setShowBatchImporter(true)} className={styles.batchBtn}>
                            📦 Importar em Lote (JSON)
                        </button>
                        <div className={styles.externalLinks}>
                            <span>Buscar no:</span>
                            <button onClick={() => openExternalPool('khan')}>Khan Academy</button>
                            <button onClick={() => openExternalPool('mec')}>Portal MEC</button>
                        </div>
                    </div>
                </div>

                <div className={styles.editorSections}>
                    <section className={styles.addSection}>


                        <h3>Nova Pergunta</h3>
                        <form onSubmit={handleAddQuestion} className={styles.form}>
                            <textarea
                                placeholder="Enunciado da pergunta (Ex: Quanto é 12 + 15?)"
                                value={newQuestion.text}
                                onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })}
                                required
                            />

                            <div className={styles.optionsGrid}>
                                {newQuestion.options.map((opt, i) => (
                                    <input
                                        key={i}
                                        type="text"
                                        placeholder={`Opção ${i + 1}`}
                                        value={opt}
                                        onChange={e => {
                                            const newOpts = [...newQuestion.options];
                                            newOpts[i] = e.target.value;
                                            setNewQuestion({ ...newQuestion, options: newOpts });
                                        }}
                                        required
                                    />
                                ))}
                            </div>

                            <div className={styles.metaRow}>
                                <div className={styles.inputGroup}>
                                    <label>Resposta Correta:</label>
                                    <select
                                        value={newQuestion.answer}
                                        onChange={e => setNewQuestion({ ...newQuestion, answer: e.target.value })}
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {newQuestion.options.map((opt, i) => opt && (
                                            <option key={i} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.inputGroup}>
                                    <label>Nível:</label>
                                    <select
                                        value={newQuestion.grade}
                                        onChange={e => setNewQuestion({ ...newQuestion, grade: e.target.value })}
                                    >
                                        <option value="1-2">1º e 2º Ano</option>
                                        <option value="3-4">3º e 4º Ano</option>
                                        <option value="5">5º Ano</option>
                                    </select>
                                </div>
                            </div>

                            <button type="submit" className={styles.saveBtn}>Salvar Pergunta</button>
                        </form>
                    </section>

                    <section className={styles.listSection}>
                        <h3>Perguntas Ativas ({questions.length})</h3>
                        {loading ? <p>Carregando...</p> : (
                            <div className={styles.questionsList}>
                                {questions.map(q => (
                                    <div key={q.id} className={styles.qCard}>
                                        <p><strong>[{q.grade_level}]</strong> {q.question}</p>
                                        <small>Resposta: {q.answer}</small>
                                        <button onClick={() => handleDelete(q.id)} className={styles.deleteBtn}>🗑️</button>
                                    </div>
                                ))}
                                {questions.length === 0 && <p className={styles.empty}>Nenhuma pergunta customizada ainda.</p>}
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {showBatchImporter && (
                <BatchImporter
                    classId={classId}
                    gradeLevel={newQuestion.grade}
                    onClose={() => {
                        setShowBatchImporter(false);
                        fetchQuestions();
                    }}
                />
            )}
        </div>

    );
}
