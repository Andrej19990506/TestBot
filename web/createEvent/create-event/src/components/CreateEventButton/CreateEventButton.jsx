import React from 'react';
import Button from '../common/Button/Button';
import styles from './CreateEventButton.module.css';

const CreateEventButton = ({ onClick, loading, disabled, children, ...props }) => {
    return (
        <Button
            variant="primary"
            className={`${styles.button} ${loading ? styles.loading : ''}`}
            onClick={onClick}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? 'Создание...' : children}
        </Button>
    );
};

export default CreateEventButton; 