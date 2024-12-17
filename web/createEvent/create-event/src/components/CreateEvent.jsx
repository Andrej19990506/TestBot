import React, { useState } from 'react';

function CreateEvent({ onEventCreated }) {
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleCreate = async () => {
    try {
      const response = await fetch('/create_event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description, date, time })
      });
      if (!response.ok) throw new Error('Ошибка при создании события');
      onEventCreated();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="create-event">
      <input type="text" placeholder="Описание" value={description} onChange={e => setDescription(e.target.value)} />
      <input type="date" value={date} onChange={e => setDate(e.target.value)} />
      <input type="time" value={time} onChange={e => setTime(e.target.value)} />
      <button onClick={handleCreate}>Создать событие</button>
    </div>
  );
}

export default CreateEvent;
