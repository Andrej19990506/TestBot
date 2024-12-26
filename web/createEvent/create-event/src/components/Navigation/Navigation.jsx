import React, { memo } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './Navigation.module.css';

const navVariants = {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 20 }
};

const iconVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.1 },
    tap: { scale: 0.95 }
};

const Navigation = memo(() => {
    const location = useLocation();
    const isEventList = location.pathname === '/events';

    return (
        <motion.nav 
            className={styles.navigation}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={navVariants}
        >
            <div className={styles.navLinks}>
                <Link to="/events" className={`${styles.navLink} ${isEventList ? styles.active : ''}`}>
                    <motion.div 
                        className={styles.iconWrapper}
                        variants={iconVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <motion.svg viewBox="0 0 24 24" className={styles.icon}>
                            <path 
                                d="M4 6h16M4 12h16M4 18h16"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                        </motion.svg>
                        <span className={styles.navText}>События</span>
                    </motion.div>
                </Link>

                <Link to="/create" className={`${styles.navLink} ${!isEventList ? styles.active : ''}`}>
                    <motion.div 
                        className={styles.iconWrapper}
                        variants={iconVariants}
                        whileHover="hover"
                        whileTap="tap"
                    >
                        <motion.svg viewBox="0 0 24 24" className={styles.icon}>
                            <path 
                                d="M12 4v16m8-8H4"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                        </motion.svg>
                        <span className={styles.navText}>Создать</span>
                    </motion.div>
                </Link>
            </div>
        </motion.nav>
    );
});

Navigation.displayName = 'Navigation';

export default Navigation; 