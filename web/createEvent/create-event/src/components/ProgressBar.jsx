import React, { memo } from 'react';
import styles from './ProgressBar.module.css';

const ProgressBar = memo(({ steps, onStepClick }) => {
    const completedSteps = steps.filter(step => step.completed).length;
    const progress = Math.round((completedSteps / steps.length) * 100);

    return (
        <div className="progress-bar-component">
            <div className="progress-container">
                <div className="progress-header">
                    <span className="progress-percentage">{progress}%</span>
                </div>
                <div className="progress-track">
                    <div className="progress-bar-wrapper">
                        <div 
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="progress-steps">
                        {steps.map((step, index) => (
                            <div 
                                key={step.id}
                                className={`progress-step ${step.completed ? 'completed' : ''}`}
                                onClick={() => onStepClick(step.id)}
                            >
                                <div className="step-indicator">
                                    {step.completed ? '✓' : index + 1}
                                </div>
                                <span className="step-label">{step.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default ProgressBar; 