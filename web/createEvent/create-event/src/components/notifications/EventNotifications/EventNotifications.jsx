import React, { useState, useCallback } from 'react';
import './EventNotifications.css';
import NotificationItem from './NotificationItem';
import DeleteButton from '../../common/DeleteButton';
import { AddNotificationButton } from './NotificationButton';

const EventNotifications = ({ notifications = [], onSave, onClose }) => {
    const [notificationsList, setNotificationsList] = useState(notifications);

    const handleAddNotification = useCallback(() => {
        setNotificationsList(prev => [...prev, {
            time: 5,
            unit: 'minutes',
            message: '⚠️ Напоминание: {description}'
        }]);
    }, []);

    const handleUpdateNotification = useCallback((index, field, value) => {
        setNotificationsList(prev => prev.map((notification, i) => 
            i === index ? { ...notification, [field]: value } : notification
        ));
    }, []);

    const handleDeleteNotification = useCallback((index) => {
        setNotificationsList(prev => prev.filter((_, i) => i !== index));
    }, []);

    const handleSave = useCallback(() => {
        onSave(notificationsList);
    }, [notificationsList, onSave]);

    return (
        <div className="event-notifications-container">
            <div className="event-notifications-list">
                {notificationsList.map((notification, index) => (
                    <NotificationItem
                        key={index}
                        notification={notification}
                        onUpdate={(field, value) => handleUpdateNotification(index, field, value)}
                        onDelete={() => handleDeleteNotification(index)}
                    />
                ))}
            </div>
            <div className="notifications-actions">
                <AddNotificationButton onClick={handleAddNotification}>
                    Добавить уведомление
                </AddNotificationButton>
                <div className="action-buttons">
                    <button 
                        className="cancel-btn"
                        onClick={onClose}
                    >
                        Отмена
                    </button>
                    <button 
                        className="save-btn"
                        onClick={handleSave}
                    >
                        Сохранить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EventNotifications; 