import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import Header from './common/Header/Header';
import EventList from './EventList';
import CreateEvent from './CreateEvent/CreateEvent';
import FadeTransition from './common/FadeTransition/FadeTransition';
import LoadingScreen from './common/LoadingScreen/LoadingScreen';
import ErrorScreen from './common/ErrorScreen/ErrorScreen';
import { fireConfetti } from '../utils/confetti';
import { API_URL } from '../config';
import 'air-datepicker/air-datepicker.css';

const AppContent = () => {
    const { theme } = useTheme();
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryAttempt, setRetryAttempt] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 3000;

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 480);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const checkServer = async (isRetry = false) => {
        try {
            if (isRetry) {
                setIsRetrying(true);
                setRetryAttempt(prev => prev + 1);
            }

            if (!navigator.onLine) {
                throw new Error('offline');
            }

            console.log('Checking server health...');
            const response = await fetch(`${API_URL}/health`);
            console.log('Server response:', response.status);

            if (!response.ok) {
                throw new Error('server_error');
            }

            const data = await response.json();
            console.log('Server health data:', data);

            setIsLoading(false);
            setError(null);
            setRetryAttempt(0);
            setIsRetrying(false);

            if (isRetry) {
                fireConfetti();
            }

        } catch (err) {
            console.error('Server check error:', err);
            let errorMessage;

            switch(err.name) {
                case 'TypeError':
                    errorMessage = 'Не удалось подключиться к серверу. Проверьте подключение к интернету';
                    break;
                case 'Error':
                    if (err.message === 'offline') {
                        errorMessage = 'Отсутствует подключение к интернету';
                    } else if (err.message === 'server_error') {
                        errorMessage = 'Сервер временно недоступен';
                    }
                    break;
                default:
                    errorMessage = `Произошла ошибка: ${err.message}`;
            }

            setError(errorMessage);
            setIsLoading(false);
            setIsRetrying(false);
        }
    };

    const handleRetry = () => {
        if (retryAttempt >= MAX_RETRIES) {
            return;
        }
        checkServer(true);
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            checkServer(false);
        }, RETRY_DELAY);

        return () => clearTimeout(timer);
    }, []);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (error) {
        return (
            <ErrorScreen 
                message={error} 
                onRetry={handleRetry}
                retryAttempt={retryAttempt}
                maxRetries={MAX_RETRIES}
                isRetrying={isRetrying}
            />
        );
    }

    return (
        <div className="app" data-theme={theme}>
            <Header />
            <FadeTransition>
                <main className="main-content">
                    <Routes>
                        <Route 
                            path="/" 
                            element={<Navigate to="/events" replace />} 
                        />
                        <Route path="/events" element={<EventList />} />
                        <Route path="/create" element={<CreateEvent />} />
                    </Routes>
                </main>
            </FadeTransition>
        </div>
    );
};

export default AppContent; 