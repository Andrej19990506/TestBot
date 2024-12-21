import React, { memo, useCallback, useState, useRef, useEffect } from 'react';
import './ChatFilter.css';

const ChatFilter = memo(({ chats, activeFilters, onFilterChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleChat = useCallback((chatId, e) => {
        e.stopPropagation();
        const newFilters = new Set(activeFilters);
        const chatIdStr = String(chatId);
        if (newFilters.has(chatIdStr)) {
            newFilters.delete(chatIdStr);
        } else {
            newFilters.add(chatIdStr);
        }
        onFilterChange(newFilters);
    }, [activeFilters, onFilterChange]);

    const removeChat = useCallback((chatId, e) => {
        e.stopPropagation();
        const newFilters = new Set(activeFilters);
        newFilters.delete(String(chatId));
        onFilterChange(newFilters);
    }, [activeFilters, onFilterChange]);

    const clearAll = useCallback((e) => {
        e.stopPropagation();
        onFilterChange(new Set());
    }, [onFilterChange]);

    return (
        <div className="chat-filter-container" ref={dropdownRef}>
            <div className="filter-header">
                <span className="filter-title">Фильтр чатов</span>
                {activeFilters.size > 0 && (
                    <button 
                        className="clear-all-btn"
                        onClick={clearAll}
                        title="Очистить все фильтры"
                    >
                        Очистить все
                    </button>
                )}
            </div>
            
            <div 
                className="selected-chats-container"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="selected-chats">
                    {activeFilters.size > 0 ? (
                        Array.from(activeFilters).map(chatId => (
                            <div key={chatId} className="selected-chat-tag">
                                <span 
                                    className="chat-name"
                                    title={chats[chatId]?.title || `Чат ${chatId}`}
                                >
                                    {chats[chatId]?.title || `Чат ${chatId}`}
                                </span>
                                <button 
                                    className="remove-chat"
                                    onClick={(e) => removeChat(chatId, e)}
                                    title="Удалить из фильтра"
                                />
                            </div>
                        ))
                    ) : (
                        <div className="placeholder">Нажмите, чтобы выбрать чаты для фильтрации</div>
                    )}
                </div>
                {activeFilters.size > 0 && (
                    <span className="selected-count">
                        {activeFilters.size} {activeFilters.size === 1 ? 'чат' : 'чатов'}
                    </span>
                )}
                <div className="dropdown-arrow">
                    <svg viewBox="0 0 24 24" className={isOpen ? 'rotated' : ''}>
                        <path fill="currentColor" d="M7 10l5 5 5-5z"/>
                    </svg>
                </div>
            </div>

            {isOpen && (
                <div className="chats-dropdown">
                    {Object.entries(chats).map(([chatId, chatData]) => (
                        <div
                            key={chatId}
                            className={`chat-option ${activeFilters.has(chatId) ? 'selected' : ''}`}
                            onClick={(e) => toggleChat(chatId, e)}
                        >
                            <span className="chat-name">{chatData.title || `Чат ${chatId}`}</span>
                            {activeFilters.has(chatId) && (
                                <svg className="check-icon" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
});

ChatFilter.displayName = 'ChatFilter';

export default ChatFilter; 