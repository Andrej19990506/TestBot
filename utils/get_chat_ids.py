from telegram import Bot
from config import bot_token
import asyncio
import json

async def get_chat_ids():
    bot = Bot(token=bot_token)
    
    # Список названий чатов
    chat_names = ["Словцова", "Свердловская"]
    
    chat_ids = {}
    for name in chat_names:
        try:
            updates = await bot.get_updates()
            for update in updates:
                if update.message and update.message.chat.title == name:
                    chat_ids[name] = str(update.message.chat.id)
                    print(f"Found chat {name}: {update.message.chat.id}")
                    break
        except Exception as e:
            print(f"Error getting chat ID for {name}: {e}")
    
    return chat_ids

async def main():
    chat_ids = await get_chat_ids()
    print("Chat IDs:", chat_ids)
    
    # Обновляем существующий файл
    try:
        with open('chat_ids.json', 'r', encoding='utf-8') as f:
            existing_ids = json.load(f)
            
        # Обновляем только найденные чаты
        existing_ids.update(chat_ids)
        
        with open('chat_ids.json', 'w', encoding='utf-8') as f:
            json.dump(existing_ids, f, ensure_ascii=False, indent=2)
            
        print("Updated chat_ids.json")
    except Exception as e:
        print(f"Error updating chat_ids.json: {e}")

if __name__ == "__main__":
    asyncio.run(main()) 