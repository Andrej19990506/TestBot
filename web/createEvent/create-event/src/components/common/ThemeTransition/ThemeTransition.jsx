import React from 'react';
import { motion } from 'framer-motion';
import styles from './ThemeTransition.module.css';

const ThemeTransition = ({ theme }) => {
    return (
        <motion.div
            key={theme}
            className={styles.transitionOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
        >
            <motion.div
                className={`${styles.transitionBackground} ${theme === 'dark' ? styles.dark : styles.light}`}
                initial={theme === 'dark' ? {
                    clipPath: 'circle(0% at top right)'
                } : {
                    clipPath: 'circle(0% at bottom left)'
                }}
                animate={{
                    clipPath: 'circle(150% at center)'
                }}
                transition={{
                    duration: 1,
                    ease: [0.4, 0, 0.2, 1]
                }}
            >
                <div className={styles.transitionContent}>
                    {theme === 'dark' ? (
                        <motion.div 
                            className={styles.moonContainer}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <div className={styles.moon} />
                            <motion.div 
                                className={styles.stars}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5, duration: 0.5 }}
                            />
                        </motion.div>
                    ) : (
                        <motion.div 
                            className={styles.sunContainer}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                        >
                            <div className={styles.sun} />
                            <motion.div 
                                className={styles.rays}
                                initial={{ opacity: 0, rotate: 0 }}
                                animate={{ opacity: 1, rotate: 360 }}
                                transition={{ 
                                    opacity: { delay: 0.5, duration: 0.5 },
                                    rotate: { duration: 20, repeat: Infinity, ease: "linear" }
                                }}
                            />
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
};

export default ThemeTransition; 