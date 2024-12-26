import logging
import threading
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.constants import ChatMemberStatus
from telegram.ext import ApplicationBuilder,CommandHandler, ConversationHandler, MessageHandler, filters, CallbackQueryHandler, CallbackContext, Application, JobQueue
from message_handler import CustomMessageHandler
from utils.chat_manager import ChatManager
from utils.mediator import Mediator
from utils.scheduler import Scheduler
from utils.access_control import AccessControl
from user_states import set_user_state
from components.inventory_manager import InventoryManager, SELECT_CHAT, CHOOSING_CATEGORY, CHOOSING_ITEM, CHOOSING_ITEM_TYPE, ENTERING_QUANTITY, RETURN_MENU, EDITING_ITEM, EDITING_SELECTION, ENTERING_QUANTITY_FOR_EDIT
from web import create_app
from config import Config, bot_token
from functools import partial
import asyncio
import date_manager
import nest_asyncio
from initialize_data import initialize_data_files
import globals
import signal
import sys
from web.telegram_bot import TelegramBot
from datetime import time
import pytz
from datetime import datetime, timedelta

# Добавляем эту строку для решения проблемы с event loop
nest_asyncio.apply()

def setup_logging():
    # Убираем все закрывающие обработчики, если они есть
    for handler in logging.root.handlers[:]:
        logging.root.removeHandler(handler)

    logging.basicConfig(
        level=logging.DEBUG,
        format='%(asctime)s - %(levelname)s - %(message)s'
    )

    custom_logger = logging.getLogger('custom_logger')
    custom_logger.setLevel(logging.DEBUG)

    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG)
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    handler.setFormatter(formatter)

    custom_logger.addHandler(handler)

    custom_logger.debug("Это тестовое сообщение DEBUG от custom_logger.")

    # Установка более высокого уровня для известных логеров HTTP-библиотек
    # logging.getLogger('httpx').setLevel(logging.WARNING)
    # logging.getLogger('http.client').setLevel(logging.WARNING)
    # logging.getLogger('asyncio').setLevel(logging.WARNING)
    # logging.getLogger('urllib3').setLevel(logging.WARNING)
    # logging.getLogger('aiohttp').setLevel(logging.WARNING)
    # logging.getLogger('telegram').setLevel(logging.WARNING)

async def handle_text_message(update: Update, context: CallbackContext) -> None:
    global globals

    secret_password = "1999"
    user_id = update.effective_user.id
    message_text = update.message.text.strip()

    if message_text == secret_password:
        globals.access_control.password_users.add(user_id)
        globals.chat_manager.add_user_to_admins(user_id)
        await context.bot.send_message(
            chat_id=user_id,
            text="Доступ открыт"
        )
        return

    if not await globals.access_control.has_access(update):
        logging.info(f"Пользователь {user_id} не имеет доступа.")
        await context.bot.send_message(
            chat_id=user_id,
            text="У вас нет доступа"
        )
        return

    await globals.event_manager.handle_event_input(update, context)

async def start(update: Update, context: CallbackContext, access_control: AccessControl) -> None:
    # Обновление списка разрешённых пользователей
    await access_control.update_allowed_users(context)

    # Игнорирование команды 'start' в групповом чате
    if update.effective_chat.type != 'private':
        logging.info("Команда 'start' вызвана из группового чата. Игнорирование.")
        return

    user_id = update.effective_user.id

    # Проверка доступа пользователя
    if await access_control.has_access(update):
        user_name = update.effective_user.first_name
        keyboard = [[InlineKeyboardButton("Приступить", callback_data='start_process')]]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.message.reply_text(
            f'Добро пожаловать, {user_name}! Нажмите "Приступить", чтобы начать.',
            reply_markup=reply_markup
        )

        # Изменение состояния пользователя на "begin"
        set_user_state(user_id, "begin")
    else:
        await update.message.reply_text("У вас нет доступа.")

