import React from 'react';
import ChatSelector from '../../ChatSelector';

const ChatsStep = React.memo(({ selectedChats, onChatSelect }) => (
    <ChatSelector 
        selectedChats={selectedChats}
        onChatSelect={onChatSelect}
    />
));

export default ChatsStep; 