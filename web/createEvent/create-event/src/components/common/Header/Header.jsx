import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../../contexts/ThemeContext';
import { fireConfetti } from '../../../utils/confetti';
import styles from './Header.module.css';

const Header = () => {
    const location = useLocation();
    const { theme, toggleTheme } = useTheme();
    const isCreatePage = location.pathname === '/create';

    const handleLogoClick = () => {
        fireConfetti();
        // Добавляем вибрацию
        if ('vibrate' in navigator) {
            navigator.vibrate([15, 30, 15]);
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.container}>
                <button onClick={handleLogoClick} className={styles.logoButton}>
                    <svg 
                        className={styles.logoIcon} 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2}
                            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                        />
                    </svg>
                </button>
                <div className={styles.actions}>
                    <button 
                        className={styles.themeToggle} 
                        onClick={toggleTheme}
                        title={theme === 'dark' ? 'Светлая тема' : 'Темная тема'}
                    >
                        {theme === 'dark' ? (
                            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="5"/>
                                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
                            </svg>
                        ) : (
                            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
                            </svg>
                        )}
                    </button>
                    {isCreatePage ? (
                        <Link to="/events" className={styles.navLink} title="Список событий">
                            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16"/>
                            </svg>
                        </Link>
                    ) : (
                        <Link to="/create" className={styles.navLink} title="Создать событие">
                            <svg className={styles.icon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/>
                            </svg>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header; 