async def welcome_message(update: Update, context: CallbackContext) -> None:
    global globals
    globals.chat_manager.load_admins_ids_from_file()

    if update.message.new_chat_members:
        for member in update.message.new_chat_members:
            if member.id == context.bot.id:
                invitor_id = update.message.from_user.id
                group_name = update.message.chat.title
                chat_id = update.message.chat.id

                # Проверка инвайтора относительно актуального списка разрешённых пользователей
                if invitor_id in globals.chat_manager.allowed_users:
                    globals.chat_manager.set_chat_id(group_name, chat_id)
                    logging.info(f"Добавлен новый чат: {group_name} с ID {chat_id}")
                    globals.chat_manager.save_chat_ids_to_file()

                    # Регистрируем участие инвайтора в соответствующем чате
                    globals.chat_manager.add_user_to_chat(invitor_id, chat_id)
                    logging.info(f"Пользователь {invitor_id} добавлен в чат {chat_id} при добавлении бота.")

                    # Получение всех участников чата и их регистрация
                    try:
                        members = await context.bot.getChat(chat_id)
                        for member in members:
                            globals.chat_manager.add_user_to_chat(member.user.id, chat_id)
                            logging.info(f"Пользователь {member.user.id} добавлен в чат {chat_id}.")

                        # Добвление всех новых членов при добавлении бота
                        member_ids = [m.id for m in update.message.new_chat_members]
                        for member_id in member_ids:
                            globals.chat_manager.add_user_to_chat(member_id, chat_id)
                            logging.info(f"Новый участник {member_id} добавлен в чат {chat_id}.")
                    except Exception as e:
                        logging.error(f"Не удалось сканировать участников чата: {e}")

                    await context.bot.send_message(
                        chat_id=chat_id,
                        text=f"Привет {group_name}! Я бот, который поможет вам управлять важными событиями."
                    )
                else:
                    logging.warning(f"Несанкционированная попытка добавления ботом {invitor_id} в группу {group_name}.")
                    await context.bot.send_message(
                        chat_id=chat_id,
                        text="У вас нет прав добавлять этого бота."
                    )
                    await context.bot.leave_chat(chat_id=chat_id)
            else:
                # Если добавл��н новый учст��ик (но не бот), добавим его в chat_members.json
                globals.chat_manager.add_user_to_chat(member.id, update.message.chat.id)
                logging.info(f"Новый участник {member.id} добавлен в чат {update.message.chat.id}.")

