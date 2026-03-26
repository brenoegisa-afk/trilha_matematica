import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import HomeButton from './components/HomeButton/HomeButton';
import SideNavigation from './components/SideNavigation/SideNavigation';

export default function RootLayout() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Auto-close menu when resizing to desktop
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 1024) {
                setIsMenuOpen(false);
            }
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }}>
            {/* Mobile Header */}
            <header style={{
                display: 'none', // Hidden on desktop via CSS class later
                height: '60px',
                background: 'white',
                borderBottom: '2px solid var(--color-ink)',
                alignItems: 'center',
                padding: '0 20px',
                position: 'sticky',
                top: 0,
                zIndex: 1100,
                justifyContent: 'space-between'
            }} className="mobile-only-header">
                <div style={{ fontWeight: 900, fontSize: '1.2rem', fontFamily: 'var(--font-title)' }}>🏆 Trilha</div>
                <button 
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    style={{ 
                        background: 'var(--color-yellow)', 
                        border: '2px solid var(--color-ink)',
                        borderRadius: '8px',
                        padding: '5px 10px',
                        fontSize: '1.2rem',
                        boxShadow: '2px 2px 0px var(--color-ink)',
                        marginBottom: 0
                    }}
                >
                    {isMenuOpen ? '✕' : '☰'}
                </button>
            </header>

            <div style={{ display: 'flex', flex: 1 }}>
                <SideNavigation isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />
                
                <main style={{ 
                    flex: 1, 
                    minHeight: '100vh',
                    backgroundColor: '#f9f9f9',
                    position: 'relative'
                }} className="main-content-area">
                    <Outlet />
                </main>
            </div>
            
            <HomeButton />

            <style>{`
                @media (max-width: 1024px) {
                    .mobile-only-header {
                        display: flex !important;
                    }
                    .main-content-area {
                        margin-left: 0 !important;
                    }
                }
                @media (min-width: 1025px) {
                    .main-content-area {
                        margin-left: 210px;
                    }
                }
            `}</style>
        </div>
    );
}
