import React, { createContext, useContext, useState, useCallback } from 'react';
import { useApi } from '../hooks/useApi';

const EventContext = createContext();

export const EventProvider = ({ children }) => {
    const [events, setEvents] = useState([]);
    const [chats, setChats] = useState({});
    const api = useApi();

    const loadChats = useCallback(async () => {
        try {
            const chatData = await api.fetchChats();
            setChats(chatData);
        } catch (error) {
            console.error('Ошибка при загрузке чатов:', error);
        }
    }, [api]);

    const loadEvents = useCallback(async () => {
        try {
            const eventData = await api.getEvents();
            setEvents(eventData);
        } catch (error) {
            console.error('Ошибка при загрузке событий:', error);
        }
    }, [api]);

    const addEvent = useCallback(async (eventData) => {
        try {
            const result = await api.createEvent(eventData);
            setEvents(prev => [...prev, result.event]);
            return result;
        } catch (error) {
            console.error('Ошибка при создании события:', error);
            throw error;
        }
    }, [api]);

    const removeEvent = useCallback(async (eventId) => {
        try {
            await api.deleteEvent(eventId);
            setEvents(prev => prev.filter(event => event.id !== eventId));
        } catch (error) {
            console.error('Ошибка при удалении события:', error);
            throw error;
        }
    }, [api]);

    const updateNotifications = useCallback(async (eventId, notifications) => {
        try {
            await api.updateEventNotifications(eventId, notifications);
            setEvents(prev => prev.map(event => 
                event.id === eventId 
                    ? { ...event, notifications } 
                    : event
            ));
        } catch (error) {
            console.error('Ошибка при обновлении уведомлений:', error);
            throw error;
        }
    }, [api]);

    const value = {
        events,
        chats,
        loading: api.loading,
        error: api.error,
        loadChats,
        loadEvents,
        addEvent,
        removeEvent,
        updateNotifications
    };

    return (
        <EventContext.Provider value={value}>
            {children}
        </EventContext.Provider>
    );
};

export const useEvents = () => {
    const context = useContext(EventContext);
    if (!context) {
        throw new Error('useEvents должен использоваться внутри EventProvider');
    }
    return context;
}; 