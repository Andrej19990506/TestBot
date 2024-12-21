import React from 'react';
import { useApi } from '../hooks/useApi';
import LoadingDots from './common/LoadingDots/LoadingDots';
import styles from './ChatSelector.module.css';

const ChatSelector = ({ selectedChats, onChatSelect }) => {
    const [chats, setChats] = React.useState({});
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const { fetchChats } = useApi();

    React.useEffect(() => {
        const loadChats = async () => {
            try {
                setLoading(true);
                const chatsData = await fetchChats();
                setChats(chatsData);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadChats();
    }, [fetchChats]);

    const handleChatClick = (chatId) => {
        if (selectedChats.includes(chatId)) {
            onChatSelect(selectedChats.filter(id => id !== chatId));
        } else {
            onChatSelect([...selectedChats, chatId]);
        }
    };

    if (loading) {
        return (
            <div className={styles.loadingWrapper}>
                <LoadingDots />
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorMessage}>
                Ошибка загрузки чатов: {error}
            </div>
        );
    }

    if (Object.keys(chats).length === 0) {
        return (
            <div className={styles.emptyMessage}>
                У вас нет доступных чатов
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.chatsGrid}>
                {Object.entries(chats).map(([id, chatData]) => (
                    <div
                        key={id}
                        className={`${styles.chatItem} ${selectedChats.includes(id) ? styles.selected : ''}`}
                        onClick={() => handleChatClick(id)}
                    >
                        <span className={styles.chatName}>{chatData.title || `Чат ${id}`}</span>
                        {selectedChats.includes(id) && <span className={styles.checkMark}>✓</span>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChatSelector; 