import React, { createContext, useState, useContext, useCallback, useMemo } from 'react';
import { AnimatePresence } from 'framer-motion';
import ThemeTransition from '../components/common/ThemeTransition/ThemeTransition';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const initialTheme = savedTheme || (systemPrefersDark ? 'dark' : 'light');
        
        document.documentElement.setAttribute('data-theme', initialTheme);
        return initialTheme;
    });

    const [showTransition, setShowTransition] = useState(false);

    const toggleTheme = useCallback(() => {
        setShowTransition(true);
        
        setTimeout(() => {
            setTheme(prevTheme => {
                const newTheme = prevTheme === 'light' ? 'dark' : 'light';
                localStorage.setItem('theme', newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
                return newTheme;
            });
        }, 100);

        setTimeout(() => {
            setShowTransition(false);
        }, 2000);
    }, []);

    // Слушаем изменения системной темы
    React.useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            if (!localStorage.getItem('theme')) {
                const newTheme = e.matches ? 'dark' : 'light';
                setTheme(newTheme);
                document.documentElement.setAttribute('data-theme', newTheme);
            }
        };

        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
    }, []);

    const contextValue = useMemo(() => ({
        theme,
        toggleTheme,
        isDark: theme === 'dark'
    }), [theme, toggleTheme]);

    return (
        <ThemeContext.Provider value={contextValue}>
            <AnimatePresence mode="wait">
                {showTransition && <ThemeTransition theme={theme} />}
            </AnimatePresence>
            {children}
        </ThemeContext.Provider>
    );
};

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}; 