import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSavedProfiles, updateProfile } from '../utils/saveSystem';
import type { SaveProfile } from '../utils/saveSystem';
import styles from './Shop.module.css';

const AVATARS = [
    { id: 'rocket', icon: '🚀', label: 'Foguete', price: 50 },
    { id: 'robot', icon: '🤖', label: 'Robô', price: 100 },
    { id: 'crown', icon: '👑', label: 'Coroa', price: 200 },
    { id: 'star', icon: '⭐', label: 'Super Estrela', price: 150 },
    { id: 'alien', icon: '👽', label: 'Alienígena', price: 120 },
    { id: 'cat', icon: '🐱', label: 'Gatinho', price: 80 },
    { id: 'dragon', icon: '🐲', label: 'Dragão', price: 300 },
    { id: 'unicorn', icon: '🦄', label: 'Unicórnio', price: 250 },
];

const MASCOTS = [
    { id: 'octopus', icon: '🐙', label: 'Polvinho Multiplicador', price: 150 },
    { id: 'fox', icon: '🦊', label: 'Raposa Divisora', price: 200 },
    { id: 'owl', icon: '🦉', label: 'Coruja da Lógica', price: 250 },
    { id: 'lion', icon: '🦁', label: 'Leão Calculador', price: 300 },
    { id: 'frog', icon: '🐸', label: 'Sapo dos Padrões', price: 100 },
];


export default function Shop() {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<SaveProfile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState<'avatars' | 'mascots'>('avatars');


    useEffect(() => {
        const saved = getSavedProfiles();
        setProfiles(saved);
        if (saved.length > 0) {
            setSelectedProfileId(saved[0].id);
        }
    }, []);

    const selectedProfile = profiles.find(p => p.id === selectedProfileId);

    const handleBuyItem = (item: { icon: string, label: string, price: number }, type: 'avatar' | 'mascot') => {
        if (!selectedProfile) return;

        const unlockedField = type === 'avatar' ? 'unlockedAvatars' : 'unlockedMascots';
        const equippedField = type === 'avatar' ? 'equippedAvatar' : 'equippedMascot';

        const isUnlocked = selectedProfile[unlockedField]?.includes(item.icon);

        if (isUnlocked) {
            // Already owned, just equip
            updateProfile(selectedProfile.id, { [equippedField]: item.icon });
            setMessage(`${item.label} equipado!`);
        } else {
            // Try to buy
            if (selectedProfile.stars >= item.price) {
                const currentUnlocked = selectedProfile[unlockedField] || [];
                updateProfile(selectedProfile.id, {
                    stars: selectedProfile.stars - item.price,
                    [unlockedField]: [...currentUnlocked, item.icon],
                    [equippedField]: item.icon
                });
                setMessage(`Você comprou o ${item.label}!`);
            } else {
                setMessage('Estrelas insuficientes! Jogue mais para ganhar.');
            }
        }

        // Refresh list
        setProfiles(getSavedProfiles());
        setTimeout(() => setMessage(''), 3000);
    };


    return (
        <div className={styles.shopContainer}>
            <header className={styles.shopHeader}>
                <button onClick={() => navigate('/setup')} className={styles.backBtn}>← Voltar</button>
                <h1>Lojinha de Troféus</h1>
                <div className={styles.profileSelector}>
                    <label>Jogador:</label>
                    <select
                        value={selectedProfileId}
                        onChange={(e) => setSelectedProfileId(e.target.value)}
                    >
                        {profiles.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                </div>
            </header>

            {selectedProfile ? (
                <div className={styles.shopContent}>
                    <div className={styles.statsBar}>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Suas Estrelas:</span>
                            <span className={styles.statValue}>⭐ {selectedProfile.stars}</span>
                        </div>
                        <div className={styles.statItem}>
                            <span className={styles.statLabel}>Visual Atual:</span>
                            <span className={styles.currentAvatar}>{selectedProfile.equippedAvatar || '⭕'}</span>
                        </div>
                    </div>

                    {message && <div className={styles.messageBox}>{message}</div>}

                    <div className={styles.tabs}>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'avatars' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('avatars')}
                        >
                            🎭 Avatares
                        </button>
                        <button
                            className={`${styles.tabBtn} ${activeTab === 'mascots' ? styles.activeTab : ''}`}
                            onClick={() => setActiveTab('mascots')}
                        >
                            🐾 Mascotes
                        </button>
                    </div>

                    <div className={styles.itemsGrid}>
                        {(activeTab === 'avatars' ? AVATARS : MASCOTS).map(item => {
                            const isUnlocked = (activeTab === 'avatars'
                                ? selectedProfile.unlockedAvatars
                                : (selectedProfile.unlockedMascots || []))
                                .includes(item.icon);

                            const isEquipped = (activeTab === 'avatars'
                                ? selectedProfile.equippedAvatar
                                : (selectedProfile.equippedMascot || '')) === item.icon;

                            return (
                                <div key={item.id} className={styles.shopItem}>
                                    <div className={styles.itemIcon}>{item.icon}</div>
                                    <h3>{item.label}</h3>

                                    {isUnlocked ? (
                                        <button
                                            className={isEquipped ? styles.equippedBtn : styles.equipBtn}
                                            onClick={() => handleBuyItem(item, activeTab === 'avatars' ? 'avatar' : 'mascot')}
                                            disabled={isEquipped}
                                        >
                                            {isEquipped ? 'Equipado' : 'Equipar'}
                                        </button>
                                    ) : (
                                        <button
                                            className={styles.buyBtn}
                                            onClick={() => handleBuyItem(item, activeTab === 'avatars' ? 'avatar' : 'mascot')}
                                            disabled={selectedProfile.stars < item.price}
                                        >
                                            ⭐ {item.price}
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                </div>
            ) : (
                <div className={styles.emptyState}>
                    <p>Crie um jogador na tela de Setup para acessar a loja!</p>
                </div>
            )}
        </div>
    );
}
