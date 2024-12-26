import React, { useState, useEffect } from 'react';
import styles from './EventList.module.css';
import EventItem from './EventItem';
import EmptyEventList from './EmptyEventList';
import { getEvents, deleteEvent } from '../api';

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                setLoading(true);
                setError(null);
                console.log('Fetching events...');
                const data = await getEvents();
                console.log('Received events:', data);

                if (!data || !Array.isArray(data)) {
                    console.error('Invalid data format:', data);
                    throw new Error('Invalid data format');
                }

                setEvents(data);
            } catch (error) {
                console.error('Failed to fetch events:', error);
                setError(error.message);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, []);

    console.log('Current state:', { loading, error, events, eventsLength: events?.length });

    if (loading) {
        console.log('Showing loading state');
        return (
            <div className={styles.loadingContainer}>
                <div className={styles.loading}>Загрузка...</div>
            </div>
        );
    }

    if (error) {
        console.log('Showing error state:', error);
        return (
            <div className={styles.errorContainer}>
                <div className={styles.error}>Ошибка: {error}</div>
            </div>
        );
    }

    if (!events || events.length === 0) {
        console.log('Showing empty state');
        return (
            <div className={styles.emptyStateContainer}>
                <EmptyEventList />
            </div>
        );
    }

    console.log('Showing events list:', events);
    return (
        <div className={styles.eventList}>
            {events.map((event) => (
                <EventItem
                    key={event.id}
                    event={event}
                    onDelete={async (id) => {
                        try {
                            await deleteEvent(id);
                            setEvents(events.filter(e => e.id !== id));
                        } catch (error) {
                            console.error('Failed to delete event:', error);
                        }
                    }}
                    onNotification={(event) => {
                        // Обработка уведомлений
                    }}
                />
            ))}
        </div>
    );
};

export default EventList;
