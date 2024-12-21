import React from 'react';
import styles from './EventItem.module.css';
import DeleteButton from './common/DeleteButton';
import NotificationIcon from './common/NotificationIcon/NotificationIcon';

const EventItem = ({ event, onDelete, onNotification }) => {
    const { id, description, date, notifications = [] } = event;

    return (
        <div className={styles.eventItem}>
            <div className={styles.eventHeader}>
                <div className={styles.eventInfo}>
                    <div className={styles.eventDescription}>
                        {description}
                    </div>
                    <div className={styles.eventMeta}>
                        <span className={styles.badge}>
                            <svg viewBox="0 0 24 24" fill="none">
                                <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm0 18c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm.5-13H11v6l5.2 3.2.8-1.3-4.5-2.7V7z" fill="currentColor"/>
                            </svg>
                            {date}
                        </span>
                    </div>
                </div>
                <div className={styles.actions}>
                    <NotificationIcon 
                        count={notifications.length}
                        onClick={() => onNotification(event)}
                    />
                    <DeleteButton 
                        onClick={() => onDelete(id)}
                        size="small"
                    />
                </div>
            </div>
        </div>
    );
};

export default EventItem;