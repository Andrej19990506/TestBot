import React, { useState, useEffect } from 'react';
import EventList from './components/EventList';
import CreateEvent from './components/CreateEvent';
import Notification from './components/Notification';
import './styles/common.css';

function App() {
  const [events, setEvents] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    // Загрузка событий при монтировании компонента
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/get_events');
      if (!response.ok) throw new Error('Ошибка при загрузке событий');
      const data = await response.json();
      setEvents(data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      const response = await fetch(`/delete_event/${eventId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Ошибка при удалении события');
      setEvents(events.filter(event => event.id !== eventId));
      setNotification({ message: 'Событие успешно удалено', type: 'success' });
    } catch (error) {
      console.error(error);
      setNotification({ message: 'Ошибка при удалении события', type: 'error' });
    }
  };

  return (
    <div className="App">
      <h1>Система управления событиями</h1>
      <CreateEvent onEventCreated={fetchEvents} />
      <EventList events={events} onDeleteEvent={handleDeleteEvent} />
      {notification && <Notification message={notification.message} type={notification.type} />}
    </div>
  );
}

export default App;