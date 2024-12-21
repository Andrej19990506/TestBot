import React from 'react';
import NotificationItem from '../../notifications/EventNotifications/NotificationItem';
import { AddNotificationButton } from '../../notifications/EventNotifications/NotificationButton';
import styles from '../MobileLayout.module.css';

const NotificationStep = React.memo(({ 
    notification,
    isAddingNotification,
    currentNotification,
    onUpdate,
    onDelete,
    onAdd,
    onSave,
    onCurrentUpdate,
    onCurrentDelete
}) => {
    if (notification) {
        return (
            <NotificationItem
                notification={notification}
                onUpdate={onUpdate}
                onDelete={onDelete}
            />
        );
    }

    if (isAddingNotification) {
        return (
            <div className={styles.addingNotificationContainer}>
                <NotificationItem
                    notification={currentNotification}
                    onUpdate={onCurrentUpdate}
                    onDelete={onCurrentDelete}
                />
                <button 
                    className={styles.saveNotificationBtn}
                    onClick={onSave}
                >
                    OK
                </button>
            </div>
        );
    }

    return (
        <AddNotificationButton 
            onClick={onAdd}
            className={styles.addNotificationBtn}
        >
            Добавить уведомление
        </AddNotificationButton>
    );
});

export default NotificationStep; 