import React from 'react';
import classNames from 'classnames';
import buttonStyles from '../../common/Button/Button.module.css';
import styles from './NotificationButton.module.css';

export const AddNotificationButton = ({ onClick, children, className, ...props }) => {
    return (
        <button
            className={classNames(
                buttonStyles.button,
                buttonStyles.add,
                styles.addButton,
                className
            )}
            onClick={onClick}
            {...props}
        >
            <span className={styles.buttonIcon}>+</span>
            {children}
        </button>
    );
};

export const DeleteNotificationButton = ({ onClick, className, ...props }) => {
    return (
        <button
            className={classNames(
                buttonStyles.button,
                buttonStyles.icon,
                styles.deleteButton,
                className
            )}
            onClick={onClick}
            {...props}
        >
            <span className={styles.buttonIcon}>×</span>
        </button>
    );
}; 