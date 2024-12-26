import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApi } from '../hooks/useApi';
import LoadingDots from './common/LoadingDots/LoadingDots';
import styles from './ChatSelector.module.css';

const ChatSelector = ({ selectedChats, onChatSelect }) => {
    const [chats, setChats] = React.useState({});
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);
    const { getChats } = useApi();

    React.useEffect(() => {
        const loadChats = async () => {
            try {
                setLoading(true);
                const data = await getChats();
                setChats(data);
            } catch (err) {
                console.error('Error loading chats:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        loadChats();
    }, [getChats]);

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
                <AnimatePresence>
                    {Object.entries(chats).map(([id, chatData]) => (
                        <motion.div
                            key={id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={{
                                type: "spring",
                                stiffness: 500,
                                damping: 30
                            }}
                            className={`${styles.chatItem} ${selectedChats.includes(id) ? styles.selected : ''}`}
                            onClick={() => handleChatClick(id)}
                        >
                            <span className={styles.chatName}>{chatData.title || `Чат ${id}`}</span>
                            {selectedChats.includes(id) && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{
                                        type: "spring",
                                        stiffness: 500,
                                        damping: 30
                                    }}
                                    className={styles.checkMark}
                                >
                                    ✓
                                </motion.div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ChatSelector; 