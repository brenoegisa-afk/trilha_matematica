import { useState, useEffect } from 'react';
import styles from './ParentGate.module.css';

interface ParentGateProps {
    onSuccess: () => void;
    onCancel: () => void;
}

export function ParentGate({ onSuccess, onCancel }: ParentGateProps) {
    const [num1, setNum1] = useState(0);
    const [num2, setNum2] = useState(0);
    const [answer, setAnswer] = useState('');
    const [error, setError] = useState(false);

    useEffect(() => {
        // Generate a random multiplication for adults (e.g. 7 * 8)
        setNum1(Math.floor(Math.random() * 5) + 6); // 6 to 10
        setNum2(Math.floor(Math.random() * 5) + 6); // 6 to 10
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (parseInt(answer) === num1 * num2) {
            onSuccess();
        } else {
            setError(true);
            setAnswer('');
        }
    };

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.icon}>🔒</div>
                <h2>Acesso Restrito para Adultos</h2>
                <p>Para continuar, peça ajuda a um adulto ou resolva a conta abaixo:</p>
                
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.challenge}>
                        Quanto é <strong>{num1} × {num2}</strong>?
                    </div>
                    <input 
                        type="number" 
                        value={answer}
                        onChange={(e) => {
                            setAnswer(e.target.value);
                            setError(false);
                        }}
                        autoFocus
                        placeholder="Resposta"
                        className={error ? styles.inputError : ''}
                    />
                    {error && <div className={styles.errorText}>Ops, tente de novo!</div>}
                    
                    <div className={styles.buttons}>
                        <button type="button" onClick={onCancel} className={styles.cancelBtn}>Voltar</button>
                        <button type="submit" className={styles.submitBtn}>Entrar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
