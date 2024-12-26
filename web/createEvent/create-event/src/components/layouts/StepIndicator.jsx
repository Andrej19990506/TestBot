import React from 'react';
import { motion } from 'framer-motion';
import styles from './MobileLayout.module.css';

const StepIndicator = ({ steps, currentStep, onStepClick }) => (
    <motion.div 
        className={styles.stepIndicator}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
    >
        {steps.map(step => (
            <motion.div 
                key={step.id}
                className={`${styles.stepDot} ${currentStep === step.id ? styles.active : ''}`}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onStepClick(step.id)}
                initial={false}
                animate={{
                    scale: currentStep === step.id ? 1.2 : 1,
                    backgroundColor: currentStep === step.id 
                        ? 'var(--primary-color)' 
                        : 'var(--gray-300)'
                }}
                transition={{ duration: 0.2 }}
            />
        ))}
    </motion.div>
);

export default React.memo(StepIndicator); 