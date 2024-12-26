import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import AppContent from './components/AppContent';

const App = () => {
    return (
        <BrowserRouter
            future={{ 
                v7_startTransition: true,
                v7_relativeSplatPath: true
            }}
        >
            <ThemeProvider>
                <AppContent />
            </ThemeProvider>
        </BrowserRouter>
    );
};

export default App; 