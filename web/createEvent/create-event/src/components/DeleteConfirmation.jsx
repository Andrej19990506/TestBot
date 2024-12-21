import React, { memo } from 'react';
import './DeleteConfirmation.css';

const DeleteConfirmation = memo(({ isOpen, onCancel, onConfirm, message }) => {
    if (!isOpen) return null;

    return (
        <div className="delete-confirmation-overlay">
            <div className="confirmation-modal">
                <div className="confirmation-content">
                    <div className="confirmation-icon">
                        <svg viewBox="0 0 24 24">
                            <path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"/>
                        </svg>
                    </div>
                    <h3>Подтверждение удаления</h3>
                    <p>{message || 'Вы уверены, что хотите удалить это уведомление?'}</p>
                </div>
                <div className="modal-actions">
                    <button 
                        className="modal-btn modal-btn-secondary"
                        onClick={onCancel}
                    >
                        Отмена
                    </button>
                    <button 
                        className="modal-btn modal-btn-danger"
                        onClick={onConfirm}
                    >
                        Удалить
                    </button>
                </div>
            </div>
        </div>
    );
});

DeleteConfirmation.displayName = 'DeleteConfirmation';

export default DeleteConfirmation; 