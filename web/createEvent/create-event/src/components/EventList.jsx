import React from 'react';
import styles from './EventList.module.css';
import EventItem from './EventItem';

const EventList = ({ events, onDelete, onNotification }) => {
    return (
        <div className={styles.eventList}>
            {events.map((event) => (
                <EventItem
                    key={event.id}
                    event={event}
                    onDelete={onDelete}
                    onNotification={onNotification}
                />
            ))}
        </div>
    );
};

export default EventList;
