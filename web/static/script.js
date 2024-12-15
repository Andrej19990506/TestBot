// Добавляем базовые стили для модального окна в начало файла
const baseModalStyles = document.createElement('style');
baseModalStyles.textContent = `
    .modal-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        background: rgba(0, 0, 0, 0.5) !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        z-index: 9999 !important;
    }

    .modal-overlay.visible {
        opacity: 1 !important;
        visibility: visible !important;
    }

    .notification-editor-modal {
        background: white !important;
        border-radius: 12px !important;
        padding: 25px !important;
        width: 90% !important;
        max-width: 500px !important;
        transform: scale(0.9);
        transition: transform 0.3s ease;
        position: relative !important;
        z-index: 10000 !important;
    }

    .modal-overlay.visible .notification-editor-modal {
        transform: scale(1) !important;
    }
`;
document.head.appendChild(baseModalStyles);

const selectedChatIds = new Set();
        let allChatsSelected = false;
        
        // Глобальный объект для хранения соответствий id -> имя чата
        let chatNames = {};
        
        function initializeStartPositions() {
            gsap.set('#main-header, .nav-button', { y: '-20%', opacity: 0 });
        }

        function navigateTo(pageId) {
            const timeline = gsap.timeline();
            const sections = document.querySelectorAll('.content-section');
            
            sections.forEach(section => {
                if (!section.classList.contains('hidden')) {
                    timeline.to(section, { duration: 0.5, y: '100%', opacity: 0, onComplete: () => section.classList.add('hidden') });
                }
            });
        
            const targetSection = document.getElementById(pageId);
            targetSection.classList.remove('hidden');
            timeline.fromTo(targetSection, { y: '-100%', opacity: 0 }, { duration: 0.5, y: '0%', opacity: 1 });
        
            timeline.fromTo('.nav-button', { y: '-20%', opacity: 0 }, { duration: 0.5, y: '0%', opacity: 1 }, 0);
            timeline.fromTo('#main-header', { y: '-20%', opacity: 0 }, { duration: 0.5, y: '0%', opacity: 1 }, 0);
        
            // Отображение навигационных кнопок и динамическая загрузка данных
            const toListButton = document.querySelector('.nav-button.to-list');
            const toCreateButton = document.querySelector('.nav-button.to-create');
        
            if (pageId === 'create-event-section') {
                toListButton.style.display = 'inline-block';
                toCreateButton.style.display = 'none';
                document.getElementById('main-header').innerText = 'Создание события';
            } else if (pageId === 'event-list-section') {
                loadEventList();  // Загружает актуальный список событий при переходе на страницу списка событий
                toListButton.style.display = 'none';
                toCreateButton.style.display = 'inline-block';
                document.getElementById('main-header').innerText = 'Список событий';
            }
        }
        
    
        async function createNewEvent() {
            try {
                if (selectedChatIds.size === 0) {
                    showNotification('Выберите хотя бы о��ин чат');
                    return;
                }

                const description = document.querySelector('.event-description').textContent.trim();
                const dateField = document.getElementById('dateField');
                const timeField = document.getElementById('timeField');
                const repeatType = document.getElementById('repeat-type')?.value || 'none';

                if (!description) {
                    showNotification('Введите описание события');
                    return;
                }

                if (!dateField?.textContent || !timeField?.textContent) {
                    showNotification('Выберите дату и время события');
                    return;
                }

                // Получаем настройки уведомлений
                const notifications = getNotificationSettings();
                if (notifications.length === 0) {
                    notifications.push({
                        time: 5,
                        unit: 'minutes',
                        message: '⚠️ Напоминание: {description}',
                        send_to_chats: true
                    });
                }

                // Формируем насройки повторения
                const repeatSettings = {
                    type: repeatType,
                    // end_date временно отключено
                    // end_date: document.getElementById('repeat-end-date')?.value || null
                };

                // Добавляем специфичные настройки в зависимости от типа повторения
                if (repeatType === 'weekly') {
                    repeatSettings.weekdays = getSelectedWeekdays();
                    if (repeatSettings.weekdays.length === 0) {
                        showNotification('Выберите дни недели для еженедельного повторения');
                        return;
                    }
                } else if (repeatType === 'monthly') {
                    repeatSettings.month_day = document.getElementById('month-day')?.value;
                    if (!repeatSettings.month_day) {
                        showNotification('Выберите день месяца для ежемесячного повторения');
                        return;
                    }
                }

                // Формируем данные события
                const eventData = {
                    description: description,
                    date: `${dateField.textContent} ${timeField.textContent}`,
                    chat_ids: Array.from(selectedChatIds),
                    repeat_settings: repeatSettings,
                    notifications: notifications
                };

                console.log('Создаваемое событие:', eventData);

                const response = await fetch('/create_event', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });

                const result = await response.json();
                if (response.ok) {
                    showNotification('Событие успешно создано!');
                    clearEventForm();
                    await loadEventList();
                } else {
                    throw new Error(result.error || 'Ошибка при создании события');
                }
            } catch (error) {
                console.error('Ошибка:', error);
                showNotification('Ошибка: ' + error.message);
            }
        }
    
        function toggleChatSelection(chatId, listItem) {
            if (selectedChatIds.has(chatId)) {
                selectedChatIds.delete(chatId);
                listItem.classList.remove('selected');
            } else {
                selectedChatIds.add(chatId);
                listItem.classList.add('selected');
            }
        }
    
        function selectAllChats(chatIds) {
            const listItems = document.querySelectorAll('.item-list li');
            if (allChatsSelected) {
                selectedChatIds.clear();
                listItems.forEach(item => item.classList.remove('selected'));
                document.querySelector('.select-all-button').innerText = 'Выбрать все чаты';
            } else {
                listItems.forEach((item, index) => {
                    selectedChatIds.add(chatIds[index]);
                    item.classList.add('selected');
                });
                document.querySelector('.select-all-button').innerText = 'Отменить выбор';
            }
            allChatsSelected = !allChatsSelected;
        }
    
        async function loadChatButtons() {
            try {
                const response = await fetch('/get_chats');
                if (!response.ok) {
                    throw new Error('Ошибка при получении списка чатов');
                }
                
                const chats = await response.json();
                const container = document.getElementById('chats-container');
                if (!container) return;

                // Создаем список
                const ul = document.createElement('ul');
                ul.className = 'item-list';

                // Добавляем кнопку "Выбрать все"
                const selectAllButton = document.createElement('button');
                selectAllButton.className = 'select-all-button';
                selectAllButton.textContent = 'Выбрать все';
                selectAllButton.onclick = toggleAllChats;
                container.appendChild(selectAllButton);

                // Добавляем чаты в список
                Object.entries(chats).forEach(([chatId, chatName]) => {
                    const li = document.createElement('li');
                    li.textContent = chatName; // Используем имя чата вместо ID
                    li.onclick = () => toggleChat(chatId, li);
                    
                    // Если чат уже выбран, добавляем класс selected
                    if (selectedChatIds.has(chatId)) {
                        li.classList.add('selected');
                    }
                    
                    ul.appendChild(li);
                });

                container.appendChild(ul);
            } catch (error) {
                console.error('Ошибка при загрузке чатов:', error);
                showNotification('Ошибка при загрузке списка чатов');
            }
        }

        // Функция переключения выбора чата
        function toggleChat(chatId, element) {
            if (selectedChatIds.has(chatId)) {
                selectedChatIds.delete(chatId);
                element.classList.remove('selected');
            } else {
                selectedChatIds.add(chatId);
                element.classList.add('selected');
            }
            allChatsSelected = false;
        }

        // Функция выбора/отмены выбора всех чатов
        function toggleAllChats() {
            const chatElements = document.querySelectorAll('.item-list li');
            allChatsSelected = !allChatsSelected;

            chatElements.forEach(element => {
                const chatId = element.dataset.chatId;
                if (allChatsSelected) {
                    selectedChatIds.add(chatId);
                    element.classList.add('selected');
                } else {
                    selectedChatIds.delete(chatId);
                    element.classList.remove('selected');
                }
            });
        }
    
        function addSwipeFunctionality(itemElement, eventId, eventName) {
            let touchstartX = 0;
            let touchcurrentX = 0;
            const swipeThreshold = 100; // Порог для визуального изменения и удаления
        
            itemElement.addEventListener('touchstart', function(event) {
                touchstartX = event.changedTouches[0].screenX;
                itemElement.style.transition = 'none';  // Отключаем плавные переходы на время движения
            });
        
            itemElement.addEventListener('touchmove', function(event) {
                touchcurrentX = event.changedTouches[0].screenX;
                const translation = Math.max(0, touchcurrentX - touchstartX);
        
                // Перемещение элемента вправо
                itemElement.style.transform = `translateX(${translation}px)`;
        
                // Модификация визуального изменения бордера
                if (translation > swipeThreshold) {
                    itemElement.classList.add('delete-threshold-reached');
                    itemElement.style.borderLeftColor = 'red'; // Устанавлваем красный цвет при достижении порога
                } else {
                    itemElement.classList.remove('delete-threshold-reached');
                    itemElement.style.borderLeftColor = ''; // Сбрасываем цвет границы по умолчанию
                }
        
                event.preventDefault();
            });
        
            itemElement.addEventListener('touchend', function(event) {
                const touchendX = event.changedTouches[0].screenX;
                itemElement.style.transition = 'transform 0.3s ease'; // Переход для плавного возвращения
                itemElement.style.transform = 'translateX(0)'; // Возвращаем элемент на начальную позицию
        
                if (touchendX - touchstartX > swipeThreshold) {
                    // Если порог достигнут, показываем подтверждение
                    displayConfirmation(itemElement, eventId, eventName, itemElement.innerHTML);
                }
            });
        }

        function displayConfirmation(itemElement, eventId, eventName, originalContent) {
            const confirmationMessage = document.createElement('div');
            confirmationMessage.className = 'confirmation-message';
            confirmationMessage.innerText = `Вы действительно хотите удалить "${eventName}"?`;
        
            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'confirmation-buttons';
        
            const yesButton = document.createElement('button');
            yesButton.innerText = 'Да';
            yesButton.onclick = () => {
                deleteEvent(eventId, itemElement, eventName); // Передаем itemElement дл анимации
                itemElement.innerHTML = originalContent; // Свободное просранство, если нужно показать удаление
            };
            
            const noButton = document.createElement('button');
            noButton.innerText = 'Отмена';
            noButton.onclick = () => {
                itemElement.innerHTML = originalContent;
                itemElement.classList.remove('delete-threshold-reached');  // Убираем класс только при отмене
                itemElement.style.borderLeftColor = 'green';
            };
        
            buttonContainer.appendChild(yesButton);
            buttonContainer.appendChild(noButton);
        
            itemElement.innerHTML = ''; // Очщаем одержимое
            itemElement.appendChild(confirmationMessage);
            itemElement.appendChild(buttonContainer);
        
            // Показываем элементы
            confirmationMessage.style.display = 'block';
            buttonContainer.style.display = 'flex';
        }
        
        function deleteEvent(eventId, itemElement, eventName) {
            if (!eventId) {
                showNotification('Не удалось удалить событие: недопустимый идентификатор');
                return;
            }
        
            // Устаните начальную высоту элмента
            const itemHeight = itemElement.offsetHeight + 'px';
            itemElement.style.height = itemHeight;
        
            // Используйте requestAnimationFrame, чтобы предоставить время для применения начальной высоты
            requestAnimationFrame(() => {
                // Уменьшите высоту до нуля
                itemElement.style.transition = 'height 0.5s ease, opacity 0.5s ease';
                itemElement.style.height = '0px';
                itemElement.style.opacity = '0';
            });
        
            // Уалите элемент после окончания анимации
            setTimeout(() => {
                itemElement.remove();
        
                // Проверьте, не нужно л обнулить высоту контейнера до минимума
                const listContainer = document.getElementById('event-list-container');
                if (!listContainer.children.length) {
                    listContainer.style.padding = '0';
                }
            }, 500);
        
            // Запрос на удаление события на сервре
            setTimeout(async () => {
                try {
                    const response = await fetch(`/delete_event/${eventId}`, {
                        method: 'DELETE'
                    });
        
                    const result = await response.json();
        
                    if (response.ok && result.success) {
                        showNotification(`Событие: "${eventName}" удалено.`);
                        loadEventList(); // Обновите список событий
                    } else {
                        showNotification(result.error || 'Ошибка при удалении события.');
                    }
                } catch (error) {
                    showNotification('Ошибка: ' + error.message);
                }
            }, 510); 
        }
        
        function closeModal() {
            document.getElementById('confirmation-modal').classList.add('hidden');
            resetAllItemsPosition(); // Сбрасываем перемещение всех элементов
        }
        
        // Вспомогательная функция для сброса позиции элемента
        function resetElementPosition(itemElement, originalTransform) {
            itemElement.style.transform = originalTransform;
            itemElement.style.borderRightColor = 'green'; // Восстанавливаем бордер
        }
        
        async function loadEventList() {
            try {
                // Сначала загружаем имена чатов
                await loadChatNames();
                
                const response = await fetch('/get_events');
                if (!response.ok) {
                    throw new Error('Ошибка при получении списка событий');
                }
                const events = await response.json();
                const listContainer = document.getElementById('event-list-container');
                listContainer.innerHTML = '';

                if (events.length === 0) {
                    const emptyMessage = document.createElement('div');
                    emptyMessage.className = 'empty-event-list';
                    emptyMessage.innerText = 'Список событий пуст';
                    listContainer.appendChild(emptyMessage);
                } else {
                    events.forEach(event => {
                        const eventElement = createEventElement(event);
                        listContainer.appendChild(eventElement);
                    });
                }
            } catch (error) {
                showNotification('Ошибка: ' + error.message);
            }
        }

        // Функция загрузки имен чатов
        async function loadChatNames() {
            try {
                const response = await fetch('/get_chats');
                if (!response.ok) {
                    throw new Error('Ошибка при получении списка чатов');
                }
                const chats = await response.json();
                chatNames = chats; // Сохраняем соответствия id -> имя
                return chats;
            } catch (error) {
                console.error('Ошибка загрузки чатов:', error);
                return {};
            }
        }

        // Фу��кция олучения имени чата по ID
        function getChatName(chatId) {
            return chatNames[chatId] || `Чат ${chatId}`;
        }

        function showNotification(message) {
            const notification = document.createElement('div');
            notification.className = 'notification';
            notification.innerText = message;
        
            document.body.appendChild(notification);
        
            // Показать увдомление
            requestAnimationFrame(() => {
                notification.style.top = '20px';
                notification.style.opacity = '1';
            });
        
            // брать уведомление через 3 секунды
            setTimeout(() => {
                notification.style.top = '-50px';
                notification.style.opacity = '0';
                notification.addEventListener('transitionend', () => notification.remove());
            }, 3000);
        }
        function convertToDateFormat(dateTimeStr) {
            // Отбрасываем часть с временем, если она есть
            const [dateStr] = dateTimeStr.split(' ');
            const [day, month, year] = dateStr.split('.');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        function formatDateToISO(dateObj) {
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0'); // месяцы начинаются с 0
            const day = String(dateObj.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        }
    
        window.onload = () => {
            initializeStartPositions();
            loadChatButtons();
            loadEventList();

            const dateInputElement = document.getElementById('event-date');
            const dateSvg = document.getElementById('date-picker-icon');

            if (dateInputElement && dateSvg) {
                const datePicker = new AirDatepicker(dateInputElement, {
                    autoClose: true,
                    timepicker: true,
                    dateFormat: 'dd.MM.yyyy',
                    timeFormat: 'HH:mm',
                    onSelect: function ({ formattedDate, date }) {
                        if (formattedDate) {
                            const [datePart, timePart] = formattedDate.split(' ');
                            const dateField = document.getElementById('dateField');
                            const timeField = document.getElementById('timeField');
                
                            if (dateField && timeField) {
                                dateField.textContent = datePart;
                                timeField.textContent = timePart || '';
                            }
                        }
                    },
                    buttons: ['today', 'clear']
                });

                dateSvg.addEventListener('click', () => {
                    datePicker.show();
                });

                // Обработчик изменения даты
            dateInputElement.addEventListener('change', function(event) {
                const selectedDate = event.target.value;
                    console.log(`Выбранная дата: ${selectedDate}`);
                    
                    const dateField = document.getElementById('dateField');
                    if (dateField) {
                        dateField.textContent = selectedDate;
                    }
                });
            }
            
            // Основная анимация при загрузке
            gsap.timeline()
                .fromTo('#main-header', { opacity: 0, y: '-50%' }, { duration: 0.5, opacity: 1, y: '0%' })
                .fromTo('.nav-button', { opacity: 0, y: '-20%' }, { duration: 0.5, opacity: 1, y: '0%', stagger: 0.2 }, '-=0.3')
                .fromTo('#create-event-section', { opacity: 0, scale: 0.8 }, { duration: 0.5, opacity: 1, scale: 1 }, '-=0.3');
            
            document.getElementById('create-event-section').classList.remove('hidden');
            document.querySelector('.nav-button.to-list').style.display = 'inline-block';
            document.querySelector('.nav-button.to-create').style.display = 'none';
            
            // Обработчики соытий для кнопок мдального окна
            document.getElementById('confirm-delete').onclick = () => confirmDeleteEvent();
            document.getElementById('cancel-delete').onclick = () => closeModal();

            initializeMonthDays();
        }
        
        document.addEventListener('DOMContentLoaded', function() {
            const button = document.querySelector('.button');
            const menu = document.querySelector('.menu');
            const menuLinks = document.querySelectorAll('.menu-link');

            button.addEventListener('click', (e) => {
                button.classList.toggle('active');

                if (button.classList.contains('active')) {
                    button.setAttribute('aria-expanded', 'true');
                    menu.setAttribute('aria-hidden', 'false');
                    menuLinks.forEach(link => link.setAttribute('tabindex', '0'));
                } else {
                    button.setAttribute('aria-expanded', 'false');
                    menu.setAttribute('aria-hidden', 'true');
                    menuLinks.forEach(link => link.setAttribute('tabindex', '-1'));
                }
            });

            menuLinks.forEach(link => {
                link.addEventListener('click', function() {
                    button.textContent = this.textContent;
                    button.dataset.value = this.dataset.value;
                    button.classList.remove('active');
                    menu.setAttribute('aria-hidden', 'true');
                    menuLinks.forEach(link => link.setAttribute('tabindex', '-1'));
                });
            });

            document.addEventListener('click', function(e) {
                if (!button.contains(e.target) && !menu.contains(e.target)) {
                    button.classList.remove('active');
                    menu.setAttribute('aria-hidden', 'true');
                    menuLinks.forEach(link => link.setAttribute('tabindex', '-1'));
                }
            });
        });

        // Управление повторениями
        document.getElementById('repeat-type').addEventListener('change', function(e) {
            const weeklySettings = document.getElementById('weekly-settings');
            const monthlySettings = document.getElementById('monthly-settings');
            const endDateSettings = document.querySelector('.end-date-settings');
            
            weeklySettings.classList.add('hidden');
            monthlySettings.classList.add('hidden');
            endDateSettings.classList.add('hidden');
            
            if (e.target.value !== 'none') {
                endDateSettings.classList.remove('hidden');
                if (e.target.value === 'weekly') {
                    weeklySettings.classList.remove('hidden');
                } else if (e.target.value === 'monthly') {
                    monthlySettings.classList.remove('hidden');
                }
            }
        });

        // Добавление уведомления
        function addNotification() {
            const container = document.getElementById('notifications-container');
            const template = document.querySelector('.notification-template.hidden');
            if (template) {
                const notification = template.cloneNode(true);
                notification.classList.remove('hidden');
                container.appendChild(notification);
            } else {
                console.error('Шаблон уведомления не найден');
            }
        }

        // Обновляем функцию removeNotification
        function removeNotification(button) {
            const notificationItem = button.closest('.notification-edit-item');
            if (!notificationItem) return;
            
            const index = notificationItem.dataset.index;
            const editorModal = document.querySelector('.notification-editor-modal');
            
            if (editorModal) {
                editorModal.classList.add('blur-background');
            }

            const confirmModal = document.createElement('div');
            confirmModal.className = 'delete-confirmation-modal';
            confirmModal.innerHTML = `
                <div class="delete-confirmation-content">
                    <div class="delete-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
                                  stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </div>
                    <h4>Удалить уведомлние?</h4>
                    <p>Это действие нельзя будет отменить</p>
                    <div class="delete-confirmation-actions">
                        <button class="cancel-delete-btn" onclick="closeDeleteConfirmation()">Отмена</button>
                        <button class="confirm-delete-btn" onclick="confirmNotificationDelete(${index})">Удалить</button>
                    </div>
                </div>
            `;
            
            // Предотвращаем ��сплытие событий
            confirmModal.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            document.body.appendChild(confirmModal);
            setTimeout(() => confirmModal.classList.add('visible'), 10);
        }

        // Обновляем функцию closeDeleteConfirmation
        function closeDeleteConfirmation() {
            const confirmModal = document.querySelector('.delete-confirmation-modal');
            const editorModal = document.querySelector('.notification-editor-modal');
            
            if (confirmModal) {
                confirmModal.classList.remove('visible');
                setTimeout(() => {
                    confirmModal.remove();
                    if (editorModal) {
                        editorModal.classList.remove('blur-background');
                    }
                }, 300);
            }
        }

        // Обновляем функцию confirmNotificationDelete
        async function confirmNotificationDelete(index) {
            try {
                const notificationItem = document.querySelector(`.notification-edit-item[data-index="${index}"]`);
                const editorModal = document.querySelector('.notification-editor-modal');
                const eventId = editorModal?.dataset.eventId;

                console.log('Удаление уведомления:', { index, notificationItem, eventId });

                if (!notificationItem || !eventId) {
                    throw new Error('Не удалось найти уведомление или ID события');
                }

                // Собираем оставшиеся ув��домления
                const remainingNotifications = Array.from(
                    document.querySelectorAll('.notification-edit-item')
                )
                .filter(item => item !== notificationItem)
                .map(item => ({
                    time: parseInt(item.querySelector('.notification-time').value),
                    message: item.querySelector('.notification-message-input').value || '⚠ Напоминание: {description}',
                    unit: 'minutes',
                    send_to_chats: true
                }));

                // Сохраняем изменения на сервере
                const response = await fetch(`/events/${eventId}/notifications`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ notifications: remainingNotifications })
                });

                if (!response.ok) {
                    throw new Error('Ошибка при сохранении изменений');
                }

                // Анимация удаления
                const height = notificationItem.offsetHeight;
                notificationItem.style.height = height + 'px';
                
                requestAnimationFrame(() => {
                    notificationItem.style.height = '0';
                    notificationItem.style.opacity = '0';
                    notificationItem.style.marginBottom = '0';
                    notificationItem.style.padding = '0';
                    
                    setTimeout(() => {
                        notificationItem.remove();
                        
                        // Проверяем, нужно ли показать сообщение о пустом списке
                        if (remainingNotifications.length === 0) {
                            const notificationsList = document.querySelector('.notifications-list');
                            if (notificationsList) {
                                const emptyMessage = document.createElement('div');
                                emptyMessage.className = 'empty-notifications';
                                emptyMessage.textContent = 'Нет уведомлений';
                                notificationsList.appendChild(emptyMessage);
                            }
                        }
                    }, 300);
                });

                closeDeleteConfirmation();
                showNotification('Уведомление удалено');

            } catch (error) {
                console.error('Ошибка при удалении уведомления:', error);
                showNotification('Ошибка при удалении уведомления');
                closeDeleteConfirmation();
            }
        }

        // Объединяем все стили в одном месте
        const modalAndNotificationStyles = document.createElement('style');
        modalAndNotificationStyles.textContent = `
            /* Стили для кнопки добавления уведомления */
            .add-notification-btn {
                width: 100%;
                padding: 15px;
                background: #fff;
                border: 2px dashed #ff5722;
                border-radius: 12px;
                color: #ff5722;
                cursor: pointer;
                transition: all 0.3s ease;
                margin: 15px 0;
                font-weight: 500;
                font-size: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                position: relative;
                overflow: hidden;
            }

            .add-notification-btn:hover {
                background: rgba(255, 87, 34, 0.05);
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(255, 87, 34, 0.1);
                animation: pulse 1.5s infinite;
            }

            .add-notification-btn:active {
                transform: translateY(0);
            }

            .add-notification-btn svg {
                transition: all 0.3s ease;
            }

            .add-notification-btn:hover svg {
                transform: rotate(90deg) scale(1.1);
            }

            /* Дбавляем эффект пульсации */
            @keyframes pulse {
                0% { box-shadow: 0 0 0 0 rgba(255, 87, 34, 0.4); }
                70% { box-shadow: 0 0 0 10px rgba(255, 87, 34, 0); }
                100% { box-shadow: 0 0 0 0 rgba(255, 87, 34, 0); }
            }

            /* Адаптивные стили для модального окна */
            @media screen and (max-width: 768px) {
                .notification-editor-modal {
                    width: 95%;
                    padding: 20px 15px;
                    margin: 10px;
                    max-height: 90vh;
                }

                .notification-edit-item {
                    flex-direction: column;
                    gap: 10px;
                    padding: 15px;
                    position: relative;
                    padding-right: 40px;
                }

                .notification-edit-item select,
                .notification-edit-item input {
                    width: 100%;
                    min-width: unset;
                    height: 44px;
                    font-size: 16px;
                }

                .notification-edit-item .remove-notification-btn {
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    width: 28px;
                    height: 28px;
                }

                .modal-actions {
                    flex-direction: column;
                    gap: 10px;
                }

                .modal-actions button {
                    width: 100%;
                    padding: 12px;
                }

                .notifications-list {
                    max-height: calc(70vh - 150px);
                    padding-right: 0;
                    margin: 15px -15px;
                    padding: 0 15px;
                }

                /* Стили для тач-устройств */
                .notification-edit-item select,
                .notification-edit-item input,
                .modal-actions button,
                .add-notification-btn {
                    touch-action: manipulation;
                    -webkit-tap-highlight-color: transparent;
                }
            }

            /* Стили для очень маленьких экранов */
            @media screen and (max-width: 320px) {
                .notification-editor-modal {
                    padding: 15px 10px;
                }

                .notification-edit-item {
                    padding: 12px;
                }

                .notification-edit-item select,
                .notification-edit-item input {
                    font-size: 14px;
                    height: 40px;
                }

                .add-notification-btn {
                    padding: 10px;
                    font-size: 13px;
                }

                .modal-actions button {
                    padding: 10px;
                    font-size: 14px;
                }
            }

            /* Улучшаем доступность фокуса */
            .notification-edit-item select:focus,
            .notification-edit-item input:focus,
            .add-notification-btn:focus,
            .modal-actions button:focus {
                outline: none;
                box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.3);
            }

            /* Стили для устройств с тмной темой */
            @media (prefers-color-scheme: dark) {
                .notification-editor-modal {
                    background: #1a1a1a;
                    color: #fff;
                }

                .notification-edit-item {
                    background: #2d2d2d;
                    border-color: #404040;
                }

                .notification-edit-item select,
                .notification-edit-item input {
                    background: #333;
                    color: #fff;
                    border-color: #404040;
                }

                .add-notification-btn {
                    color: #ff5722;
                    border-color: #ff5722;
                }

                .modal-actions .cancel-btn {
                    background: #333;
                    color: #fff;
                }
            }
        `;

        document.head.appendChild(modalAndNotificationStyles);

        function clearEventForm() {
            document.querySelector('.event-description').textContent = '';
            document.getElementById('dateField').textContent = '';
            document.getElementById('timeField').textContent = '';
            selectedChatIds.clear();
            document.querySelectorAll('.item-list li').forEach(li => li.classList.remove('selected'));
        }

        function getNotificationSettings() {
            const notifications = [];
            const notificationElements = document.querySelectorAll('.notification-template:not(.hidden)');
            
            notificationElements.forEach(element => {
                const timeSelect = element.querySelector('.notification-time');
                const messageInput = element.querySelector('.custom-message');
                
                if (timeSelect && messageInput) {
                    notifications.push({
                        time: parseInt(timeSelect.value),
                        unit: 'minutes',
                        message: messageInput.value || '⚠️ Напоминание: {description}',
                        send_to_chats: true
                    });
                }
            });
            
            return notifications;
        }

        // Функция для получения выранных дней недели
        function getSelectedWeekdays() {
            const weekdayCheckboxes = document.querySelectorAll('.weekday-selector input[type="checkbox"]');
            const selectedDays = [];
            
            weekdayCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    selectedDays.push(parseInt(checkbox.value));
                }
            });
            
            return selectedDays;
        }

        function initializeMonthDays() {
            const monthDaySelect = document.getElementById('month-day');
            if (monthDaySelect) {
                // Очищаем существующие опции
                monthDaySelect.innerHTML = '';
                
                // Добавляем ни месяца
                for (let i = 1; i <= 31; i++) {
                    const option = document.createElement('option');
                    option.value = i;
                    option.textContent = i;
                    monthDaySelect.appendChild(option);
                }
            }
        }

        function formatDateTime(dateTimeStr) {
            try {
                if (!dateTimeStr) return ''; // Прверка на undefined или null

                // Разделяем дату и время
                const [dateStr, timeStr] = dateTimeStr.split(' ');
                if (!dateStr) return '';

                const [day, month, year] = dateStr.split('.');
                
                // Форматируем врем
                const timeFormatted = timeStr || '';
                
                // Определяем, сегодняшняя ли это дата
                const today = new Date();
                const eventDate = new Date(year, month - 1, day);
                
                if (eventDate.toDateString() === today.toDateString()) {
                    return `Сегодня${timeStr ? ` в ${timeStr}` : ''}`;
                }
                
                // Для дат в пределах недели
                const diffDays = Math.floor((eventDate - today) / (1000 * 60 * 60 * 24));
                if (diffDays > -7 && diffDays < 7) {
                    const days = ['воскресенье', 'понедльник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу'];
                    return `В ${days[eventDate.getDay()]}${timeStr ? ` в ${timeStr}` : ''}`;
                }
                
                const months = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
                return `${day} ${months[month - 1]} ${year}${timeStr ? ` в ${timeStr}` : ''}`;
            } catch (error) {
                console.error('Ошибка форматирования даты:', error);
                return dateTimeStr || ''; // Возвращаем исходную строку или пустую строку
            }
        }

        // Добавим функцию фильтрации
        let activeFilters = new Set();

        // Обновим функцию инициалзации филтра
        async function initializeChatFilter() {
            const filterSelect = document.getElementById('chat-filter');
            if (!filterSelect) return;

            // Загружаем и получаем чаты
            const chats = await loadChatNames();
            
            // Очищаем текущие опции
            filterSelect.innerHTML = '';
            
            // Дбавляе опции для каждого чата
            Object.entries(chats).forEach(([id, name]) => {
                const option = document.createElement('option');
                option.value = id;
                option.textContent = name;
                filterSelect.appendChild(option);
            });

            // Добавляем обработчик изменений
            filterSelect.addEventListener('change', (e) => {
                const selectedOptions = [...e.target.selectedOptions];
                activeFilters = new Set(selectedOptions.map(opt => opt.value));
                filterEvents();
            });
        }

        function filterEvents() {
            const events = document.querySelectorAll('.event-item');
            events.forEach(event => {
                const chatTags = event.querySelectorAll('.chat-tag');
                const eventChats = [...chatTags].map(tag => tag.dataset.chatId);
                
                if (activeFilters.size === 0 || 
                    eventChats.some(chatId => activeFilters.has(chatId))) {
                    event.style.display = '';
                    event.style.animation = 'fadeIn 0.3s ease-in';
                } else {
                    event.style.display = 'none';
                }
            });
        }

        function clearFilters() {
            document.getElementById('chat-filter').selectedIndex = -1;
            activeFilters.clear();
            filterEvents();
        }

        // Функция создания элемента события
        function createEventElement(event) {
            const eventWrapper = document.createElement('div');
            eventWrapper.className = 'event-wrapper';

            const eventItem = document.createElement('div');
            eventItem.className = 'event-item';
            eventItem.dataset.eventId = event.id;

            // Создаем основную структуру
            const mainInfo = document.createElement('div');
            mainInfo.className = 'event-main-info';

            const header = document.createElement('div');
            header.className = 'event-header';

            // Описание события
            const description = document.createElement('div');
            description.className = 'event-description';
            description.textContent = event.description;

            // Иконка уведомлений
            const notificationIcon = document.createElement('div');
            notificationIcon.className = 'notification-icon';
            notificationIcon.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
                    <g id="notification">
                        <path d="M26,25.71a22.94,22.94,0,0,1-1-6.58V13.81a8.74,8.74,0,0,0-6-8.5V5a3,3,0,0,0-6,0v.29a8.73,8.73,0,0,0-6.06,8.52v5.32a22.6,22.6,0,0,1-1,6.58,1,1,0,0,0,1,1.29h5.2A4,4,0,0,0,16,30H16a4,4,0,0,0,3.83-3H25a1,1,0,0,0,.8-.4A1,1,0,0,0,26,25.71ZM15,5a1,1,0,0,1,2,0H15Zm1,23H16a2,2,0,0,1-1.71-1h3.48A2,2,0,0,1,16,28Zm3-3H8.24a25.2,25.2,0,0,0,.7-5.87V13.81C8.94,10.06,11.67,7,15,7H16.9C20.26,7,23,10.06,23,13.81v5.32a25.2,25.2,0,0,0,.7,5.87Z"/>
                    </g>
                </svg>
            `;

            const notificationCount = document.createElement('span');
            notificationCount.className = 'notification-count';
            notificationCount.textContent = event.notifications?.length || 0;
            notificationIcon.appendChild(notificationCount);

            // Создаем и добавляем тултип
            const tooltip = createNotificationTooltip(event);
            notificationIcon.appendChild(tooltip);

            // Дата и время
            const datetime = document.createElement('div');
            datetime.className = 'event-datetime';
            datetime.textContent = formatDateTime(event.date);

            // Чаты
            const chats = document.createElement('div');
            chats.className = 'event-chats';
            event.chat_ids.forEach(chatId => {
                const chatTag = document.createElement('span');
                chatTag.className = 'chat-tag';
                chatTag.dataset.chatId = chatId;
                chatTag.textContent = getChatName(chatId);
                chats.appendChild(chatTag);
            });

            // Собираем структуру
            header.appendChild(description);
            header.appendChild(notificationIcon);
            mainInfo.appendChild(header);
            mainInfo.appendChild(datetime);
            mainInfo.appendChild(chats);
            eventItem.appendChild(mainInfo);
            eventWrapper.appendChild(eventItem);

            // Добавляем функционал свайпа для удаления
            addSwipeFunctionality(eventItem, event.id, event.description);

            return eventWrapper;
        }

        // Обновляем функцию createNotificationTooltip
        function createNotificationTooltip(event) {
            const tooltip = document.createElement('div');
            tooltip.className = 'notification-tooltip';
            
            const content = document.createElement('div');
            content.className = 'tooltip-content';
            
            const notificationList = createNotificationList(event.notifications);
            content.appendChild(notificationList);
            
            const editButton = document.createElement('button');
            editButton.className = 'edit-notifications-btn';
            editButton.textContent = 'Редактировать';
            editButton.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Кнопка редактирования нажата', event); // Добавляем отладочный вывод
                openNotificationEditor(event);
            };
            content.appendChild(editButton);
            
            tooltip.appendChild(content);
            
            tooltip.addEventListener('wheel', (e) => e.stopPropagation());
            tooltip.addEventListener('click', (e) => e.stopPropagation());
            
            return tooltip;
        }

        // Обновляем функцию openNotificationEditor
        function openNotificationEditor(event) {
            console.log('openNotificationEditor вызвана', event);

            if (!event || !event.id) {
                console.error('Событие не определено или отсутствует ID');
                return;
            }

            document.body.style.overflow = 'hidden';

            // Удаляем существующие тултиы и модальные окна
            document.querySelectorAll('.notification-tooltip, .modal-overlay').forEach(el => el.remove());

            const modalOverlay = document.createElement('div');
            modalOverlay.className = 'modal-overlay';
            
            const modal = document.createElement('div');
            modal.className = 'notification-editor-modal';
            modal.dataset.eventId = event.id;

            modal.innerHTML = `
                <h3>Редактирование уведомлений</h3>
                <div class="notifications-list">
                    ${(event.notifications || []).map((notification, index) => `
                        <div class="notification-edit-item" data-index="${index}">
                            <select class="notification-time">
                                <option value="5" ${notification.time === 5 ? 'selected' : ''}>За 5 минут</option>
                                <option value="15" ${notification.time === 15 ? 'selected' : ''}>За 15 минут</option>
                                <option value="30" ${notification.time === 30 ? 'selected' : ''}>За 30 минут</option>
                                <option value="60" ${notification.time === 60 ? 'selected' : ''}>За 1 час</option>
                                <option value="1440" ${notification.time === 1440 ? 'selected' : ''}>За 1 день</option>
                            </select>
                            <input type="text" class="notification-message-input" 
                                   value="${notification.message || ''}" 
                                   placeholder="Текст уведомления">
                            <button class="remove-notification-btn" onclick="removeNotification(this)">×</button>
                        </div>
                    `).join('')}
                </div>
                <div class="bottom-actions">
                    <button class="add-notification-btn" id="addNotificationBtn">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="12" y1="5" x2="12" y2="19"></line>
                            <line x1="5" y1="12" x2="19" y2="12"></line>
                        </svg>
                        Добавить уведомление
                    </button>
                    <div class="modal-actions">
                        <button class="save-btn" onclick="saveNotificationChanges(${event.id})">Соранить</button>
                        <button class="cancel-btn" onclick="closeNotificationEditor()">Отмена</button>
                    </div>
                </div>
            `;

            // Добавляем обработчики событий
            modal.addEventListener('click', e => e.stopPropagation());
            modalOverlay.addEventListener('click', () => closeNotificationEditor());

            // Добавляем обработчик для кнопки добавления уведомления
            const addButton = modal.querySelector('#addNotificationBtn');
            if (addButton) {
                addButton.addEventListener('click', addNotificationToEditor);
            }

            // Добавляем модальное окно в DOM
            modalOverlay.appendChild(modal);
            document.body.appendChild(modalOverlay);

            // Делаем модальное окно видимым
            requestAnimationFrame(() => {
                modalOverlay.classList.add('visible');
            });

            // Добавляем обработчики клавиатуры
            setTimeout(addKeyboardHandlers, 100);

            console.log('Модальное окно создано:', modal);
        }

        function closeNotificationEditor() {
            const modalOverlay = document.querySelector('.modal-overlay');
            if (modalOverlay) {
                modalOverlay.classList.remove('visible');
                document.body.style.overflow = '';
                
                // После закрытия модального окна обновляем список событий,
                // чтобы пересоздать тултипы
                setTimeout(() => {
                    modalOverlay.remove();
                    loadEventList(); // Обновляем список событий
                }, 300);
            }
        }

        function createNotificationList(notifications) {
            const list = document.createElement('div');
            list.className = 'notification-list';

            if (!notifications || notifications.length === 0) {
                const emptyMessage = document.createElement('div');
                emptyMessage.className = 'empty-notifications';
                emptyMessage.textContent = 'Нет уведомлений';
                list.appendChild(emptyMessage);
                return list;
            }

            // Группируем уведомления по времени
            const groups = {
                'Скоро': [],
                'Сегодня': [],
                'Завтра': [],
                'Позже': []
            };

            notifications.forEach(notification => {
                const time = parseInt(notification.time);
                if (time <= 15) {
                    groups['Скоро'].push(notification);
                } else if (time <= 60) {
                    groups['Сегодня'].push(notification);
                } else if (time <= 1440) {
                    groups['Завтра'].push(notification);
                } else {
                    groups['Позже'].push(notification);
                }
            });

            // Создаем группы
            Object.entries(groups).forEach(([groupName, items]) => {
                if (items.length > 0) {
                    const group = document.createElement('div');
                    group.className = 'notification-group';

                    const title = document.createElement('div');
                    title.className = 'notification-group-title';
                    title.textContent = groupName;
                    group.appendChild(title);

                    items.forEach((notification, index) => {
                        const item = document.createElement('div');
                        item.className = 'notification-item';
                        item.style.animationDelay = `${index * 0.1}s`;

                        const timeText = formatNotificationTime(notification.time);
                        item.innerHTML = `
                            <div class="notification-time">${timeText}</div>
                            <div class="notification-message">${notification.message}</div>
                        `;

                        group.appendChild(item);
                    });

                    list.appendChild(group);
                }
            });

            return list;
        }

        function formatNotificationTime(minutes) {
            if (minutes < 60) {
                return `За ${minutes} минут`;
            } else if (minutes === 60) {
                return 'За 1 час';
            } else if (minutes === 1440) {
                return 'За 1 день';
            } else {
                const hours = Math.floor(minutes / 60);
                return `За ${hours} ${declOfNum(hours, ['час', 'часа', 'часов'])}`;
            }
        }

        function declOfNum(n, titles) {
            return titles[(n % 10 === 1 && n % 100 !== 11) ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2];
        }

        // Обновляем стили для модальных окон и элементов управления
        const modalStyles = document.createElement('style');
        modalStyles.textContent = `
            /* Z-index для модальных окон */
            .modal-overlay {
                z-index: 9999 !important;
            }

            .delete-confirmation-modal {
                z-index: 10000 !important;
            }

            .delete-confirmation-content {
                z-index: 10001 !important;
            }

            /* Стили для кнопки удаления */
            .notification-edit-item .remove-notification-btn {
                background: none;
                border: none;
                color: #ff5722;
                font-size: 24px;
                cursor: pointer;
                padding: 0 8px;
                transition: all 0.3s ease;
                transform: rotate(0deg);
                opacity: 0.7;
                line-height: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border-radius: 50%;
            }

            .notification-edit-item .remove-notification-btn:hover {
                color: #f44336;
                opacity: 1;
                transform: rotate(90deg);
                background-color: rgba(244, 67, 54, 0.1);
            }

            /* Стили для select времени */
            .notification-edit-item select {
                appearance: none;
                background: #f5f5f5 url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23666' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e") no-repeat right 8px center;
                background-size: 16px;
                padding: 10px 35px 10px 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
                color: #333;
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 140px;
            }

            .notification-edit-item select:hover {
                border-color: #ff5722;
                background-color: #fff;
            }

            .notification-edit-item select:focus {
                outline: none;
                border-color: #ff5722;
                box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1);
                background-color: #fff;
            }

            /* Стили для input сообщения */
            .notification-edit-item input {
                flex: 1;
                padding: 10px 15px;
                border: 1px solid #ddd;
                border-radius: 8px;
                font-size: 14px;
                color: #333;
                transition: all 0.2s ease;
                background: #f5f5f5;
            }

            .notification-edit-item input:hover {
                border-color: #ff5722;
                background-color: #fff;
            }

            .notification-edit-item input:focus {
                outline: none;
                border-color: #ff5722;
                box-shadow: 0 0 0 3px rgba(255, 87, 34, 0.1);
                background-color: #fff;
            }

            /* Стили для элемента уведомления */
            .notification-edit-item {
                display: flex;
                gap: 12px;
                margin-bottom: 15px;
                padding: 12px;
                background: #fff;
                border-radius: 10px;
                border: 1px solid #eee;
                transition: all 0.2s ease;
                align-items: center;
            }

            .notification-edit-item:hover {
                border-color: #ff5722;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
            }

            /* Стили для скроллбара */
            .notifications-list::-webkit-scrollbar {
                width: 6px;
            }

            .notifications-list::-webkit-scrollbar-track {
                background: #f1f1f1;
                border-radius: 3px;
            }

            .notifications-list::-webkit-scrollbar-thumb {
                background: #ff5722;
                border-radius: 3px;
            }

            /* Темная тема */
            @media (prefers-color-scheme: dark) {
                .notification-edit-item {
                    background: #2d2d2d;
                    border-color: #404040;
                }

                .notification-edit-item select,
                .notification-edit-item input {
                    background: #333;
                    color: #fff;
                    border-color: #404040;
                }

                .notification-edit-item select:hover,
                .notification-edit-item input:hover,
                .notification-edit-item select:focus,
                .notification-edit-item input:focus {
                    background: #404040;
                    border-color: #ff5722;
                }
            }
        `;

        document.head.appendChild(modalStyles);

        // Обновляем стили дл мобильной версии
        const mobileStyles = document.createElement('style');
        mobileStyles.textContent = `
            @media screen and (max-width: 768px) {
                /* Изменяем структуру модального окна */
                .notification-editor-modal {
                    display: flex;
                    flex-direction: column;
                    height: 90vh;
                    padding: 0;
                    margin: 0;
                    position: relative;
                }

                /* Стили для заголовка */
                .notification-editor-modal h3 {
                    padding: 20px;
                    margin: 0;
                    border-bottom: 1px solid #eee;
                    background: #fff;
                    position: sticky;
                    top: 0;
                    z-index: 2;
                }

                /* Контейнер для списка уведомлений */
                .notifications-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 15px;
                    margin: 0;
                    padding-bottom: 140px; /* Место для кнопки и действий */
                }

                /* Фиксированный контейнер для кнопок внизу */
                .bottom-actions {
                    position: fixed;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    background: #fff;
                    padding: 15px;
                    border-top: 1px solid #eee;
                    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
                    z-index: 3;
                    transform: translateZ(0);
                    transition: transform 0.3s ease;
                }

                /* Стили для случая, когда клавиатура открыта */
                .keyboard-open .bottom-actions {
                    position: sticky;
                    bottom: 0;
                    transform: translateY(0);
                }

                /* Добавляем отступ для контента при открытой клавиатуре */
                .keyboard-open .notifications-list {
                    padding-bottom: 20px;
                }

                .add-notification-btn {
                    margin: 0 0 10px 0;
                }

                .modal-actions {
                    margin: 0;
                }

                /* Улучшаем отображение еемента уведомления */
                .notification-edit-item {
                    position: relative;
                    padding-right: 40px;
                    background: #fff;
                    margin-bottom: 10px;
                    border-radius: 8px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
                }

                /* Добавляем обработку фокуса для мобильных устройств */
                .notification-edit-item input:focus {
                    position: relative;
                    z-index: 1;
                }
            }

            /* Стили для очень маленьки�� экранов */
            @media screen and (max-width: 320px) {
                .notification-editor-modal {
                    height: 100vh;
                }

                .notifications-list {
                    padding: 10px;
                    padding-bottom: 130px;
                }

                .bottom-actions {
                    padding: 10px;
                }
            }
        `;

        document.head.appendChild(mobileStyles);

        // Добавляем обработчики для определения состояния клавиатуры
        function addKeyboardHandlers() {
            const modalElement = document.querySelector('.notification-editor-modal');
            if (!modalElement) return;

            const inputs = modalElement.querySelectorAll('input, textarea');
            inputs.forEach(input => {
                input.addEventListener('focus', () => {
                    modalElement.classList.add('keyboard-open');
                    // Прокручиваем до активного элемента
                    setTimeout(() => {
                        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }, 300);
                });

                input.addEventListener('blur', () => {
                    modalElement.classList.remove('keyboard-open');
                });
            });
        }

        // Добавляем функцию для сохранения изменений уведомлений
        function saveNotificationChanges(eventId) {
            try {
                // Собираем все уведомления из формы
                const notifications = Array.from(document.querySelectorAll('.notification-edit-item')).map(item => ({
                    time: parseInt(item.querySelector('.notification-time').value),
                    message: item.querySelector('.notification-message-input').value || '⚠️ Напоминание: {description}',
                    unit: 'minutes',
                    send_to_chats: true
                }));

                // Проверяем, есть ли хотя бы одно уведомление
                if (notifications.length === 0) {
                    showNotification('Добавьте хотя бы одно уведомление');
                    return;
                }

                // Отправляем запрос на сервер
                fetch(`/events/${eventId}/notifications`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ notifications })
                })
                .then(response => response.json())
                .then(result => {
                    if (result.success) {
                        closeNotificationEditor();
                        showNotification('Уведомления успешно сохранены');
                    } else {
                        throw new Error(result.message || 'Ошибка при сохранении');
                    }
                })
                .catch(error => {
                    console.error('Ошибка при сохранении:', error);
                    showNotification('Ошибка: ' + error.message);
                });

            } catch (error) {
                console.error('Ошибка при сохранении:', error);
                showNotification('Ошибка: ' + error.message);
            }
        }

        // Добавляем стили для списка событий
        const eventListStyles = document.createElement('style');
        eventListStyles.textContent = `
            /* Стили для списка событий */
            .event-wrapper {
                position: relative;
                margin-bottom: 15px;
                z-index: 1;
            }

            .event-wrapper:hover {
                z-index: 2;
            }

            .event-item {
                background-color: #fff;
                border-left: 4px solid #FF5722;
                border-radius: 4px;
                padding: 15px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                transition: all 0.3s ease;
                overflow: visible;
            }

            .event-item:hover {
                transform: translateX(5px);
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
            }

            .event-main-info {
                margin-bottom: 10px;
                overflow: visible;
            }

            .event-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                position: relative;
                overflow: visible;
            }

            .event-description {
                font-size: 16px;
                color: #333;
                margin-bottom: 8px;
            }

            .event-datetime {
                font-size: 14px;
                color: #666;
            }

            .event-chats {
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
                margin-top: 10px;
            }

            .chat-tag {
                background-color: #f5f5f5;
                color: #666;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                display: inline-flex;
                align-items: center;
                transition: all 0.2s ease;
            }

            .chat-tag::before {
                content: '#';
                margin-right: 4px;
                color: #FF5722;
            }

            .chat-tag:hover {
                background-color: #FF5722;
                color: white;
                transform: translateY(-2px);
            }

            .empty-event-list {
                text-align: center;
                padding: 20px;
                color: #666;
                font-style: italic;
            }

            /* Адаптивные стили */
            @media screen and (max-width: 768px) {
                .event-item {
                    padding: 12px;
                }

                .event-description {
                    font-size: 14px;
                }

                .event-datetime {
                    font-size: 12px;
                }

                .chat-tag {
                    font-size: 11px;
                    padding: 3px 6px;
                }
            }
        `;

        document.head.appendChild(eventListStyles);

        // Добавляем стили для свайпа и удаления
        const swipeStyles = document.createElement('style');
        swipeStyles.textContent = `
            .delete-threshold-reached {
                border-left-color: red !important;
            }

            .confirmation-message {
                display: none;
                text-align: center;
                padding: 20px;
                color: #333;
            }

            .confirmation-buttons {
                display: none;
                justify-content: center;
                gap: 10px;
                padding: 10px;
            }

            .confirmation-buttons button {
                padding: 8px 20px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .confirmation-buttons button:first-child {
                background-color: #ff5722;
                color: white;
            }

            .confirmation-buttons button:last-child {
                background-color: #f5f5f5;
                color: #666;
            }

            .confirmation-buttons button:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
        `;

        document.head.appendChild(swipeStyles);

        // Добавляем стили для иконки уведомлений
        const notificationIconStyles = document.createElement('style');
        notificationIconStyles.textContent = `
            /* Стили для иконки уведомлений */
            .notification-icon {
                position: relative;
                display: inline-flex;
                align-items: center;
                margin-left: 10px;
                cursor: pointer;
                z-index: 2;
            }

            .notification-icon svg {
                width: 24px;
                height: 24px;
                fill: #666;
                transition: fill 0.2s ease;
            }

            .notification-icon:hover svg {
                fill: #FF5722;
            }

            .notification-count {
                position: absolute;
                top: -8px;
                right: -8px;
                background-color: #FF5722;
                color: white;
                font-size: 12px;
                padding: 2px 6px;
                border-radius: 10px;
                min-width: 18px;
                text-align: center;
            }

            /* Стили для всплывающей подсказ��и */
            .notification-tooltip {
                position: absolute;
                top: 100%;
                right: 0;
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
                padding: 12px;
                width: 300px;
                max-height: 400px;
                overflow-y: auto;
                z-index: 1000;
                opacity: 0;
                visibility: hidden;
                transform: translateY(10px);
                transition: all 0.3s ease;
                margin-top: 10px;
            }

            .notification-tooltip .tooltip-content {
                position: relative;
                z-index: 1001;
            }

            /* Стрелка для тултипа */
            .notification-tooltip::before {
                content: '';
                position: absolute;
                top: -8px;
                right: 15px;
                width: 0;
                height: 0;
                border-left: 8px solid transparent;
                border-right: 8px solid transparent;
                border-bottom: 8px solid white;
            }

            /* Показываем тултип при наведении */
            .notification-icon:hover .notification-tooltip {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            /* Оставляем тултип видимым при наведении на него */
            .notification-tooltip:hover {
                opacity: 1;
                visibility: visible;
                transform: translateY(0);
            }

            /* Адаптивные стили для мобильных устройств */
            @media screen and (max-width: 768px) {
                .notification-tooltip {
                    position: fixed;
                    top: 50% !important;
                    left: 50% !important;
                    transform: translate(-50%, -50%);
                    width: 90%;
                    max-width: 400px;
                    max-height: 80vh;
                    margin-top: 0;
                }

                .notification-tooltip::before {
                    display: none;
                }

                .notification-tooltip.visible {
                    transform: translate(-50%, -50%);
                }
            }
        `;

        document.head.appendChild(notificationIconStyles);

        const tooltipStyles = document.createElement('style');
        tooltipStyles.textContent = `
            /* Стили для групп уведомлений в тултипе */
            .notification-group {
                margin-bottom: 15px;
            }

            .notification-group:last-child {
                margin-bottom: 0;
            }

            .notification-group-title {
                font-size: 12px;
                color: #999;
                text-transform: uppercase;
                margin-bottom: 8px;
                padding-left: 5px;
            }

            .notification-item {
                padding: 8px 12px;
                background: #f8f8f8;
                border-radius: 6px;
                margin-bottom: 6px;
                transition: all 0.2s ease;
                animation: fadeIn 0.3s ease forwards;
                opacity: 0;
                transform: translateX(-10px);
            }

            .notification-item:hover {
                background: #f0f0f0;
                transform: translateX(5px);
            }

            .notification-item:last-child {
                margin-bottom: 0;
            }

            .notification-time {
                font-size: 13px;
                color: #FF5722;
                font-weight: 500;
                margin-bottom: 4px;
            }

            .notification-message {
                font-size: 14px;
                color: #666;
            }

            .edit-notifications-btn {
                width: 100%;
                padding: 10px;
                margin-top: 12px;
                background: #f5f5f5;
                border: none;
                border-radius: 6px;
                color: #666;
                cursor: pointer;
                transition: all 0.2s ease;
            }

            .edit-notifications-btn:hover {
                background: #FF5722;
                color: white;
                transform: translateY(-1px);
            }

            @keyframes fadeIn {
                to {
                    opacity: 1;
                    transform: translateX(0);
                }
            }

            /* Темная тема */
            @media (prefers-color-scheme: dark) {
                .notification-item {
                    background: #2d2d2d;
                }

                .notification-item:hover {
                    background: #333;
                }

                .notification-message {
                    color: #aaa;
                }

                .edit-notifications-btn {
                    background: #333;
                    color: #fff;
                }

                .edit-notifications-btn:hover {
                    background: #FF5722;
                }
            }
        `;

        document.head.appendChild(tooltipStyles);

        // Функция для добавления нового уведомления
        function addNotificationToEditor() {
            console.log('Добавление нового уведомления');
            const notificationsList = document.querySelector('.notifications-list');
            if (!notificationsList) {
                console.error('Список уведомлений не найден');
                return;
            }

            const newIndex = notificationsList.querySelectorAll('.notification-edit-item').length;
            
            const newNotification = document.createElement('div');
            newNotification.className = 'notification-edit-item';
            newNotification.dataset.index = newIndex;
            newNotification.style.opacity = '0';
            newNotification.style.transform = 'translateY(-20px)';
            
            newNotification.innerHTML = `
                <select class="notification-time">
                    <option value="5">За 5 минут</option>
                    <option value="15">За 15 минут</option>
                    <option value="30">За 30 минут</option>
                    <option value="60">За 1 час</option>
                    <option value="1440">За 1 день</option>
                </select>
                <input type="text" class="notification-message-input" 
                       placeholder="Текст уведомления">
                <button class="remove-notification-btn" onclick="removeNotification(this)">×</button>
            `;
            
            notificationsList.appendChild(newNotification);
            
            // Анимация появления
            requestAnimationFrame(() => {
                newNotification.style.transition = 'all 0.3s ease';
                newNotification.style.opacity = '1';
                newNotification.style.transform = 'translateY(0)';
            });

            // Фокус на новом поле ввода
            setTimeout(() => {
                const input = newNotification.querySelector('.notification-message-input');
                if (input) {
                    input.focus();
                    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
        }

        // Добавляем стили для модального окна удаления
        const deleteModalStyles = document.createElement('style');
        deleteModalStyles.textContent = `
            .delete-confirmation-modal {
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                background: rgba(0, 0, 0, 0.5) !important;
                display: flex !important;
                align-items: center !important;
                justify-content: center !important;
                opacity: 0;
                visibility: hidden;
                transition: all 0.3s ease;
                z-index: 10000 !important;
            }

            .delete-confirmation-modal.visible {
                opacity: 1 !important;
                visibility: visible !important;
            }

            .delete-confirmation-content {
                background: white;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                transform: scale(0.9);
                transition: transform 0.3s ease;
                max-width: 400px;
                width: 90%;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }

            .delete-confirmation-modal.visible .delete-confirmation-content {
                transform: scale(1);
            }

            .delete-icon {
                width: 48px;
                height: 48px;
                margin: 0 auto 20px;
                color: #ff5722;
                animation: shake 0.5s ease-in-out;
            }

            @keyframes shake {
                0%, 100% { transform: rotate(0); }
                20%, 60% { transform: rotate(8deg); }
                40%, 80% { transform: rotate(-8deg); }
            }

            .delete-confirmation-content h4 {
                color: #333;
                font-size: 20px;
                margin: 0 0 10px;
            }

            .delete-confirmation-content p {
                color: #666;
                margin: 0 0 25px;
                font-size: 14px;
            }

            .delete-confirmation-actions {
                display: flex;
                justify-content: center;
                gap: 12px;
            }

            .delete-confirmation-actions button {
                padding: 10px 24px;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 14px;
                font-weight: 500;
            }

            .confirm-delete-btn {
                background: #ff5722;
                color: white;
            }

            .confirm-delete-btn:hover {
                background: #f44336;
                transform: translateY(-1px);
            }

            .cancel-delete-btn {
                background: #f5f5f5;
                color: #666;
            }

            .cancel-delete-btn:hover {
                background: #e0e0e0;
                transform: translateY(-1px);
            }

            /* Эффект размытия для фона */
            .blur-background {
                filter: blur(3px);
                pointer-events: none;
            }

            /* Адаптивные стили */
            @media screen and (max-width: 480px) {
                .delete-confirmation-content {
                    padding: 20px;
                    margin: 20px;
                }

                .delete-confirmation-actions {
                    flex-direction: column;
                }

                .delete-confirmation-actions button {
                    width: 100%;
                    padding: 12px;
                }
            }

            /* Темная тема */
            @media (prefers-color-scheme: dark) {
                .delete-confirmation-content {
                    background: #1a1a1a;
                }

                .delete-confirmation-content h4 {
                    color: #fff;
                }

                .delete-confirmation-content p {
                    color: #aaa;
                }

                .cancel-delete-btn {
                    background: #333;
                    color: #fff;
                }

                .cancel-delete-btn:hover {
                    background: #444;
                }
            }
        `;

        document.head.appendChild(deleteModalStyles);