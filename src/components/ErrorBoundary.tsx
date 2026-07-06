import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
    children?: ReactNode;
}

interface State {
    hasError: boolean;
    errorMsg: string;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        errorMsg: ''
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, errorMsg: error.message };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100vh',
                    backgroundColor: '#1a1a2e',
                    color: 'white',
                    fontFamily: 'system-ui, sans-serif',
                    padding: '20px',
                    textAlign: 'center'
                }}>
                    <h1 style={{ color: '#ff4d4f', fontSize: '3rem', marginBottom: '1rem' }}>Opa, algo deu errado! 🛠️</h1>
                    <p style={{ fontSize: '1.2rem', maxWidth: '600px', opacity: 0.9 }}>
                        O jogo encontrou um problema inesperado. 
                    </p>
                    <div style={{ 
                        marginTop: '20px', 
                        padding: '15px', 
                        backgroundColor: 'rgba(255,0,0,0.1)', 
                        borderRadius: '8px',
                        border: '1px solid rgba(255,0,0,0.3)',
                        maxWidth: '80%',
                        wordBreak: 'break-all'
                    }}>
                        <code>{this.state.errorMsg}</code>
                    </div>
                    <button 
                        onClick={() => window.location.href = '/'}
                        style={{
                            marginTop: '30px',
                            padding: '15px 30px',
                            fontSize: '1.2rem',
                            backgroundColor: '#4facfe',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        🔄 Tentar Novamente
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
