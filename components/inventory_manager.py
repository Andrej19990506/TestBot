import logging



from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.error import BadRequest
from telegram.ext import CallbackContext, ConversationHandler
from date_manager import json_to_excel
import json
import os
from datetime import datetime, timedelta
import copy
from fuzzywuzzy import fuzz

SELECT_CHAT,CHOOSING_CATEGORY, CHOOSING_ITEM, CHOOSING_ITEM_TYPE , ENTERING_QUANTITY, RETURN_MENU, EDITING_ITEM, EDITING_SELECTION, ENTERING_QUANTITY_FOR_EDIT  = range(9)

class InventoryManager:
    def __init__(self, chat_manager, chat_ids, access_control, mediator, scheduler):
        self.chat_manager = chat_manager
        self.chat_ids = chat_ids
        self.access_control = access_control
        self.mediator = mediator
        self.scheduler = scheduler
        self.inventory_editable = True
        self.inventory_template = self.mediator.load_template("inventory_template.json")
        self.inventories = self.load_existing_inventory()
        self.preferences_file = 'user_preferences.json'
        self.user_preferences = self.load_preferences()

    def load_preferences(self):
        try:
            with open(self.preferences_file, 'r', encoding='utf-8') as file:
                return json.load(file)
        except FileNotFoundError:
            return {}

    def save_preferences(self):
        with open(self.preferences_file, 'w', encoding='utf-8') as file:
            json.dump(self.user_preferences, file, ensure_ascii=False, indent=4)

    def update_preferences(self, chat_id, category=None, item=None):
        chat_id_str = str(chat_id)
        if chat_id_str not in self.user_preferences:
            self.user_preferences[chat_id_str] = {"categories": {}, "items": {}}

        preferences = self.user_preferences[chat_id_str]

        if category:
            if category not in preferences["categories"]:
                preferences["categories"][category] = 0
            preferences["categories"][category] += 1

        if item:
            if category not in preferences["items"]:
                preferences["items"][category] = {}
            if item not in preferences["items"][category]:
                preferences["items"][category][item] = 0
            preferences["items"][category][item] += 1

        self.save_preferences()

    def sort_inventory_preferences(self, chat_id):
        # Получаем инвентарь для текущего чата
        chat_id_str = str(chat_id)
        inventory = self.inventories.get(chat_id_str, {})
        
        if not inventory:
            logging.warning(f"Инвентарь для chat_id {chat_id_str} не найден.")
            return {}

        # Загружаем предпочтения для chat_id
        preferences = self.user_preferences.get(chat_id_str, {"categories": {}, "items": {}})

        # Сортируем категории
        sorted_categories = sorted(inventory.keys(),
                                   key=lambda c: preferences['categories'].get(c, 0),
                                   reverse=True)

        # Сортируем товары внутри каждой категории
        sorted_inventory = {}
        for category in sorted_categories:
            items = inventory[category]
            sorted_items = sorted(items.keys(),
                                  key=lambda i: preferences['items'].get(category, {}).get(i, 0),
                                  reverse=True)
            sorted_inventory[category] = {item: items[item] for item in sorted_items}

        return sorted_inventory

    def save_inventory_to_excel(self, chat_id):
        # Преобразуем chat_id в строку, если необходимо, для совместимости с сохраненными данными
        chat_id_str = str(chat_id)

        # Получаем инвентарь
        inventory = self.inventories.get(chat_id_str)

        if not inventory:
            logging.warning(f"Инвентарь для chat_id {chat_id_str} не найден.")
            return

        # Получаем имя филиала
        chat_name = self.chat_manager.get_chat_name_by_id(int(chat_id))
        if not chat_name:
            logging.warning(f"Имя филиала для chat_id {chat_id_str} не найдено, устанавливается значение по умолчанию.")
            chat_name = f"Chat_{chat_id_str}"
        
        current_date_str = datetime.now().strftime('%Y%m%d')
        directory_path = f"output/{chat_name}_{current_date_str}"
        os.makedirs(directory_path, exist_ok=True)
        excel_file_path = f"{directory_path}/inventory.xlsx"

        # Передаем данные вместе с именем филиала
        json_to_excel(inventory, excel_file_path, chat_name)

        logging.info(f"Инвентаризация сохранена в {excel_file_path}.")

    def load_existing_inventory(self):
        logging.debug("Начало загрузки существующего инвентаря.")
        inventory_file = self.mediator.get_inventory_file_path()
        if os.path.exists(inventory_file):
            try:
                with open(inventory_file, 'r', encoding='utf-8') as f:
                    content = f.read().strip()
                    if content:
                        inventories = json.loads(content)
                        # Проверяйте уникальность chat_id
                        if len(inventories) != len(set(inventories.keys())):
                            logging.warning("Обнаружены дублирующиеся chat_id в данных.")
                        logging.info("Инвентарь успешно загружен из файла.")
                        return inventories
            except json.JSONDecodeError as e:
                logging.error(f"Ошибка декодирования JSON: {e}. Используем шаблон для инициализации инвентаря.")
        else:
            logging.info("Файл инвентаризации не найден. Используем шаблон.")

        return copy.deepcopy(self.inventory_template)

    def get_inventory(self, chat_id):
        chat_id_str = str(chat_id)
        
        # Проверка на существование инвентаря, возвращаем шаблон для чтения, если нет данных
        if chat_id_str not in self.inventories:
            return copy.deepcopy(self.inventory_template)

        return copy.deepcopy(self.inventories[chat_id_str])

    def update_inventory(self, chat_id, category, item, item_type, quantity):
        chat_id_str = str(chat_id)
        
        # Убедимся, что инвентарь для chat_id загружен
        self.set_current_inventory(chat_id)

        # Проверка и обновление информации, если она действительно обновлена
        if category in self.current_inventory and item in self.current_inventory[category]:
            if item_type in self.current_inventory[category][item]:
                self.current_inventory[category][item][item_type]['quantity'] = quantity
                self.current_inventory[category][item][item_type]['filled'] = quantity > 0
                logging.info(f"Обновлено: {category} -> {item} -> {item_type}: {quantity}")
                # Если только одна группа, тогда надо записать изменения
                if len(self.chat_ids) == 1:
                    self.inventories[chat_id_str] = self.current_inventory
                    self.save_inventory()
            else:
                logging.warning(f"Тип '{item_type}' не найден для '{item}' в категории '{category}'.")
        else:
            logging.warning(f"Категория '{category}' или товар '{item}' не найдены в инвентаре.")

        # Если несколько групп, сохраняем изменения только после апдейта
        if len(self.chat_ids) > 1:
            self.inventories[chat_id_str] = self.current_inventory
            self.save_inventory()

    def save_inventory(self):
        logging.debug("Начало сохранения инвентаризации")
        inventory_file = self.mediator.get_inventory_file_path()
        with open(inventory_file, 'w', encoding='utf-8') as f:
            json.dump(self.inventories, f, ensure_ascii=False, indent=4)
            logging.info("Инвентарь успешно сохранен в файл.")
    
    def is_inventory_complete(self, chat_id):
        """Проверяет, завершена ли инвентаризация для указанного chat_id."""
        self.set_current_inventory(chat_id)  # Убедитесь, что это делается перед проверкой
        if not self.current_inventory:
            logging.debug(f"Инвентарь для chat_id {chat_id} не найден.")
            return False

        complete = self.all_categories_filled()
        logging.info(f"Инвентаризация для chat_id {chat_id} завершена: {complete}")
        return complete
    
    def clear_all_inventories(self):
        """Очистка инвентаризации для всех групп."""
        for group_id, group_inventory in self.inventories.items():
            logging.info(f"Очистка инвентаризации для группы ID: {group_id}")
            for category in group_inventory.values():
                for item in category.values():
                    for item_type in item.values():
                        item_type['quantity'] = 0
                        item_type['filled'] = False
        self.save_inventory_to_json(self.inventory_file)
        logging.info("Инвентаризация сброшена для всех групп.")   

    def set_quantity(self, chat_id, category, item, quantity, item_type):
        # Проверьте, существует ли chat_id в self.inventories
        if str(chat_id) not in self.inventories:
            logging.error(f"Инвентарь для chat_id {chat_id} не найден.")
            return

        # Убедитесь, что self.current_inventory действительно существует и имеет нужные данные
        if category in self.current_inventory and item in self.current_inventory[category]:
            if item_type in self.current_inventory[category][item]:
                self.current_inventory[category][item][item_type]['quantity'] = quantity
                self.current_inventory[category][item][item_type]['filled'] = (quantity is not None and quantity > 0)
                logging.info(f"Количество для '{item_type}' '{item}' в категории '{category}' установлено в {quantity}. Заполнено: {self.current_inventory[category][item][item_type]['filled']}")
            else:
                logging.warning(f"Тип '{item_type}' не найден для '{item}' в категории '{category}'.")
        else:
            logging.warning(f"Категория '{category}' или товар '{item}' не найдены в инвентаре.")
        self.inventories[str(chat_id)] = self.current_inventory
        self.save_inventory()

    def get_indicator(self, details):
        quantity = details.get('quantity')
        # Возвращать "✅" только если количество больше 0
        return " ✅" if quantity is not None and quantity > 0 else " ❌"

    def get_category_indicator(self, category):
        # Предполагаем, что current_inventory будет правильным объектом
        category_filled = all(
            all(opt.get('filled', False) for opt in item.values())
            for item in self.current_inventory.get(category, {}).values()
        )
        return " ✅" if category_filled else " ❌"
    
    def any_item_unfilled(self, category):
        logging.info(f"Проверка незаполненных товаров в категории '{category}'")
        for item, options in self.current_inventory[category].items():
            unfilled_options = [opt for opt, val in options.items() if val is None]
            
            if unfilled_options:
                logging.info(f"Товар '{item}' имеет незаполненные опции: {unfilled_options}")
                return True

        logging.info(f"Все товары в категории '{category}' имеют заполненные опции.")
        return False

    def all_items_filled(self, category):
        """Проверяет, заполнены ли все элементы (товары) в категории."""
        logging.info(f"Проверка заполненности всех товаров в категории '{category}'")
        for item, options in self.current_inventory[category].items():
            for option_name, option in options.items():
                logging.debug(f"Проверка опции '{option_name}': "
                            f"quantity={option['quantity']}, filled={option['filled']}")
                if option['quantity'] is None or option['filled'] is False:
                    logging.info(f"Товар '{item}' имеет незаполненные опции: {option_name}")
                    return False
        logging.info(f"Все товары в категории '{category}' полностью заполнены.")
        return True
    
    def all_categories_filled(self):
        # Проверяем все категории в текущей инвентаризации
        return all(self.all_items_filled(category) for category in self.current_inventory)

    def set_inventory_status_complete(self):
        self.inventory_editable = False   

    def update_group_inventory(self, group_id, new_data):
        group_id_str = str(group_id)
        logging.debug(f"Начало обновления инвентаризации для группы ID: {group_id_str}")
        if group_id_str in self.inventories:
            logging.debug(f"Текущие данные для обновления: {json.dumps(new_data, indent=2)}")
            for key, value in new_data.items():
                if key in self.inventories[group_id_str]:
                    self.inventories[group_id_str][key].update(value)
                else:
                    self.inventories[group_id_str][key] = value
                    
            logging.info(f"Инвентаризация для группы ID: {group_id_str} обновлена.")
            logging.debug(f"Инвентаризация для группы ID {group_id_str} после обновления: {json.dumps(self.inventories[group_id_str], indent=2)}")
        else:
            logging.warning(f"Группа ID: {group_id_str} не найдена.")

    def set_current_inventory(self, chat_id):
        chat_id_str = str(chat_id)
        
        # Если текущий инвентарь уже установлен, и он для того же chat_id, ничего не делаем
        if hasattr(self, 'current_chat_id') and self.current_chat_id == chat_id_str:
            logging.debug(f"Инвентарь для chat_id: {chat_id_str} уже установлен. Используем существующий.")
            return
        
        logging.debug(f"Установка текущего инвентаря для chat_id: {chat_id_str}")
        
        # Проверка существования инвентаря
        existing_inventory = self.inventories.get(chat_id_str)
        if existing_inventory:
            self.current_inventory = existing_inventory  # Используется существующий инвентарь
            logging.info(f"Инвентаризация для группы ID: {chat_id_str} загружена из существующего.")
        else:
            logging.info(f"Для группы ID: {chat_id_str} не найдена старая инвентаризация. Используется шаблон.")
            self.current_inventory = copy.deepcopy(self.inventory_template)  # Создаем новый инвентарь
            if len(self.chat_ids) > 1:  # Если больше одной группы, сохраняем настройки
                self.inventories[chat_id_str] = self.current_inventory
                logging.debug(f"Создан новый инвентарь для группы ID: {chat_id_str}")

        self.current_chat_id = chat_id_str

    def add_or_update_inventory(self, chat_id, category, item, item_type, quantity):
        chat_id_str = str(chat_id)
        
        # Проверка или текущий инвентарь уже существует, если да, то использовать его
        if chat_id_str not in self.inventories:
            logging.info(f"Создание нового инвентаря для chat_id: {chat_id_str}.")
            self.inventories[chat_id_str] = copy.deepcopy(self.inventory_template)
        
        # Теперь обновляем уже существующий или только что созданный инвентарь
        current_inventory = self.inventories[chat_id_str]
        
        if category in current_inventory and item in current_inventory[category]:
            if item_type in current_inventory[category][item]:
                current_inventory[category][item][item_type]['quantity'] = quantity
                current_inventory[category][item][item_type]['filled'] = quantity > 0
                logging.info(f"Количество для '{item}' в категории '{category}' обновлено. "
                            f"Тип: {item_type}, Количество: {quantity}.")
            else:
                logging.warning(f"Тип '{item_type}' не найден для '{item}' в категории '{category}'.")
        else:
            logging.warning(f"Категория '{category}' или товар '{item}' не найдены в инвентаре.")
        
        # Сохраняем обновленный инвентарь
        self.save_inventory()

    async def reset_conversation(self, update: Update, context: CallbackContext) -> int:
        # Завершаем текущий разговор
        await update.message.reply_text("Перезапуск... Возвращение в главное меню.")
    # Возвращаем состояние END для завершения текущего сеанса
        return ConversationHandler.END

    async def select_chat_for_invent(self, update: Update, context: CallbackContext) -> int:
        query = update.callback_query
        selected_chat_id = int(query.data.split('_')[-1])
        context.user_data['chat_id'] = selected_chat_id
        logging.info("Доступ отработал")

        if not await self.access_control.has_access(update):
            message = "У вас нет прав на выполнение инвентаризации в этой группе."
            logging.warning(f"User {update.effective_user.id} не имеет доступа в чате {selected_chat_id}.")
            # Отправка сообщения с кнопкой
            inline_keyboard = [[InlineKeyboardButton("Главное меню", callback_data='back_to_menu')]]
            markup = InlineKeyboardMarkup(inline_keyboard)
            await query.edit_message_text(message, reply_markup=markup)
            return RETURN_MENU

        chat_name = self.chat_manager.get_chat_name_by_id(selected_chat_id)
        logging.info(f"Пользователь выбрал чат: {chat_name} ({selected_chat_id})")

        # Обязательно загружаем текущую инвентаризацию
        self.set_current_inventory(selected_chat_id)

        # Проверка завершенности инвентаризации еще раз после установки
        if self.is_inventory_complete(selected_chat_id):
            current_date = datetime.now()
            next_inventory_date = current_date + timedelta(weeks=1)
            next_inventory_date_str = next_inventory_date.strftime('%A %d.%m.%Y')
            message = (
                f"Инвентаризация окончена для {chat_name}. Вы можете редактировать данные инвентаризации до 7:00 утра, затем данные будут отправлены в бухгалтерию."
                if self.inventory_editable else
                f"Инвентаризация окончена. Данные отправлены в бухгалтерию. Следующая инвентаризация для {chat_name} назначена на: {next_inventory_date_str}."
            )
            
            inline_keyboard = [[InlineKeyboardButton("Главное меню", callback_data='back_to_menu')]]
            if self.inventory_editable:
                inline_keyboard.append([InlineKeyboardButton("Редактировать инвентаризацию", callback_data='edit_inventory')])
            
            markup = InlineKeyboardMarkup(inline_keyboard)

            await query.edit_message_text(message, reply_markup=markup)
            return RETURN_MENU

        # Если инвентаризация не завершена, продолжаем с выбором категории
        start_message = f"Инвентаризация началась для {chat_name}."
        await query.edit_message_text(start_message)

        current_inventory = self.current_inventory

        if not current_inventory:
            await self.send_message(update, "Нет доступных категорий для выбранного чата.")
            logging.warning("Текущая инвентаризация пуста. Возможно, проблема с загрузкой данных.")
            return RETURN_MENU

        keyboard = [
            [InlineKeyboardButton(category + self.get_category_indicator(category), callback_data=f'category_{category}')]
            for category in current_inventory.keys()
        ]
        keyboard.append([InlineKeyboardButton("Назад", callback_data='back_to_menu')])
        reply_markup = InlineKeyboardMarkup(keyboard)

        await self.send_message(update, "Выберите категорию:", reply_markup=reply_markup)
        return CHOOSING_CATEGORY
    
    async def handle_inventory(self, update: Update, context: CallbackContext) -> int:
        user_id = update.effective_user.id
        logging.info(f"Начата операция handle_inventory с user_id: {user_id}")

        potential_chat_ids = self.chat_manager.get_chats_for_user(user_id)
        logging.info(f"Чаты для user_id {user_id}: {potential_chat_ids}")

        if not potential_chat_ids:
            message = "Мы не смогли определить, в каком чате вы находитесь или у вас нет прав на инвентаризацию."
            await self.send_message(update, message)
            return ConversationHandler.END

        if len(potential_chat_ids) > 1:
            keyboard = [
                [InlineKeyboardButton(self.chat_manager.get_chat_name_by_id(chat_id) or f"Chat_{chat_id}", callback_data=f'select_chat_{chat_id}')]
                for chat_id in potential_chat_ids
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            await self.send_message(update, "Выберите чат для инвентаризации:", reply_markup=reply_markup)
            return SELECT_CHAT

        chat_id = str(potential_chat_ids[0])
        context.user_data['chat_id'] = chat_id

        # Проверка и инициализация инвентаря
        if chat_id not in self.inventories:
            logging.info(f"Чат ID {chat_id} не найден в инвентаре. Инициализация нового инвентаря.")
            self.inventories[chat_id] = copy.deepcopy(self.inventory_template)

        sorted_inventory = self.sort_inventory_preferences(chat_id)
        self.set_current_inventory(chat_id, sorted_inventory)

        if not await self.access_control.has_access(update):
            logging.info(f"User {user_id} не имеет доступа в чате {chat_id}.")
            message = "У вас нет прав на выполнение инвентаризации в этом чате."
            try:
                await update.effective_message.reply_text(message)
                logging.info("Сообщение об отсутствии доступа успешно отправлено.")
            except Exception as e:
                logging.error(f"Ошибка при отправке сообщения: {e}")
            return ConversationHandler.END

        self.set_current_inventory(chat_id)
        chat_name = self.chat_manager.get_chat_name_by_id(int(chat_id)) or f"Chat_{chat_id}"

        # Проверка статуса инвентаризации
        if self.is_inventory_complete(chat_id):
            logging.info(f"Инвентаризация завершена для чата {chat_name}.")
            current_date = datetime.now()
            next_inventory_date = current_date + timedelta(weeks=1)
            next_inventory_date_str = next_inventory_date.strftime('%A %d.%m.%Y')
            message = (
                f"Инвентаризация окончена для {chat_name}. Вы можете редактировать данные инвентаризации до 7:00 утра, затем данные будут отправлены в бухгалтерию."
                if self.inventory_editable else
                f"Инвентаризация окончена. Данные отправлены в бухгалтерию. Следующая инвентаризация для {chat_name} назначена на: {next_inventory_date_str}."
            )

            inline_keyboard = [[InlineKeyboardButton("Главное меню", callback_data='back_to_menu')]]
            if self.inventory_editable:
                inline_keyboard.append([InlineKeyboardButton("Редактировать инвентаризацию", callback_data='edit_inventory')])

            markup = InlineKeyboardMarkup(inline_keyboard)

            if update.message:
                await update.message.reply_text(message, reply_markup=markup)
            elif update.callback_query:
                await update.callback_query.answer()
                await update.callback_query.edit_message_text(message, reply_markup=markup)

            return RETURN_MENU

        logging.info(f"Инвентаризация не завершена для {chat_name}. Переход к выбору категории.")
        current_inventory = self.current_inventory
        keyboard = [
            [InlineKeyboardButton(category + self.get_category_indicator(category), callback_data=f'category_{category}')]
            for category in current_inventory.keys()
        ]
        keyboard.append([InlineKeyboardButton("Назад", callback_data='back_to_menu')])
        reply_markup = InlineKeyboardMarkup(keyboard)

        await self.send_message(update, "Выберите категорию:", reply_markup=reply_markup)
        return CHOOSING_CATEGORY

    
    async def send_message(self, update: Update, message: str, reply_markup=None):
        if update.message:
            await update.message.reply_text(message, reply_markup=reply_markup)
        elif update.callback_query:
            query = update.callback_query
            await query.answer()
            await query.edit_message_text(message, reply_markup=reply_markup)  
    
    async def return_to_categories(self, update: Update, context: CallbackContext) -> int:
        logging.info("Возврат к категориям вызван.")
        query = update.callback_query
        await query.answer()

        keyboard = [
            [InlineKeyboardButton(category + self.get_category_indicator(category), callback_data=f'category_{category}')]
            for category in self.current_inventory.keys()
        ]

        keyboard.append([InlineKeyboardButton("Назад", callback_data="back_to_menu")])
        reply_markup = InlineKeyboardMarkup(keyboard)

        try:
            await query.edit_message_text("Выберите категорию:", reply_markup=reply_markup)
        except BadRequest as e:
            logging.error(f"Ошибка при редактировании сообщения на выбор категории: {e}")
            await query.message.reply_text("Возникла ошибка. Попробуйте снова выбрать категорию.", reply_markup=reply_markup)

        return CHOOSING_CATEGORY

    async def choose_category(self, update: Update, context: CallbackContext) -> int:
        logging.info("Функция choose_category вызвана.")
        query = update.callback_query
        await query.answer()
        category = query.data.replace("category_", "")
        context.user_data['chosen_category'] = category

        # Обновление предпочтений для выбранной категории
        chat_id = context.user_data.get('chat_id')
        self.update_preferences(chat_id, category=category)

        if self.all_items_filled(category):
            logging.info(f"Все товары в категории '{category}' заполнены. Сообщаем пользователю.")
            await query.edit_message_text(f"В категории '{category}' все товары заполнены.")

            if self.all_categories_filled():
                logging.info("Все категории заполнены. Возвращаемся в главное меню.")
                await query.message.reply_text("Все категории заполнены. Возвращаемся в главное меню.")
                logging.info("RETURN_MENU запустился")
                return RETURN_MENU
            
            keyboard = [
                [InlineKeyboardButton(category + self.get_category_indicator(category), callback_data=f'category_{category}')]
                for category in self.current_inventory.keys()
            ]
            keyboard.append([InlineKeyboardButton("Назад", callback_data="back_to_menu")])
            reply_markup = InlineKeyboardMarkup(keyboard)
            await query.message.reply_text("Выберите категорию:", reply_markup=reply_markup)

            return CHOOSING_CATEGORY

        items = self.current_inventory[category]
        incomplete_items = {
            item_name: details
            for item_name, details in items.items()
            if not all(detail['filled'] for detail in details.values())
        }

        keyboard = [
            [InlineKeyboardButton(f"{item_name}{self.get_indicator(details)}", callback_data=f"item_{item_name}")]
            for item_name, details in incomplete_items.items()
        ]

        keyboard.append([InlineKeyboardButton("Назад", callback_data="back_to_categories")])
        reply_markup = InlineKeyboardMarkup(keyboard)

        logging.debug("Переход к выбору товара.")
        await query.edit_message_text(f"Вы выбрали категорию: {category}. Теперь выберите товар.", reply_markup=reply_markup)
        return CHOOSING_ITEM
    
    async def choose_item(self, update: Update, context: CallbackContext) -> int:
        logging.info("Функция choose_item вызвана.")
        query = update.callback_query
        if not query:
            logging.error("Отсутствует callback_query в update, невозможно продолжить.")
            return CHOOSING_CATEGORY

        item = query.data.split('item_')[1]
        context.user_data['chosen_item'] = item
        category = context.user_data['chosen_category']

        logging.debug(f"Выбранный товар: {item}")

        current_item = self.current_inventory.get(category, {}).get(item, {})

        if category in ["Напитки", "Контейнеры и приборы"]:
            # Только кнопка для "Сырьё"
            raw_filled = current_item['raw']['quantity'] is not None and current_item['raw']['quantity'] > 0

            keyboard = [
                [InlineKeyboardButton(f"Сырьё{' ✅' if raw_filled else ' ❌'}", callback_data=f"type_raw_{item}")],
                [InlineKeyboardButton("Назад", callback_data="back_to_items")]
            ]
        else:
            # "Сырьё" и "Полуфабрикат" варианты для других категорий
            raw_filled = current_item['raw']['quantity'] is not None and current_item['raw']['quantity'] > 0
            semi_filled = current_item['semi']['quantity'] is not None and current_item['semi']['quantity'] > 0

            keyboard = [
                [InlineKeyboardButton(f"Сырьё{' ✅' if raw_filled else ' ❌'}", callback_data=f"type_raw_{item}")],
                [InlineKeyboardButton(f"Полуфабрикат{' ✅' if semi_filled else ' ❌'}", callback_data=f"type_semi_{item}")],
                [InlineKeyboardButton("Назад", callback_data="back_to_items")]
            ]

        reply_markup = InlineKeyboardMarkup(keyboard)
        await query.edit_message_text("Выберите тип продукта:", reply_markup=reply_markup)
        return CHOOSING_ITEM_TYPE
    
    async def return_to_items(self, update: Update, context: CallbackContext) -> int:
        logging.info("Возврат к списку товаров вызван.")
        query = update.callback_query
        await query.answer()

        category = context.user_data.get('chosen_category')
        items = self.inventories.get(category, {})

        # Фильтруем только те товары, которые не заполнены
        incomplete_items = {
            item_name: details
            for item_name, details in items.items()
            if not all(detail['filled'] for detail in details.values())
        }

        keyboard = [
            [InlineKeyboardButton(f"{item_name}{self.get_indicator(details)}", callback_data=f"item_{item_name}")]
            for item_name, details in incomplete_items.items()
        ]

        keyboard.append([InlineKeyboardButton("Назад", callback_data="back_to_categories")])
        reply_markup = InlineKeyboardMarkup(keyboard)

        await query.edit_message_text(
            f"Вы выбрали категорию: {category}. Теперь выберите товар.",
            reply_markup=reply_markup
        )

        return CHOOSING_ITEM

    async def enter_quantity(self, update: Update, context: CallbackContext) -> int:
        logging.info("Функция enter_quantity вызвана.")
        chat_id = context.user_data.get('chat_id') 
        if self.is_inventory_complete(chat_id):
            logging.info("Инвентаризация уже завершена. Перенаправляем в главное меню.")
            query = update.callback_query
            if query:
                await query.answer()
                await query.edit_message_text("Инвентаризация завершена. Возвращаем вас в главное меню.")
            else:
                await update.message.reply_text("Инвентаризация завершена. Возвращаем вас в главное меню.")
            return RETURN_MENU

        if update.message:
            # Получаем введенное количество из сообщения пользователя и проверяем его корректность
            quantity_text = update.message.text
            if not quantity_text.isdigit():
                await update.message.reply_text("Пожалуйста, введите корректное числовое значение.")
                return ENTERING_QUANTITY

            # Преобразуем текстовое значение в целое число
            quantity = int(quantity_text)

            # Извлечение необходимых данных из контекста пользователя для последующей работы
            category = context.user_data.get('chosen_category')
            item = context.user_data.get('chosen_item')
            item_type = context.user_data.get('chosen_item_type')
            chat_id = context.user_data.get('chat_id')  # Извлечение chat_id из контекста пользователя

            if None in [category, item, item_type, chat_id]:
                await update.message.reply_text("Ошибка: Недостаточно данных для продолжения. Пожалуйста, начните заново.")
                return RETURN_MENU

            logging.info(
                f"Устанавливается количество: категория='{category}', товар='{item}', тип='{item_type}', количество={quantity}."
            )

            # Установка количества в инвентаре и обновление статуса заполненности для данного типа
            self.set_quantity(chat_id, category, item, quantity, item_type)

            # Сохранение инвентаря сразу после обновления количества
            self.save_inventory()

        elif update.callback_query:
            query = update.callback_query
            await query.answer()
            callback_data = query.data

            if callback_data == 'back_to_menu':
                await query.edit_message_text(text="Возвращаемся в главное меню...")
                return RETURN_MENU
            elif callback_data == 'edit_inventory':
                await query.edit_message_text(text="Редактируем инвентаризацию...")
                # Добавьте здесь дополнительно логику для перехода в режим редактирования

        # Проверка: заполнены ли все опции для товара
        if update.message:
            current_item = self.current_inventory[category][item]
            all_filled = all(opt['quantity'] is not None and opt['quantity'] > 0 for opt in current_item.values())

            if all_filled:
                logging.info(f"Все опции для '{item}' заполнены.")

            # Проверка: заполнены ли все категории
            if self.all_categories_filled():
                logging.info("Все категории заполнены. Завершаем диалог и возвращаемся в главное меню.")
                inline_keyboard = [
                    [InlineKeyboardButton("Главное меню", callback_data='back_to_menu')],
                    [InlineKeyboardButton("Редактировать инвентаризацию", callback_data='edit_inventory')]
                ]
                markup = InlineKeyboardMarkup(inline_keyboard)
                self.save_inventory_to_excel(chat_id)
                await update.message.reply_text(
                    "Инвентаризация окончена. Вы можете редактировать данные инвентаризации до 7:00 утра, затем данные будут отправлены в бухгалтерию.",
                    reply_markup=markup
                )
                
                logging.info("RETURN_MENU запустился")
                return RETURN_MENU

            # Проверка: заполнены ли все товары в категории
            all_items_filled = all(
                all(opt['filled'] for opt in details.values())
                for details in self.current_inventory[category].values()
            )

            if all_items_filled:
                logging.info(f"Все товары в категории '{category}' заполнены. Возвращаемся к выбору категорий.")

                keyboard = [
                    [InlineKeyboardButton(category_name + self.get_category_indicator(category_name), callback_data=f'category_{category_name}')]
                    for category_name in self.current_inventory.keys()
                ]
                keyboard.append([InlineKeyboardButton("Назад", callback_data="back_to_menu")])
                reply_markup = InlineKeyboardMarkup(keyboard)

                await update.message.reply_text("Выберите категорию:", reply_markup=reply_markup)
                return CHOOSING_CATEGORY

            elif all_filled:
                await update.message.reply_text("Все опции заполнены. Возвращаемся к выбору товаров.")

                items = self.current_inventory[category]
                incomplete_items = {
                    item_name: details
                    for item_name, details in items.items()
                    if not all(detail['filled'] for detail in details.values())
                }
                
                keyboard = [
                    [InlineKeyboardButton(f"{item_name}{self.get_indicator(details)}", callback_data=f"item_{item_name}")]
                    for item_name, details in incomplete_items.items()
                ]
                keyboard.append([InlineKeyboardButton("Назад", callback_data="back_to_categories")])
                reply_markup = InlineKeyboardMarkup(keyboard)

                await update.message.reply_text(f"Вы выбрали категорию: {category}. Теперь выберите товар.", reply_markup=reply_markup)
                return CHOOSING_ITEM

            raw_indicator = self.get_indicator(current_item['raw'])
            semi_indicator = self.get_indicator(current_item['semi'])

            keyboard = [
                [InlineKeyboardButton(f"Сырьё{raw_indicator}", callback_data=f"type_raw_{item}")],
                [InlineKeyboardButton(f"Полуфабрикат{semi_indicator}", callback_data=f"type_semi_{item}")],
                [InlineKeyboardButton("Назад", callback_data='back_to_items')]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)

            await update.message.reply_text("Выберите тип продукта:", reply_markup=reply_markup)

            return CHOOSING_ITEM_TYPE
   
    async def choose_item_type(self, update: Update, context: CallbackContext) -> int:
        logging.info("Функция choose_item_type вызвана.")
        query = update.callback_query

        if not query or not query.data:
            logging.info("Отсутствуют данные в callback_query.")
            await query.answer("Ошибка во входной точке. Попробуйте снова.", show_alert=True)
            return CHOOSING_ITEM

        data = query.data.split('_')
        item_type = data[1]
        item = "_".join(data[2:])

        category = context.user_data.get('chosen_category')

        if category in ["Напитки", "Контейнеры и приборы"]:
            item_type = 'raw'
            context.user_data['chosen_item_type'] = item_type
            context.user_data['chosen_item'] = item
            await query.edit_message_text("Введите количество для: Сырьё")
            return ENTERING_QUANTITY

        context.user_data['chosen_item_type'] = item_type
        context.user_data['chosen_item'] = item

        if not category or item not in self.current_inventory.get(category, {}):
            logging.warning("Некорректная категория или товар.")
            await query.answer("Ошибка в выборе товара. Пожалуйста, выберите снова.", show_alert=True)
            return CHOOSING_CATEGORY

        if context.user_data.get('edit_mode'):
            await query.edit_message_text(f"Введите количество для редактирования типа: {'Сырьё' if item_type == 'raw' else 'Полуфабрикат'}")
            return ENTERING_QUANTITY_FOR_EDIT
        else:
            await query.edit_message_text(f"Введите количество для типа: {'Сырьё' if item_type == 'raw' else 'Полуфабрикат'}")
            return ENTERING_QUANTITY

    async def item_navigation(self, update: Update, context: CallbackContext) -> int:
        query = update.callback_query
        callback_data = query.data
        logging.debug(f"item_navigation вызвана с данными: {callback_data}")

        if callback_data == 'back_to_categories':
            logging.info("Возврат к категориям.")
            return await self.return_to_categories(update, context)
       
        elif callback_data == 'edit_inventory':
            logging.info("Возврат к списку товаров.")
            return await self.edit_inventory(update, context)

        elif callback_data == 'back_to_items':
            logging.info("Возврат к списку товаров.")
            return await self.return_to_items(update, context)
        
        elif callback_data == 'back_to_select_edit_items':
            logging.info("Возврат к списку товаров.")
            return await self.search_item(update, context)
        
        elif callback_data == 'back_to_menu':
            logging.info("Возврат в главное меню вызван.")
            query = update.callback_query
            keyboard = [
                [InlineKeyboardButton("Добавить событие", callback_data='add_event')],
                [InlineKeyboardButton("Показать события", callback_data='show_events')],
                [InlineKeyboardButton("Инвентаризация", callback_data='inventory')],
                [InlineKeyboardButton("Помощь", callback_data='help')]
            ]
            reply_markup = InlineKeyboardMarkup(keyboard)
            try:
                await query.edit_message_text(text='Выберите действие:', reply_markup=reply_markup)
            except BadRequest as e:
                logging.error(f"Ошибка при редактировании сообщения: {e}")
                await query.message.reply_text('Выберите действие:', reply_markup=reply_markup)
            logging.info("Диалог завершен")  
            return ConversationHandler.END


    async def edit_inventory(self, update: Update, context: CallbackContext) -> int:
        logging.info("Запрос на редактирование товара.")
        await update.callback_query.answer()

        keyboard = [
            [InlineKeyboardButton("Отмена редактирования", callback_data='back_to_menu')]
        ]
        reply_markup = InlineKeyboardMarkup(keyboard)

        await update.callback_query.edit_message_text(
            "Пожалуйста, введите название товара для редактирования.",
            reply_markup=reply_markup
        )
        return EDITING_ITEM

    async def search_item(self, update: Update, context: CallbackContext) -> int:
        logging.info("Функция search_item вызвана.")

        # Проверка источника запроса
        if update.callback_query:
            await update.callback_query.answer()

            # Если это запрос возврата, выполняем логику возврата
            if update.callback_query.data == 'back_to_select_edit_items':
                logging.info("Возвращаемся к списку товаров.")

                # Отображаем предыдущую клавиатуру с найденными товарами
                reply_markup = InlineKeyboardMarkup([
                    [InlineKeyboardButton(item, callback_data=f'edit_item_{item}')]
                    for item in context.user_data.get('last_found_items', [])  # Используем ранее найденные товары
                ] + [[InlineKeyboardButton("Назад", callback_data='edit_inventory')]])

                await update.callback_query.message.edit_text("Выберите товар для редактирования:", reply_markup=reply_markup)
                return EDITING_SELECTION

            # В противном случае обрабатываем как поиск товара
            response_method = update.callback_query.message.reply_text
            item_name = update.callback_query.data.strip().lower()

        elif update.message:
            item_name = update.message.text.strip().lower()
            response_method = update.message.reply_text
        else:
            logging.error("Ошибка: ни update.message, ни update.callback_query не обнаружены.")
            return EDITING_ITEM

        # Поиск товара
        found_items = []
        for category, items in self.current_inventory.items():
            for item in items.keys():
                item_key = item.lower()
                similarity = fuzz.partial_ratio(item_name, item_key)
                if similarity > 60:
                    found_items.append(item)

        if not found_items:
            await response_method("Товар не найден, попробуйте снова или введите корректное название.")
            return EDITING_ITEM

        logging.info(f"Список найденных элементов: {found_items}")

        # Сохраняем найденные товары, чтобы использовать в случае возврата
        context.user_data['last_found_items'] = found_items

        # Создаем клавиатуру для найденных товаров
        keyboard = [
            [InlineKeyboardButton(item, callback_data=f'edit_item_{item}')]
            for item in found_items
        ]
        keyboard.append([InlineKeyboardButton("Назад", callback_data='edit_inventory')])

        reply_markup = InlineKeyboardMarkup(keyboard)
        await response_method("Выберите товар для редактирования:", reply_markup=reply_markup)
        return EDITING_SELECTION
   
    async def edit_item(self, update: Update, context: CallbackContext) -> int:
        logging.info("Функция edit_item вызвана.")
        query = update.callback_query
        await query.answer()

        if not query or not query.data:
            logging.info("Отсутствуют данные в callback_query.")
            return EDITING_ITEM


        item = query.data[len('edit_item_'):]  # Вырезка только имени товара
        context.user_data['chosen_item'] = item

        logging.debug(f"Редактирование товара: {item}")

        category = None
        for cat, items in self.current_inventory.items():
            if item in items:
                category = cat
                break

        if category is None:
            logging.error(f"Товар '{item}' не найден в инвентаре.")
            return EDITING_ITEM
        context.user_data['chosen_category'] = category
        current_item = self.current_inventory[category][item]

        raw_filled = current_item['raw']['quantity'] is not None and current_item['raw']['quantity'] > 0
        semi_filled = current_item['semi']['quantity'] is not None and current_item['semi']['quantity'] > 0

        keyboard = [
            [InlineKeyboardButton(f"Сырьё{' ✅' if raw_filled else ' ❌'}", callback_data=f"type_raw_{item}")],
            [InlineKeyboardButton(f"Полуфабрикат{' ✅' if semi_filled else ' ❌'}", callback_data=f"type_semi_{item}")],
            [InlineKeyboardButton("Назад", callback_data='back_to_select_edit_items')]
        ]

        reply_markup = InlineKeyboardMarkup(keyboard)
        context.user_data['edit_mode'] = True
        await query.edit_message_text("Выберите тип продукта для редактирования:", reply_markup=reply_markup)
        return CHOOSING_ITEM_TYPE
    
    async def enter_quantity_for_edit(self, update: Update, context: CallbackContext) -> int:
        logging.info("Функция enter_quantity_for_edit вызвана.")
        if update.message:
            quantity_text = update.message.text.strip()
            
            if not quantity_text.isdigit():
                await update.message.reply_text("Пожалуйста, введите корректное числовое значение.")
                return ENTERING_QUANTITY

            quantity = int(quantity_text)
            category = context.user_data['chosen_category']
            item = context.user_data['chosen_item']
            item_type = context.user_data['chosen_item_type']
            chat_id = context.user_data['chat_id']

            if None in [category, item, item_type, chat_id]:
                await update.message.reply_text("Ошибка: Недостаточно данных для продолжения. Пожалуйста, начните заново.")
                return RETURN_MENU

            logging.info(
                f"Обновление количества: категория='{category}', товар='{item}', тип='{item_type}', количество={quantity}."
            )

            # Обновляем количество
            self.set_quantity(chat_id, category, item, quantity, item_type)
            self.save_inventory()\
            
            if context.user_data.get('edit_mode'):
                context.user_data['edit_mode'] = False    

            await update.message.reply_text(f"Количество для '{item} ({item_type})' обновлено на {quantity}.")
            keyboard = [
                [InlineKeyboardButton("Продолжить поиск", callback_data='edit_inventory')],
                [InlineKeyboardButton("Главное меню", callback_data='back_to_menu')]
            ]
            
            reply_markup = InlineKeyboardMarkup(keyboard)

            await update.message.reply_text(
                "Что вы хотите сделать дальше?",
                reply_markup=reply_markup
            )            
            
            return RETURN_MENU

        # В случае ошибки ввода:
        await update.message.reply_text("Ошибка обработки, повторите ввод.")
        return ENTERING_QUANTITY_FOR_EDIT