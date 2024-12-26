export const ONBOARDING_STEPS = [
    {
        id: 'welcome',
        element: '.welcomeScreen',
        content: {
            audio: 'welcome.mp3',
            text: 'Добро пожаловать! Сейчас я расскажу об основных функциях приложения'
        }
    },
    {
        id: 'eventsList',
        element: '.eventsList',
        content: {
            audio: 'events-list.mp3',
            text: 'На этом экране отображаются все созданные события'
        }
    },
    {
        id: 'createButton',
        element: '.createButton',
        content: {
            audio: 'create-button.mp3',
            text: 'Для создания нового события нажмите эту кнопку'
        }
    },
    {
        id: 'description',
        element: '.descriptionField',
        content: {
            audio: 'description.mp3',
            text: 'В этом поле введите описание предстоящего события'
        }
    },
    {
        id: 'dateTime',
        element: '.dateTimePicker',
        content: {
            audio: 'date-time.mp3',
            text: 'Выберите дату и время события. Календарь позволяет быстро выбрать нужный день, а часы - точное время проведения'
        }
    },
    {
        id: 'repeat',
        element: '.repeatSettings',
        content: {
            audio: 'repeat.mp3',
            text: 'Здесь можно настроить регулярное повторение. Доступны ежедневные, еженедельные и ежемесячные повторы. Для еженедельных укажите дни недели, для ежемесячных - число месяца'
        }
    },
    {
        id: 'notifications',
        element: '.notificationSettings',
        content: {
            audio: 'notifications.mp3',
            text: 'Настройте уведомления, чтобы получать напоминания заранее. Можно добавить несколько уведомлений с разным временем оповещения до начала события'
        }
    },
    {
        id: 'chats',
        element: '.chatSelector',
        content: {
            audio: 'chats.mp3',
            text: 'Выберите чаты для отправки уведомлений'
        }
    },
    {
        id: 'finish',
        element: '.submitButton',
        content: {
            audio: 'finish.mp3',
            text: 'Для завершения нажмите кнопку "Создать"'
        }
    }
]; 