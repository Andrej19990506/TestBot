import React from 'react';
import { motion } from 'framer-motion';
import styles from './MobileLayout.module.css';

const StepNavigation = ({ currentStep, totalSteps, onPrevClick, onNextClick }) => (
    <div className={styles.navigation}>
        <motion.button
            className={styles.prevButton}
            onClick={onPrevClick}
            disabled={currentStep === 1}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            Назад
        </motion.button>
        <motion.button
            className={styles.nextButton}
            onClick={onNextClick}
            disabled={currentStep === totalSteps}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
            {currentStep === totalSteps ? 'Готово' : 'Далее'}
        </motion.button>
    </div>
);

export default React.memo(StepNavigation); 