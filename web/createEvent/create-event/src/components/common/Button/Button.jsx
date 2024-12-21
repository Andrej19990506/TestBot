import React from 'react';
import styles from './Button.module.css';

const Button = ({ 
    children, 
    variant = 'default',
    size = 'medium',
    icon,
    disabled,
    className,
    selected,
    ...props 
}) => {
    const buttonClass = [
        styles.button,
        styles[variant],
        styles[size],
        disabled ? styles.disabled : '',
        variant === 'selectChats' && selected ? styles.selectChatsSelected : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button 
            className={buttonClass}
            disabled={disabled}
            {...props}
        >
            {icon && <span className={styles.buttonIcon}>{icon}</span>}
            {children}
        </button>
    );
};

export default Button; 