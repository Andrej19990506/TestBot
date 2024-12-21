import React, { memo } from 'react';
import styles from './DeleteButton.module.css';

const DeleteButton = memo(({ onClick, size = 'medium', className = '' }) => {
    return (
        <button 
            className={`${styles.deleteButton} ${styles[size]} ${className}`}
            onClick={onClick}
            aria-label="Удалить"
        />
    );
});

DeleteButton.displayName = 'DeleteButton';

export default DeleteButton; 