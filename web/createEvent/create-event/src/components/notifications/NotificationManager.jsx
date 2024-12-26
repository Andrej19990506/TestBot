import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../common/Button/Button';
import styles from './NotificationManager.module.css';
import PropTypes from 'prop-types';

const PlusIcon = () => (
    <svg 
        width="16" 
        height="16" 
        viewBox="0 0 16 16" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path 
            d="M8 3.33334V12.6667" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
        />
        <path 
            d="M3.33331 8H12.6666" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round"
        />
    </svg>
);

const NotificationManager = ({ 
    notifications = [], 
    onNotificationsChange = () => {} 
}) => {
    const [isAdding, setIsAdding] = useState(false);
    const [newNotification, setNewNotification] = useState({
        time: '30',
        message: ''
    });

    const handleAdd = () => {
        setIsAdding(true);
    };

    const handleSave = () => {
        if (newNotification.message.trim()) {
            onNotificationsChange([
                ...notifications, 
                { ...newNotification, id: Date.now() }
            ]);
            setNewNotification({ time: '30', message: '' });
        }
        setIsAdding(false);
    };

    const handleDelete = (id) => {
        onNotificationsChange(notifications.filter(n => n.id !== id));
    };

    return (
        <div className={styles.container}>
            <AnimatePresence mode="sync">
                {!isAdding && notifications.length === 0 && (
                    <motion.div
                        key="add-button"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                    >
                        <Button 
                            onClick={handleAdd}
                            variant="primary"
                            className={styles.addButton}
                        >
                            <PlusIcon /> Добавить уведомление
                        </Button>
                    </motion.div>
                )}

                {isAdding && (
                    <motion.div
                        key="add-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={styles.addForm}
                    >
                        <select
                            value={newNotification.time}
                            onChange={(e) => setNewNotification({
                                ...newNotification,
                                time: e.target.value
                            })}
                            className={styles.timeSelect}
                        >
                            <option value="5">За 5 минут</option>
                            <option value="15">За 15 минут</option>
                            <option value="30">За 30 минут</option>
                            <option value="60">За 1 час</option>
                            <option value="1440">За 1 день</option>
                        </select>
                        <input
                            type="text"
                            value={newNotification.message}
                            onChange={(e) => setNewNotification({
                                ...newNotification,
                                message: e.target.value
                            })}
                            placeholder="Текст уведомления"
                            className={styles.messageInput}
                        />
                        <div className={styles.actions}>
                            <Button 
                                onClick={() => setIsAdding(false)}
                                variant="secondary"
                            >
                                Отмена
                            </Button>
                            <Button 
                                onClick={handleSave}
                                variant="primary"
                            >
                                Добавить
                            </Button>
                        </div>
                    </motion.div>
                )}

                <AnimatePresence>
                    {notifications.map((notification) => (
                        <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className={styles.notification}
                        >
                            <div className={styles.notificationContent}>
                                <span className={styles.time}>
                                    {notification.time === '1440' ? 'За 1 день' :
                                     notification.time === '60' ? 'За 1 час' :
                                     `За ${notification.time} минут`}
                                </span>
                                <span className={styles.message}>{notification.message}</span>
                            </div>
                            <button
                                onClick={() => handleDelete(notification.id)}
                                className={styles.deleteButton}
                            >
                                ×
                            </button>
                        </motion.div>
                    ))}

                    {notifications.length > 0 && !isAdding && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Button 
                                onClick={handleAdd}
                                variant="secondary"
                                className={styles.addMoreButton}
                            >
                                <PlusIcon /> Добавить ещё
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </AnimatePresence>
        </div>
    );
};

NotificationManager.propTypes = {
    notifications: PropTypes.array.isRequired,
    onNotificationsChange: PropTypes.func.isRequired
};

export default NotificationManager; 