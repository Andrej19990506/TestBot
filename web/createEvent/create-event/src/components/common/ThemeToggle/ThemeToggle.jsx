import React from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '../../../contexts/ThemeContext';
import styles from './ThemeToggle.module.css';

const ThemeToggle = () => {
    const { theme, toggleTheme, isDark } = useTheme();

    return (
        <motion.button
            className={styles.themeToggle}
            onClick={toggleTheme}
            whileTap={{ scale: 0.95 }}
            title={`Переключить на ${isDark ? 'светлую' : 'темную'} тему`}
        >
            <div className={styles.iconContainer}>
                {/* Солнце */}
                <motion.div 
                    className={styles.iconWrapper}
                    initial={false}
                    animate={{
                        rotate: isDark ? -45 : 0,
                        scale: isDark ? 0 : 1,
                        opacity: isDark ? 0 : 1
                    }}
                    transition={{ 
                        duration: 0.4,
                        ease: [0.4, 0.0, 0.2, 1]
                    }}
                >
                    <svg className={styles.icon} viewBox="0 0 24 24">
                        <path 
                            fill="currentColor" 
                            d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zM2 13h2c.55 0 1-.45 1-1s-.45-1-1-1H2c-.55 0-1 .45-1 1s.45 1 1 1zm18 0h2c.55 0 1-.45 1-1s-.45-1-1-1h-2c-.55 0-1 .45-1 1s.45 1 1 1zM11 2v2c0 .55.45 1 1 1s1-.45 1-1V2c0-.55-.45-1-1-1s-1 .45-1 1zm0 18v2c0 .55.45 1 1 1s1-.45 1-1v-2c0-.55-.45-1-1-1s-1 .45-1 1zM5.99 4.58c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0s.39-1.03 0-1.41L5.99 4.58zm12.37 12.37c-.39-.39-1.03-.39-1.41 0-.39.39-.39 1.03 0 1.41l1.06 1.06c.39.39 1.03.39 1.41 0 .39-.39.39-1.03 0-1.41l-1.06-1.06zm1.06-10.96c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06zM7.05 18.36c.39-.39.39-1.03 0-1.41-.39-.39-1.03-.39-1.41 0l-1.06 1.06c-.39.39-.39 1.03 0 1.41s1.03.39 1.41 0l1.06-1.06z"
                        />
                    </svg>
                </motion.div>
                {/* Луна */}
                <motion.div 
                    className={styles.iconWrapper}
                    initial={false}
                    animate={{
                        rotate: isDark ? 0 : 45,
                        scale: isDark ? 1 : 0,
                        opacity: isDark ? 1 : 0
                    }}
                    transition={{ 
                        duration: 0.4,
                        ease: [0.4, 0.0, 0.2, 1]
                    }}
                >
                    <svg className={styles.icon} viewBox="0 0 24 24">
                        <path 
                            fill="currentColor" 
                            d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3.03 0-5.5-2.47-5.5-5.5 0-1.82.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"
                        />
                    </svg>
                </motion.div>
            </div>
        </motion.button>
    );
};

export default ThemeToggle; 