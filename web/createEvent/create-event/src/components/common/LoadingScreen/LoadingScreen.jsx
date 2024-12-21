import React from 'react';
import { motion } from 'framer-motion';
import styles from './LoadingScreen.module.css';
import Skeleton from '../Skeleton/Skeleton';

const LoadingScreen = () => {
    return (
        <div className={styles.loadingScreen}>
            <motion.div 
                className={styles.skeletonWrapper}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
            >
                <Skeleton />
            </motion.div>
            <div className={styles.dotsContainer} />
        </div>
    );
};

export default LoadingScreen; 