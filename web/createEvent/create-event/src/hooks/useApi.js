import { useState, useCallback } from 'react';
import { API_URL } from '../config';

export const useApi = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const getChats = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/chats`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (err) {
            console.error('API Error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/events`, {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.error('API Error:', err);
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const createEvent = useCallback(async (eventData) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/events`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(eventData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Ошибка при создании события');
            }

            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteEvent = useCallback(async (eventId) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return true;
        } catch (err) {
            console.error('API Error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateEvent = useCallback(async (eventId, updateData) => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/events/${eventId}`, {
                method: 'PUT',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (err) {
            console.error('API Error:', err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        getChats,
        fetchEvents,
        createEvent,
        deleteEvent,
        updateEvent
    };
}; 