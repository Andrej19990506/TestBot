import React from 'react';
import { motion } from 'framer-motion';
import styles from './MobileLayout.module.css';

const StepIndicator = ({ steps, currentStep, onStepClick }) => (
    <div className={styles.stepIndicator}>
        {steps.map(step => (
            <motion.div 
                key={step.id}
                className={`${styles.stepDot} ${currentStep === step.id ? styles.active : ''}`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onStepClick(step.id)}
            />
        ))}
    </div>
);

export default React.memo(StepIndicator); 