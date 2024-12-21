import React, { memo, Suspense, lazy, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import { ThemeProvider } from './context/ThemeContext';
import LoadingScreen from './components/common/LoadingScreen/LoadingScreen';
import FadeTransition from './components/common/FadeTransition/FadeTransition';
import ErrorScreen from './components/common/ErrorScreen/ErrorScreen';
import { fireConfetti } from './utils/confetti';
import { API_URL } from './config';

// Ленивая загрузка компонентов
const CreateEvent = lazy(() => import('./components/CreateEvent/CreateEvent'));
const EventList = lazy(() => import('./components/EventList/EventList'));

const App = memo(() => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [retryAttempt, setRetryAttempt] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 3000;

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
            const response = await fetch(`${API_URL}/health`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            });

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

    // Начальная проверка сервера
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
        <ThemeProvider>
            <Router>
                <FadeTransition>
                    <div className="app">
                        <Suspense fallback={<LoadingScreen />}>
                            <Routes>
                                <Route path="/" element={<CreateEvent />} />
                                <Route path="/events" element={<EventList />} />
                            </Routes>
                        </Suspense>
                    </div>
                </FadeTransition>
            </Router>
        </ThemeProvider>
    );
});

export default App;