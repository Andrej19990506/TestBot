import React, { useState } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import Badge from './common/Badge/Badge';
import styles from './EventItem.module.css';

const EventItem = ({ event, onDelete }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showDeleteAnimation, setShowDeleteAnimation] = useState(false);
    const x = useMotionValue(0);
    const deleteThreshold = 100;
    
    // Анимация для полного скрытия карточки вправо
    const slideOutRight = {
        x: window.innerWidth,
        opacity: 0,
        transition: { duration: 0.3, ease: "easeOut" }
    };

    // Анимация для возврата карточки
    const slideIn = {
        x: 0,
        opacity: 1,
        transition: { duration: 0.3, ease: "easeOut" }
    };
    
    // Трансформируем значения для анимации
    const background = useTransform(
        x,
        [-deleteThreshold, 0, deleteThreshold],
        ['rgba(239, 68, 68, 0.2)', 'rgba(0, 0, 0, 0)', 'rgba(239, 68, 68, 0.2)']
    );
    
    // Прозрачность для основного контента
    const contentOpacity = useTransform(
        x,
        [-100, 0, 100],
        [0, 1, 0]
    );

    // Прозрачность для текста подтверждения
    const confirmOpacity = useTransform(
        x,
        [-100, 0, 100],
        [1, 0, 1]
    );

    const handleDragEnd = () => {
        const currentX = x.get();
        if (Math.abs(currentX) > deleteThreshold) {
            // Анимируем карточку вправо перед показом подтверждения
            x.set(window.innerWidth);
            setShowConfirm(true);
            // Добавляем вибрацию при показе подтверждения
            if ('vibrate' in navigator) {
                navigator.vibrate([15, 50, 15]); // Паттерн: короткая-длинная-короткая
            }
        } else {
            // Возвращаем на место с анимацией
            x.set(0);
        }
        setIsDragging(false);
    };

    const handleConfirm = () => {
        // Длинная вибрация при удалении
        if ('vibrate' in navigator) {
            navigator.vibrate([30, 20, 50]);
        }
        onDelete(event.id);
    };

    const handleCancel = () => {
        setShowConfirm(false);
        // Короткая вибрация при отмене
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
        // Анимированно возвращаем карточку слева
        x.set(-window.innerWidth);
        setTimeout(() => {
            x.set(0);
        }, 50);
    };

    const formatEventDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleString('ru-RU', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getChatName = (chatId) => {
        const chatNames = {
            "-4774890964": "Словцова",
            "-4722230050": "Баумана",
            "-4641251467": "Свердловская",
            "-4775448662": "Взлетка",
            "-4732427913": "Комунальная",
            "-4755479474": "Мате залки"
        };
        const stringChatId = String(chatId);
        return chatNames[stringChatId] || stringChatId;
    };

    const borderStyle = {
        borderLeft: event.scheduling_status?.active 
            ? '4px solid var(--success, #4CAF50)' 
            : '4px solid var(--error, #FF3B30)'
    };

    const chatIds = event?.chat_ids || [];

    const handleDelete = async () => {
        setShowDeleteAnimation(true);
        
        // Ждем завершения анимации
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        setIsDeleting(true);
        
        // Ждем завершения анимации удаления
        await new Promise(resolve => setTimeout(resolve, 500));
        
        onDelete(event.id);
    };

    return (
        <div className={`${styles.eventItemWrapper} ${isDeleting ? styles.removing : ''}`}>
            {/* Слой с подтверждением удаления */}
            <motion.div 
                className={styles.confirmDelete}
                initial={{ opacity: 0 }}
                animate={{ 
                    opacity: showConfirm ? 1 : 0,
                    transition: { duration: 0.2 }
                }}
                style={{ 
                    pointerEvents: showConfirm ? 'auto' : 'none',
                    background: 'rgba(239, 68, 68, 0.2)'
                }}
            >
                <div className={styles.confirmText}>
                    <span>Вы действительно хотите удалить</span>
                    <strong>"{event.description}"</strong>
                </div>
                <div className={styles.confirmButtons}>
                    <motion.button
                        className={`${styles.confirmButton} ${styles.cancelButton}`}
                        onClick={handleCancel}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Отмена
                    </motion.button>
                    <motion.button
                        className={`${styles.confirmButton} ${styles.deleteButton}`}
                        onClick={handleConfirm}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        Удалить
                    </motion.button>
                </div>
            </motion.div>

            <motion.div
                className={styles.eventItem}
                style={{ 
                    ...borderStyle,
                    x,
                    opacity: showConfirm ? 0.3 : 1
                }}
                initial={{ backgroundColor: 'rgba(0, 0, 0, 0)' }}
                whileHover={!isDragging && !showConfirm ? { 
                    backgroundColor: 'rgba(0, 0, 0, 0.05)',
                    y: -4 
                } : {}}
                animate={showConfirm ? {
                    x: window.innerWidth,
                    backgroundColor: 'rgba(0, 0, 0, 0)'
                } : {
                    x: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0)'
                }}
                drag={!showConfirm ? "x" : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.7}
                onDragStart={() => setIsDragging(true)}
                onDragEnd={handleDragEnd}
                transition={{ duration: 0.2 }}
            >
                <motion.div 
                    className={styles.mainContent}
                    style={{ opacity: contentOpacity }}
                >
                    <div className={styles.dateTime}>
                        {formatEventDate(event.date)}
                    </div>
                    <div className={styles.description}>
                        {event.description}
                    </div>
                    <div className={styles.chatTags}>
                        {chatIds.map((chatId) => (
                            <motion.span
                                key={chatId}
                                className={styles.chatTag}
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                #{getChatName(chatId)}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>

                <motion.div 
                    className={styles.sideContent}
                    style={{ opacity: contentOpacity }}
                >
                    {event.repeat.type !== 'none' && (
                        <Badge 
                            type={event.repeat.type}
                            isActive={event.scheduling_status?.active}
                            lastCheck={event.scheduling_status?.last_check}
                        />
                    )}
                </motion.div>
            </motion.div>

            {/* Анимация удаления */}
            <div className={`${styles.deleteAnimation} ${showDeleteAnimation ? styles.show : ''}`}>
                <div className={styles.deleteIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </div>
                <div className={styles.deleteText}>
                    {event.description} удалено
                </div>
            </div>
        </div>
    );
};

export default React.memo(EventItem);