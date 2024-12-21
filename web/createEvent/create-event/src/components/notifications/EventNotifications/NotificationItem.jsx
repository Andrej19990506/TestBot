import React from 'react';
import { DeleteNotificationButton } from './NotificationButton';
import styles from './NotificationItem.module.css';

const NotificationItem = ({ notification, onUpdate, onDelete }) => {
    return (
        <div className={styles['notification-item']}>
            <select
                className={styles['notification-time']}
                value={notification.time}
                onChange={(e) => onUpdate('time', parseInt(e.target.value))}
            >
                <option value="5">За 5 минут</option>
                <option value="15">За 15 минут</option>
                <option value="30">За 30 минут</option>
                <option value="60">За 1 час</option>
                <option value="1440">За 1 день</option>
            </select>
            <input
                type="text"
                className={styles['notification-message']}
                value={notification.message}
                onChange={(e) => onUpdate('message', e.target.value)}
                placeholder="⚠️ Напоминание о событии"
            />
            <div className={styles.deleteButtonWrapper}>
                <DeleteNotificationButton
                    onClick={onDelete}
                    aria-label="Удалить уведомление"
                >
                    <div className={styles.deleteIcon}>×</div>
                </DeleteNotificationButton>
            </div>
        </div>
    );
};

export default NotificationItem; 