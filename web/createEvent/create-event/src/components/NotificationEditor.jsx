import React from 'react';
import styles from './NotificationEditor.module.css';
import classNames from 'classnames';
import { DeleteNotificationButton } from './notifications/EventNotifications/NotificationButton';

const NotificationEditor = ({ notification, onUpdate, onDelete }) => {
    const timeOptions = [
        { value: 5, label: '5 минут' },
        { value: 10, label: '10 минут' },
        { value: 15, label: '15 минут' },
        { value: 30, label: '30 минут' },
        { value: 60, label: '1 час' },
        { value: 120, label: '2 часа' },
        { value: 1440, label: '1 день' }
    ];

    return (
        <div className={styles.notificationEditItem}>
            <select
                className={styles.notificationTime}
                value={notification.time}
                onChange={(e) => onUpdate('time', parseInt(e.target.value))}
            >
                {timeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
            
            <input
                type="text"
                className={styles.customMessage}
                value={notification.message}
                onChange={(e) => onUpdate('message', e.target.value)}
                placeholder="Текст уведомления..."
            />
            
            <DeleteNotificationButton onClick={onDelete} />
        </div>
    );
};

export default NotificationEditor; 