import { useNavigate, useLocation } from 'react-router-dom';
import styles from './SideNavigation.module.css';

export default function SideNavigation() {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        { id: 'home', label: 'Início', icon: '🏠', path: '/' },
        { id: 'game', label: 'Jogar', icon: '🎮', path: '/setup' },
        { id: 'ranking', label: 'Ranking', icon: '🏆', path: '/ranking' },
        { id: 'shop', label: 'Lojinha', icon: '🛒', path: '/shop' },
        { id: 'teacher', label: 'Professor', icon: '👨‍🏫', path: '/teacher/login' },
        { id: 'parent', label: 'Pais', icon: '👪', path: '/parent' },
        { id: 'admin', label: 'Admin', icon: '⚙️', path: '/admin/import' },
    ];

    return (
        <nav className={styles.sideNav}>
            <div className={styles.logo}>
                <span className={styles.logoIcon}>📐</span>
                <span className={styles.logoText}>Trilha</span>
            </div>
            
            <div className={styles.menuList}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path || 
                                   (item.id === 'teacher' && location.pathname.startsWith('/teacher'));
                    
                    return (
                        <button
                            key={item.id}
                            className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                            onClick={() => navigate(item.path)}
                        >
                            <span className={styles.icon}>{item.icon}</span>
                            <span className={styles.label}>{item.label}</span>
                        </button>
                    );
                })}
            </div>

            <div className={styles.footer}>
                <div className={styles.streakIndicator}>
                    🔥 3 dias
                </div>
            </div>
        </nav>
    );
}
