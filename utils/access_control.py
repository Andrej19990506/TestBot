from telegram import Update
from telegram.error import ChatMigrated, Forbidden
import logging
from utils.chat_manager import ChatManager

class AccessControl:
    def __init__(self, chat_manager):
        self.chat_manager = chat_manager
        self.group_chat_id = chat_manager.chat_ids
        self.allowed_users = set()  # Доступные по администраторским правам
        self.password_users = set()  # Доступные благодаря паролю

    async def has_access(self, update: Update) -> bool:
        user_id = update.effective_user.id
        if update.effective_chat.type == 'private':
            if user_id in self.allowed_users or user_id in self.password_users:
                return True
        return False

    async def update_allowed_users(self, context):
        """Обновление списка разрешенных пользователей"""
        self.allowed_users.clear()
        groups_to_remove = []

        logging.info("Начало обновления администраторов.")

        for group_name, group_id in self.group_chat_id.items():
            try:
                admins = await context.bot.get_chat_administrators(group_id)
                for admin in admins:
                    user_id = admin.user.id
                    self.allowed_users.add(user_id)
                    logging.debug(f"Добавлен администратор с ID {user_id} в группе '{group_name}'.")

            except ChatMigrated as e:
                new_chat_id = e.new_chat_id
                logging.warning(f"Чат '{group_name}' мигрировал на новый ID {new_chat_id}.")
                self.group_chat_id[group_name] = new_chat_id

            except Forbidden:
                logging.warning(f"Доступ к чату '{group_name}' запрещён. Чат будет удалён.")
                groups_to_remove.append(group_name)
            
            except Exception as e:
                logging.error(f"Ошибка при обновлении администраторов для чата '{group_name}': {e}")

        # Удаляем недоступные группы
        for group_name in groups_to_remove:
            del self.group_chat_id[group_name]
            logging.info(f"Чат '{group_name}' удалён из-за отсутствия доступа.")

        # Сохраняем изменения
        try:
            self.chat_manager.save_chat_ids_to_file()
            self.chat_manager.save_admins_ids_to_file(self.allowed_users.union(self.password_users))
            logging.info("Изменения успешно сохранены.")
        except Exception as e:
            logging.error(f"Ошибка при сохранении изменений: {e}")

        logging.info("Обновление администраторов завершено.")
        logging.debug(f"Текущие group_chat_id: {self.group_chat_id}")
        logging.debug(f"Текущие allowed_users: {self.allowed_users}")