async def button_handler(update: Update, context: CallbackContext, access_control: AccessControl) -> None:
    global globals
    query = update.callback_query
    user_id = query.from_user.id
    
    logging.debug(f"User ID: {user_id}, query data: {query.data}")

    try:
        await query.answer()
    except Exception as e:
        logging.error(f"Ошибка при подтверждении кнопки: {e}")

    # Обновляем разрешённые права доступа пользователям
    await access_control.update_allowed_users(context)

    # Проверка, имеет ли пользователь доступ
    if not await access_control.has_access(update):
        await context.bot.send_message(
            chat_id=query.message.chat_id,
            text="У вас нет доступа"
        )
        return

    
    # Начало обработки действий
    if query.data == 'start_process':  
        await globals.event_manager.process_start(update, context)
        set_user_state(user_id, 'main_menu')
            
    elif query.data == 'process_start':
        await globals.event_manager.process_start(update, context)
        set_user_state(user_id, 'main_menu')
    
    elif query.data.startswith('select_'):
        await globals.event_manager.select_chat(update, context)

    elif query.data == 'inventory':
        await globals.inventory_manager.handle_inventory(update, context)
        set_user_state(user_id, 'choosing_category')

    elif query.data == 'add_event':
        context.user_data['current_menu'] = 'event_selection'
        reply_markup = await globals.event_manager.get_chat_selection_keyboard(globals.chat_manager.selected_chats, globals.chat_manager.chat_ids)
        await query.edit_message_text(text="Выберите, куда отправлять событие:", reply_markup=reply_markup)
        await globals.event_manager._reset_chat_selection(context)
        logging.warning("Выбранные чаты сброшены. Текущие выбранные чаты: %s", context.user_data['selected_chat_ids'])
    
    elif query.data == 'show_events':
        context.user_data['current_menu'] = 'events_list'
        await globals.event_manager.show_events(query, context)
        set_user_state(user_id, 'show_events')
    
    elif query.data.startswith('show_event_details_'):
        context.user_data['current_menu'] = 'event_details'
        await globals.event_manager.show_event_details(update, context)
        set_user_state(user_id, 'show_event_details')
    
    elif query.data.startswith('delete_event_'):
        event_index = int(query.data.split('_')[-1])
        user_id = query.from_user.id
        events = globals.chat_manager.load_events(user_id)

        if 0 <= event_index < len(events):
            event = events[event_index]
        else:
            logging.error(f"Событие с индексом {event_index} не найдено в events.")
            await query.edit_message_text(text="⚠️ Событие не найдено для удаления.")
            return

        await query.edit_message_text(
            text=f"Вы действительно хотите удалить это событие:\n\n"
                f"Дата: {event['date']}\n"
                f"Описание: {event['description']}\n"
                f"Время: {event['time']}\n"
                "🗑️ *Выберите действие:*",
            reply_markup=InlineKeyboardMarkup([
                [
                    InlineKeyboardButton("✅ Подтвердить", callback_data=f'confirm_delete_{event_index}'),
                    InlineKeyboardButton("❌ Отмена", callback_data='show_events')
                ]
            ])
        )
    
    elif query.data.startswith('edit_event_'):
        context.user_data['current_menu'] = 'event_edit'
        events = globals.chat_manager.load_events(user_id)
        event_index = int(query.data.split('_')[-1])
        
        if event_index < 0 or event_index >= len(events):
            logging.error("Ошибка: Неверный индекс события, оно не найдено.")
            await query.edit_message_text(text="Ошибка: событие не найдено.")
            return

        event = events[event_index]
        input_text = f"{event['date']} {event['description']} {event['time']}"
        
        logging.debug(f"Устанавливаем индекс события для редактирования: {event_index}")
        context.user_data['editing_event_index'] = event_index
        context.user_data['editing_event'] = True

        await query.edit_message_text(
            text=(
                f"Редактирование события начато. Текущее событие: {input_text}. "
                f"Введите новые данные для события (формат: YYYY-MM-DD Описание HH:MM):"
            ),
            reply_markup=InlineKeyboardMarkup([[InlineKeyboardButton("Отмена редактирования", callback_data='show_events')]])
        )
        set_user_state(user_id, 'editing_event')
        current_message = query.message
        context.user_data['message_ids'] = [current_message.message_id]

    elif query.data.startswith('confirm_delete_'):
        event_index = int(query.data.split('_')[-1])
        await globals.event_manager.delete_event(update, context, event_index)  

    elif query.data == 'back_to_items':
        # Устанавливаем состояние перед возвратом
        context.user_data['current_state'] = 'choosing_items'
        return await globals.inventory_manager.navigate_back(update, context)
   
    elif query.data == 'back_to_categories':
        # Устанавливаем состояние перед возвратом
        context.user_data['current_state'] = 'choosing_categories'
        return await globals.inventory_manager.item_navigation(update, context)

    elif query.data == 'confirm_event':
        selected_chat_ids = context.user_data.get('selected_chat_ids', [])
        selected_chat_names = [globals.chat_manager.get_chat_name_by_id(chat_id) for chat_id in selected_chat_ids]
        logging.info(f"Выбранные идентификаторы чатов: {selected_chat_ids}")

        if not selected_chat_names:
            await query.edit_message_text(text="Вы не выбрали ни одного чата.")
            logging.info(f"Пользователь {user_id} пытался подвердить выбор без выбранных чатов.")
            return

        message = await query.edit_message_text(text=f"Выбраны чаты: {', '.join(selected_chat_names)}")
        
        set_user_state(user_id, 'adding_event')
        logging.debug(f"Состояние пользователя {user_id} изменено на 'adding_event'.")
        context.user_data['message_ids'] = [message.message_id]
        
    elif query.data == 'select_all_groups':
        if len(globals.chat_manager.selected_chats) == len(globals.chat_manager.chat_ids):
            globals.chat_manager.selected_chats.clear()
        else:
            globals.chat_manager.selected_chats = list(globals.chat_manager.chat_ids.keys())

        current_text = "Выберите, куда отправлять событие:"
        current_markup = await globals.event_manager.get_chat_selection_keyboard(globals.chat_manager.selected_chats, globals.chat_manager.chat_ids)
        await query.edit_message_text(text=current_text, reply_markup=current_markup)
        set_user_state(user_id, 'event_details')
    
    elif query.data in globals.chat_manager.chat_ids.keys():
        selected_chat_ids = globals.chat_manager.selected_chats
        if query.data in selected_chat_ids:
            selected_chat_ids.remove(query.data)
        else:
            selected_chat_ids.append(query.data)

        current_text = "Выберите, куда отправлять событие:"
        current_markup = await globals.event_manager.get_chat_selection_keyboard(selected_chat_ids, globals.chat_manager.chat_ids)
        await query.edit_message_text(text=current_text, reply_markup=current_markup)
        set_user_state(user_id, 'event_details')
            

