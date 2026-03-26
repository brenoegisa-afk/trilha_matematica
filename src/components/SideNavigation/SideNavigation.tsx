import { useNavigate, useLocation } from 'react-router-dom';
import { useGame } from '../../context/GameContext';
import styles from './SideNavigation.module.css';

interface SideNavigationProps {
    isOpen?: boolean;
    onClose?: () => void;
}

export default function SideNavigation({ isOpen, onClose }: SideNavigationProps) {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser, logout } = useGame();

    const menuItems = [
        { id: 'home', label: 'Início', icon: '🏠', path: '/' },
        { id: 'game', label: 'Jogar', icon: '🎮', path: '/setup' },
        { id: 'inventory', label: 'Mochila', icon: '🎒', path: '/inventory' },
        { id: 'ranking', label: 'Ranking', icon: '🏆', path: '/ranking' },
        { id: 'shop', label: 'Lojinha', icon: '🛒', path: '/shop' },
        { id: 'parent', label: 'Pais', icon: '👪', path: '/parent' },
        { id: 'admin', label: 'Admin', icon: '⚙️', path: '/admin/import' },
    ];

    const handleNavigation = (path: string) => {
        navigate(path);
        if (onClose) onClose();
    };

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && <div className={styles.overlay} onClick={onClose} />}
            
            <nav className={`${styles.sideNav} ${isOpen ? styles.open : ''}`}>
                <div className={styles.logo}>
                    <span className={styles.logoIcon}>🏆</span>
                    <span className={styles.logoText}>Trilha</span>
                    {onClose && <button className={styles.closeBtn} onClick={onClose}>✕</button>}
                </div>
                
                <div className={styles.menuList}>
                    {menuItems.map((item) => {
                        const isActive = location.pathname === item.path;
                        
                        return (
                            <button
                                key={item.id}
                                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                                onClick={() => handleNavigation(item.path)}
                            >
                                <span className={styles.icon}>{item.icon}</span>
                                <span className={styles.label}>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                <div className={styles.footer}>
                    {currentUser ? (
                        <div className={styles.userSection}>
                            <div className={styles.userInfo}>
                                <div className={styles.userEmail}>{currentUser.email}</div>
                                <button className={styles.logoutBtn} onClick={() => { logout(); if(onClose) onClose(); }}>Sair</button>
                            </div>
                        </div>
                    ) : (
                        <button className={styles.loginBtn} onClick={() => handleNavigation('/login')}>
                            🔑 Entrar (SaaS)
                        </button>
                    )}
                    <div className={styles.streakIndicator}>
                        🔥 Ativo!
                    </div>
                </div>
            </nav>
        </>
    );
}
