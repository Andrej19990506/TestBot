import logging
import re
import asyncio
import json
import os
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import CallbackContext
from user_states import set_user_state, get_user_state
from utils.date_parser import parse_event_input, calculate_delay
from utils.chat_manager import ChatManager

EVENTS_FILE_PATH = 'events.json'
if not os.path.exists(EVENTS_FILE_PATH):
    with open(EVENTS_FILE_PATH, 'w') as f:
        json.dump({}, f)

class CustomMessageHandler:
    def __init__(self, mediator, chat_manager, chat_ids):
        self.chat_manager = chat_manager
        self.chat_ids = chat_ids
        self.mediator = mediator
        self.mediator.register_message_handler(self)
        self.scheduler = mediator.scheduler
        
    def process_message(self, message):
        # Логика обработки сообщения
        logging.info(f"Processing message: {message}")
        # Инициируйте обновление инвентаризации при необходимости
        self.mediator.notify_inventory_update()    
    
    async def select_chat(self, update: Update, context: CallbackContext) -> None:
        user_id = update.callback_query.from_user.id
        selected_chat_name = update.callback_query.data.split('_')[1]  # Имя выбранного чата

        if 'selected_chat_ids' not in context.user_data:
            context.user_data['selected_chat_ids'] = []

        if selected_chat_name in self.chat_ids:
            selected_chat_id = self.chat_ids[selected_chat_name]
            if selected_chat_id not in context.user_data['selected_chat_ids']:
                context.user_data['selected_chat_ids'].append(selected_chat_id)
                logging.info(f"Чат '{selected_chat_name}' добавлен в выбранные.")
            else:
                context.user_data['selected_chat_ids'].remove(selected_chat_id)
                logging.info(f"Чат '{selected_chat_name}' удален из выбранных.")

        logging.info(f"Текущие выбранные чаты: {context.user_data['selected_chat_ids']}")
        await update.callback_query.answer()

        # Получаем новую клавиатуру
        keyboard = await self.get_chat_selection_keyboard(context.user_data['selected_chat_ids'], self.chat_ids)

        # Проверяем, изменилось ли что-либо
        current_markup = update.callback_query.message.reply_markup
        if keyboard != current_markup:
            await update.callback_query.message.edit_reply_markup(reply_markup=keyboard)
        else:
            logging.debug("Клавиатура не изменилась. Редактирование пропущено.")
        
    async def _reset_chat_selection(self, context: CallbackContext) -> None:
        """Сброс состояния выбора чатов."""
        context.user_data['selected_chat_ids'] = []

    async def get_chat_selection_keyboard(self, selected_chats, chat_ids) -> InlineKeyboardMarkup:
        keyboard = []

        if not chat_ids:
            logging.warning("Нет доступных чатов для отображения.")
            return InlineKeyboardMarkup([])

        for chat_name, chat_id in chat_ids.items():
            if chat_id in selected_chats:
                button_label = f"✅ {chat_name}"  # Чат выбран
            else:
                button_label = f"🔲 {chat_name}"  # Чат не выбран
            
            keyboard.append([InlineKeyboardButton(button_label, callback_data=f"select_{chat_name}")])

        keyboard.append([InlineKeyboardButton("🌟 Выбрать все филиалы", callback_data='select_all_groups')])        
        keyboard.append([InlineKeyboardButton("✅ Подтвердить выбор", callback_data='confirm_event')])
        keyboard.append([InlineKeyboardButton("🔙 Назад", callback_data='back_to_menu')])

        return InlineKeyboardMarkup(keyboard)

    async def process_start(self, update: Update, context: CallbackContext) -> None:
        query = update.callback_query
        user_id = query.from_user.id
        await query.answer()
        
        logging.debug(f"Вызван process_start для user_id: {user_id}")

        
        webapp_url = 'https://124c-176-215-122-184.ngrok-free.app'
        
        try:
            keyboard = [
                [InlineKeyboardButton("Добавить событие", web_app={'url': webapp_url})],
                [InlineKeyboardButton("Показать события", callback_data='show_events')],
                [InlineKeyboardButton("Инвентаризация", callback_data='inventory')],
                [InlineKeyboardButton("Помощь", callback_data='help')]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

            await query.edit_message_text(
                text='Выберите действие:',
                reply_markup=reply_markup
            )
            logging.debug("Сообщение успешно обновлено в process_start")
        except Exception as e:
            logging.error(f"Ошибка при редактировании сообщения в process_start: {e}")

        context.user_data['current_menu'] = 'main_menu'
        set_user_state(user_id, 'main_menu')

    async def add_event(self, update: Update, context: CallbackContext) -> None:
        user_id = update.effective_user.id
        logging.debug(f"Начало процесса добавления события для пользоват��ля {user_id}")

        current_state = get_user_state(user_id)
        logging.warning(f"Текущее состояние для пользователя {user_id}: {current_state}")
        if current_state != 'adding_event':
            await update.message.reply_text("Вы не находитесь в режиме ввода события.")
            logging.warning(f"Неожиданное состояние пользователя {user_id}. Ожидалось 'adding_event'.")
            return

        event_input = update.message.text.strip()
        logging.warning(f"Получен ввод события от пользователя {user_id}: {event_input}")

        selected_chat_ids = context.user_data.get('selected_chat_ids', [])
        selected_chat_names = [self.chat_manager.get_chat_name_by_id(chat_id) for chat_id in selected_chat_ids]
        logging.warning(f"Выбранные идентификаторы чатов: {selected_chat_ids}")
        logging.warning(f"Выбранные чаты: {selected_chat_names}")

        if not selected_chat_ids:
            await update.message.reply_text("Ошибка! Не выбраны чаты для добавления событий.")
            return

        try:
            logging.debug("Вызов parse_event_input...")
            parsed_data = parse_event_input(event_input)
            logging.debug("Функция parse_event_input завершена.")
            date_str = parsed_data['date_str']
            time_str = parsed_data['time_str']
            description = parsed_data['description']

            new_event = {
                'index': len(self.chat_manager.load_events(user_id)),
                'date': date_str,
                'description': description,
                'time': time_str,
            }
            self.chat_manager.save_event(user_id, new_event)
            logging.info(f"Событие добавлено: {new_event}")

            # Использование функции для вычисления задержки
            event_datetime_str = f"{date_str} {time_str}"
            delay = calculate_delay(event_datetime_str)

            for chat_id in selected_chat_ids:
                logging.debug(f"Планируем отправку сообщения в чат: {chat_id} через {delay} секунд.")
                context.job_queue.run_once(
                    self.scheduler.send_scheduled_message,  # используйте метод из объекта scheduler
                    when=delay,
                    data={'chat_id': chat_id, 'message': f"Напоминание о событии: {description} в {time_str}."}
                )

            msg = await update.message.reply_text(
                f"Событие добавлено и будет отправлено в чат(ы): {', '.join(selected_chat_names)} в {event_datetime_str}."
            )

            await asyncio.sleep(2)
            await context.bot.delete_message(chat_id=msg.chat.id, message_id=msg.message_id)
            set_user_state(user_id, 'showing_events')
            await self.show_events_via_message(update, context, action="add")

        except ValueError as e:
            logging.error(f"Ошибка при добавлении события: {e}")
            await update.message.reply_text(f"Ошибка: {e}")


        
    async def delete_event(self, update: Update, context: CallbackContext, event_index: int) -> None:
        query = update.callback_query  # Получаем callback_query
        user_id = query.from_user.id

        try:
            user_events = self.chat_manager.load_events(user_id)  # загружаем события пользователя
            logging.info(f"Загружено событий для пользователя {user_id}: {user_events}")

            if event_index < 0 or event_index >= len(user_events):
                await query.answer("⚠️ Событие не найдено.")
                return

            deleted_event = user_events.pop(event_index)  # Удаляем событие
            self.chat_manager.save_events_to_file()

            logging.info(f'Событие удалено: {deleted_event["date"]} - {deleted_event["description"]}')

            await query.edit_message_text(
                text=f"✅ Событие успешно удалено:\n\n"
                    f"Дата: {deleted_event['date']}\n"
                    f"Описание: {deleted_event['description']}\n"
                    f"Время: {deleted_event['time']}\n"
            )
            
                # Проверяем, остались ли события
            if user_events:  
                await self.show_events(query, context)
            else:
                # Если нет событий, удаляем пользовател из словаря событий
                if user_id in self.chat_manager.events:  # Перед удалением убедитесь, что ключ существует
                    del self.chat_manager.events[user_id]
                await self.process_start(update, context)
        except KeyError as ke:
            logging.error(f'Ключевая ошибка: {ke}')
            await query.answer("⚠️ Одно из событий недоступно.")
        except Exception as e:
            logging.error(f'Ошибка при удалении события: {e}')
            await query.answer("⚠️ Произошла ошибка при удалении события.")
            
    async def show_events(self, query, context: CallbackContext) -> None:
        user_id = query.from_user.id if query else context.user_data.get('user_id')
        events = self.chat_manager.load_events(user_id)  # Загружаем события текущего пользователя

        keyboard = []

        if events:
            for index, event in enumerate(events):
                keyboard.append([
                    InlineKeyboardButton(f"{event['date']} - {event['description']}", callback_data=f'show_event_details_{index}')
                ])
            keyboard.append([InlineKeyboardButton("Назад", callback_data='back_to_menu')])
            reply_markup = InlineKeyboardMarkup(keyboard)

            await query.edit_message_text(
                text="Выберите событие для редактирования или удаления:",
                reply_markup=reply_markup
            )
        else:
            # Добавляем кнопки для добавления со��ытия и возвращения в главное меню
            keyboard.append([InlineKeyboardButton("Добавить событие", callback_data='add_event')])
            keyboard.append([InlineKeyboardButton("Главное меню", callback_data='process_start')])
            reply_markup = InlineKeyboardMarkup(keyboard)

            message = await query.edit_message_text(
                text="У вас нет добавленных событий.",
                reply_markup=reply_markup
            )
            context.user_data['message_ids'] = [message.message_id]

    async def show_events_via_message(self, update: Update, context: CallbackContext, action: str = "") -> None:
        user_id = update.effective_user.id
        chat_id = update.effective_chat.id
        events = self.chat_manager.load_events(user_id)  # Загружаем события текущего пользователя

        # Удаляем предыдущие сообщения
        if 'message_ids' in context.user_data:
            for message_id in context.user_data['message_ids']:
                try:
                    await context.bot.delete_message(chat_id=chat_id, message_id=message_id)
                except Exception as e:
                    print(f"Не удалось удалить сообщение {message_id}: {e}")

        # Инициализация переменной keyboard как пустого списка
        keyboard = []

        # Формирование сообщения в зависимости от действия
        action_message = ""
        if action == "add":
            action_message = "Событие успешно добавлено."
        elif action == "update":
            action_message = "Событие успешно обновлено."

        # Формируем сообщение и клавиатуру в зависимости от наличия событий
        if events:
            for index, event in enumerate(events):
                keyboard.append([
                    InlineKeyboardButton(f"{event['date']} - {event['description']}", callback_data=f'show_event_details_{index}')
                ])
            keyboard.append([InlineKeyboardButton("Назад", callback_data='back_to_menu')])
            reply_markup = InlineKeyboardMarkup(keyboard)

            message = await context.bot.send_message(
                chat_id=chat_id,
                text=f"{action_message}\nВыберите событие для редактирования или удаления:",
                reply_markup=reply_markup
            )
        else:
            keyboard.append([InlineKeyboardButton("Добавить событие", callback_data='add_event')])
            keyboard.append([InlineKeyboardButton("Главное меню", callback_data='process_start')])
            reply_markup = InlineKeyboardMarkup(keyboard)

            message = await context.bot.send_message(
                chat_id=chat_id,
                text=f"{action_message}\nУ вас нет добавленных событий.",
                reply_markup=reply_markup
            )

        # Сохраняем id нового сообщения для будущего удаления
        context.user_data['message_ids'] = [message.message_id]

    async def show_event_details(self, update: Update, context: CallbackContext) -> None:
        query = update.callback_query
        await query.answer()
        user_id = query.from_user.id
        events = self.chat_manager.load_events(user_id)  # Загружаем события текущего пользователя
        event_index = int(query.data.split('_')[-1])

        if 0 <= event_index < len(events):
            event = events[event_index]
            text_message = (f"Дата: {event['date']}\n"
                            f"Описание: {event['description']}\n"
                            f"Время: {event['time']}\n")

            keyboard = [
                [InlineKeyboardButton("Редактировать", callback_data=f'edit_event_{event_index}')],
                [InlineKeyboardButton("Удалить", callback_data=f'delete_event_{event_index}')],
                [InlineKeyboardButton("Назад", callback_data='show_events')]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

            await query.edit_message_text(text=text_message, reply_markup=reply_markup)
        else:
            await query.answer("⚠️ Событие не найдено.")
    
    async def edit_event(self, update: Update, context: CallbackContext) -> None:
        logging.debug("Вход в функцию редактирования события.")
        user_id = update.effective_user.id

        current_state = get_user_state(user_id)
        if current_state != 'editing_event':
            await update.message.reply_text("Ошибка: состояние редактирования не установлено.")
            return

        event_index = context.user_data.get('editing_event_index')
        user_events = self.chat_manager.load_events(user_id)

        if event_index is None or event_index < 0 or event_index >= len(user_events):
            await update.message.reply_text("Ошибка: выбрано несуществующее событие для редактирования.")
            return

        try:
            logging.debug('Попытка редактирования события...')
            
            input_text = update.message.text.strip()
            # Используем новую функцию для извлечения всех необходимых данных
            parsed_data = parse_event_input(input_text)

            date_str = parsed_data['date_str']
            time_str = parsed_data['time_str']
            description = parsed_data['description']  # Можно заменить или дополнить на основе пользовательского ввода

            context.user_data['events'] = user_events

            self.chat_manager.save_events_to_file()
            logging.info(f"Событие успешно обновлено: {user_events[event_index]}")

            msg = await update.message.reply_text(
                f'Событие обновлено: {date_str} {time_str} - {description}'
            )
            await asyncio.sleep(3)
            await context.bot.delete_message(chat_id=msg.chat.id, message_id=msg.message_id)
            
            set_user_state(user_id, 'showing_events')
            logging.debug("Состояние пользователя изменено на 'showing_events'.")

            await self.show_events_via_message(update, context, action="update")

        except ValueError as e:
            logging.error(f"Ошибка при редактировании события: {e}")
            await update.message.reply_text(f"Ошибка: {e}")

    async def handle_event_input(self, update: Update, context: CallbackContext) -> None:
        user_id = update.effective_user.id
        state = get_user_state(user_id)
        if update.effective_chat.type != 'private':
            return  # Игнорируем все сообщения из групп и супергрупп
        logging.info(f"Текущее состояние для пользователя {user_id}: {state}")

        if state == 'editing_event':
            event_index = context.user_data.get('editing_event_index')
            if event_index is not None:
                await self.edit_event(update, context)
            else:
                logging.error("Индекс события не найден. Невозможно выполнить редактирование.")
                await update.message.reply_text("Ошибка: Не выбран индекс события для редактирования.")
        elif state == 'adding_event':
            await self.add_event(update, context)
        else:
            await update.message.reply_text(
                "Пожалуйста, воспользуйтесь меню для навигации или вве��ите команду /help для получения помощи."
            )