async def return_to_main_menu(query, context):
    logging.debug("Возвращение в главное мею.")
    await query.answer("Возвращение в главное меню.")
    keyboard = [
        [InlineKeyboardButton("Добавить событие", callback_data='add_event')],
        [InlineKeyboardButton("Показать события", callback_data='show_events')],
        [InlineKeyboardButton("Инвентаризация", callback_data='inventory')],
        [InlineKeyboardButton("Помощь", callback_data='help')]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    await query.edit_message_text(text='Выберите действие:', reply_markup=reply_markup)

    # Сбрасываем все специфичные для инвентаризации состояния
    context.user_data['inventory_mode'] = None
    
def setup_application(application, inventory_conv_handler):
    # Регистрация обработчиков
    application.add_handler(CommandHandler('start', partial(start, access_control=globals.access_control)))
    application.add_handler(inventory_conv_handler)  # Добавляем именно после CommandHandler
    application.add_handler(CallbackQueryHandler(partial(button_handler, access_control=globals.access_control)))
    application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text_message))
    application.add_handler(MessageHandler(filters.StatusUpdate.NEW_CHAT_MEMBERS, welcome_message))

# Функция для запуска Flask-сервера
def run_flask():
    """Функция для запуска Flask-сервера"""
    try:
        app = create_app()
        
        # Получаем настройки из конфигурации
        host = Config.FLASK_HOST
        port = Config.FLASK_PORT
        
        # Запускаем сервер без режима отладки и без перезагрузки
        app.run(
            host=host,
            port=port,
            debug=False,
            use_reloader=False,
            threaded=True  # Включаем многопоточность
        )
        
    except Exception as e:
        logging.error(f"Ошибка при запуске Flask сервера: {e}")
        raise

async def run_bot(application):
    """Функция для запуска бота"""
    try:
        if not application.running:
            await application.initialize()
            await application.start()
        
        # Запускаем polling без бесконечного цикла
        await application.updater.start_polling(
            allowed_updates=Update.ALL_TYPES,
            drop_pending_updates=True
        )
    except Exception as e:
        logging.error(f"Ошибка при запуске бота: {e}")
        raise

def setup_shutdown_handler(application):
    """Настройка корректного завершения приложения"""
    def signal_handler(sig, frame):
        logging.info("Получен сигнал завершения, закрываем приложение...")
        loop = asyncio.get_event_loop()
        if loop.is_running():
            loop.stop()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

async def check_tasks():
    while True:
        try:
            now = datetime.now(scheduler.timezone)
            
            # Проверяем и выполняем текущие задачи
            await scheduler.check_tasks()
            
            # Перепланируем повторяющиеся события
            await scheduler.replan_repeating_events()
            
            # Ждем до следующей минуты
            next_minute = (now + timedelta(minutes=1)).replace(second=0, microsecond=0)
            await asyncio.sleep((next_minute - now).total_seconds())
            
        except Exception as e:
            logging.error(f"Error in check_tasks: {str(e)}")
            await asyncio.sleep(60)

