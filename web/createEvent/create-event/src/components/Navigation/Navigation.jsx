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
    hover: { 
        scale: 1.1,
        rotate: [0, -10, 10, -10, 0],
        transition: {
            duration: 0.5,
            ease: "easeInOut"
        }
    }
};

const Navigation = memo(() => {
    const location = useLocation();
    const isHome = location.pathname === '/';

    return (
        <motion.nav 
            className={styles.navigation}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={navVariants}
        >
            <div className={styles.navLinks}>
                <Link to="/" className={`${styles.navLink} ${isHome ? styles.active : ''}`}>
                    <motion.div 
                        className={styles.iconWrapper}
                        variants={iconVariants}
                        whileHover="hover"
                    >
                        {isHome ? (
                            <svg viewBox="0 0 24 24" className={styles.icon}>
                                <motion.path
                                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1, ease: "easeInOut" }}
                                />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" className={styles.icon}>
                                <motion.path
                                    d="M12 4v16m8-8H4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1, ease: "easeInOut" }}
                                />
                            </svg>
                        )}
                        <motion.span 
                            className={styles.navText}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {isHome ? 'Главная' : 'Создать'}
                        </motion.span>
                    </motion.div>
                </Link>

                <Link to="/events" className={`${styles.navLink} ${!isHome ? styles.active : ''}`}>
                    <motion.div 
                        className={styles.iconWrapper}
                        variants={iconVariants}
                        whileHover="hover"
                    >
                        {!isHome ? (
                            <svg viewBox="0 0 24 24" className={styles.icon}>
                                <motion.path
                                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1, ease: "easeInOut" }}
                                />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" className={styles.icon}>
                                <motion.path
                                    d="M4 6h16M4 12h16M4 18h16"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    initial={{ pathLength: 0 }}
                                    animate={{ pathLength: 1 }}
                                    transition={{ duration: 1, ease: "easeInOut" }}
                                />
                            </svg>
                        )}
                        <motion.span 
                            className={styles.navText}
                            initial={{ x: -10, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                        >
                            {!isHome ? 'События' : 'Список'}
                        </motion.span>
                    </motion.div>
                </Link>
            </div>
        </motion.nav>
    );
});

Navigation.displayName = 'Navigation';

export default Navigation; 