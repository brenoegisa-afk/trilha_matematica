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

export default function Shop() {
    const navigate = useNavigate();
    const [profiles, setProfiles] = useState<SaveProfile[]>([]);
    const [selectedProfileId, setSelectedProfileId] = useState<string>('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const saved = getSavedProfiles();
        setProfiles(saved);
        if (saved.length > 0) {
            setSelectedProfileId(saved[0].id);
        }
    }, []);

    const selectedProfile = profiles.find(p => p.id === selectedProfileId);

    const handleBuy = (avatar: typeof AVATARS[0]) => {
        if (!selectedProfile) return;

        if (selectedProfile.unlockedAvatars.includes(avatar.icon)) {
            // Already owned, just equip
            updateProfile(selectedProfile.id, { equippedAvatar: avatar.icon });
            setMessage(`Avatar ${avatar.label} equipado!`);
        } else {
            // Try to buy
            if (selectedProfile.stars >= avatar.price) {
                updateProfile(selectedProfile.id, {
                    stars: selectedProfile.stars - avatar.price,
                    unlockedAvatars: [...selectedProfile.unlockedAvatars, avatar.icon],
                    equippedAvatar: avatar.icon
                });
                setMessage(`Você comprou o ${avatar.label}!`);
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

                    <div className={styles.itemsGrid}>
                        {AVATARS.map(avatar => {
                            const isUnlocked = selectedProfile.unlockedAvatars.includes(avatar.icon);
                            const isEquipped = selectedProfile.equippedAvatar === avatar.icon;

                            return (
                                <div key={avatar.id} className={styles.shopItem}>
                                    <div className={styles.itemIcon}>{avatar.icon}</div>
                                    <h3>{avatar.label}</h3>

                                    {isUnlocked ? (
                                        <button
                                            className={isEquipped ? styles.equippedBtn : styles.equipBtn}
                                            onClick={() => handleBuy(avatar)}
                                            disabled={isEquipped}
                                        >
                                            {isEquipped ? 'Equipado' : 'Equipar'}
                                        </button>
                                    ) : (
                                        <button
                                            className={styles.buyBtn}
                                            onClick={() => handleBuy(avatar)}
                                            disabled={selectedProfile.stars < avatar.price}
                                        >
                                            ⭐ {avatar.price}
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