async def main():
    try:
        # Инициализация файлов данных
        initialize_data_files()
        
        # Настройка логирования
        setup_logging()
        
        # Создаем приложение
        application = ApplicationBuilder().token(bot_token).build()
        
        # Создаем и сохраняем бота
        telegram_bot = TelegramBot(bot_token)
        globals.telegram_bot = telegram_bot
        
        # Создаем планировщик с ботом
        scheduler = Scheduler(telegram_bot)
        globals.scheduler = scheduler
        
        # Настройка корректного завершения
        setup_shutdown_handler(application)
        
        # Инициализация компонентов
        mediator = Mediator()
        globals.chat_manager = ChatManager(mediator)
        globals.access_control = AccessControl(globals.chat_manager)
        
        # Регистрация компонентов в медиаторе
        mediator.register_scheduler(scheduler)
        mediator.register_chat_manager(globals.chat_manager)
        
        # Инициализация остальных компонентов
        globals.inventory_manager = InventoryManager(
            chat_manager=globals.chat_manager,
            chat_ids=globals.chat_manager.chat_ids,
            access_control=globals.access_control,
            mediator=mediator,
            scheduler=scheduler
        )

        # Привязываем inventory_manager к scheduler
        scheduler.attach_inventory_manager(globals.inventory_manager)

        mediator.register_inventory_manager(globals.inventory_manager)

        globals.event_manager = CustomMessageHandler(mediator, globals.chat_manager, globals.chat_manager.chat_ids)
        mediator.register_message_handler(globals.event_manager)
        
        # Регистрация InventoryManager в Scheduler 
        scheduler.attach_inventory_manager(globals.inventory_manager)
        mediator.register_date_manager(date_manager)

        # Настройка расписания
        scheduler.schedule_daily_check()
        scheduler.schedule_daily_update()
        scheduler.schedule_daily_clear_inventory()

        # Создание и настройка ConversationHandler для инвентаризации
        globals.inventory_conv_handler = ConversationHandler(
            entry_points=[CallbackQueryHandler(globals.inventory_manager.handle_inventory, pattern='^inventory$')],
            states={
                SELECT_CHAT: [
                    CallbackQueryHandler(globals.inventory_manager.select_chat_for_invent, pattern='^select_chat_')
                ],
                CHOOSING_CATEGORY: [
                    CallbackQueryHandler(globals.inventory_manager.choose_category, pattern=r'^category_'),
                    CallbackQueryHandler(globals.inventory_manager.item_navigation, pattern=r'^back_to_menu$|^back_to_categories$'),
                ],
                CHOOSING_ITEM: [
                    CallbackQueryHandler(globals.inventory_manager.choose_item, pattern=r'^item_'),
                    CallbackQueryHandler(globals.inventory_manager.item_navigation, pattern=r'^back_to_categories$|^back_to_items$'),
                ],
                CHOOSING_ITEM_TYPE: [
                    CallbackQueryHandler(globals.inventory_manager.item_navigation, pattern=r'^back_to_items$|^back_to_categories$|^back_to_select_edit_items$'),
                    CallbackQueryHandler(globals.inventory_manager.choose_item_type, pattern=r'^type_(raw|semi)_.+$')
                ],
                ENTERING_QUANTITY: [
                    MessageHandler(filters.TEXT & ~filters.COMMAND, globals.inventory_manager.enter_quantity),
                ],
                RETURN_MENU: [
                    CallbackQueryHandler(globals.inventory_manager.item_navigation, pattern=r'^back_to_menu$|^edit_inventory$'),
                    MessageHandler(filters.TEXT & ~filters.COMMAND, globals.event_manager.process_start)
                ],
                EDITING_ITEM: [
                    MessageHandler(filters.TEXT & ~filters.COMMAND, globals.inventory_manager.search_item),
                    CallbackQueryHandler(globals.inventory_manager.item_navigation, pattern='^back_to_menu$')
                ],
                EDITING_SELECTION: [
                    CallbackQueryHandler(globals.inventory_manager.edit_item, pattern='^edit_item_'),
                    CallbackQueryHandler(globals.inventory_manager.item_navigation, pattern='^edit_inventory$')
                ],
                ENTERING_QUANTITY_FOR_EDIT: [
                    MessageHandler(filters.TEXT & ~filters.COMMAND, globals.inventory_manager.enter_quantity_for_edit),
                ],
            },
            fallbacks=[CommandHandler('start', globals.inventory_manager.reset_conversation)],
            per_message=False,
        )

        # Настройка обработчиков команд
        application.add_handler(CommandHandler('start', partial(start, access_control=globals.access_control)))
        application.add_handler(globals.inventory_conv_handler)
        application.add_handler(CallbackQueryHandler(partial(button_handler, access_control=globals.access_control)))
        application.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_text_message))
        application.add_handler(MessageHandler(filters.StatusUpdate.NEW_CHAT_MEMBERS, welcome_message))

        # Запуск Flask в отдельном потоке
        flask_thread = threading.Thread(target=run_flask)
        flask_thread.daemon = True
        flask_thread.start()

        # Запуск бота (без бесконечного цикла)
        await run_bot(application)
        
        # Держим приложение запущенным
        try:
            while True:
                await asyncio.sleep(1)
        except KeyboardInterrupt:
            logging.info("Получен сигнал остановки")
        finally:
            if application.running:
                await application.stop()

    except Exception as e:
        logging.error(f"Критическая ошибка: {e}")
        print(f"Произошла ошибка: {e}")
        if 'loop' in locals():
            loop.stop()
        raise

def run():
    """Основная функция запуска приложения"""
    try:
        # Используем nest_asyncio для решения проблем с event loop
        nest_asyncio.apply()
        
        # Создаем новый event loop
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Запускаем приложение
            loop.run_until_complete(main())
        except KeyboardInterrupt:
            print("\nБот остановлен")
        except Exception as e:
            print(f"Произошла ошибка: {e}")
            logging.exception("Критическая ошибка в приложении:")
        finally:
            # Корректно закрываем все задачи
            pending = asyncio.all_tasks(loop)
            for task in pending:
                task.cancel()
            
            # Запускаем оставшиеся задачи до их отмены
            if pending:
                loop.run_until_complete(asyncio.gather(*pending, return_exceptions=True))
            
            # Закрываем loop
            loop.run_until_complete(loop.shutdown_asyncgens())
            loop.close()
            
    except Exception as e:
        print(f"Ошибка при инициализации: {e}")
        logging.exception("Ошибка при инициализации приложения:")

if __name__ == '__main__':
    run()