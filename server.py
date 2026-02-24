#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
Простой HTTP сервер для раздачи статических файлов
Запуск: python server.py
"""

import http.server
import socketserver
import webbrowser
import os

# Настройки
PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    """Обработчик запросов"""
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Добавляем поддержку UTF-8
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

def main():
    """Запуск сервера"""
    try:
        # Создаем сокет
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            print(f"🚀 Сервер запущен на порту {PORT}")
            print(f"📁 Раздаю файлы из: {DIRECTORY}")
            print(f"🌐 Открой в браузере: http://localhost:{PORT}")
            print("🛑 Нажми Ctrl+C для остановки")
            
            # Открываем браузер
            webbrowser.open(f'http://localhost:{PORT}')
            
            # Запускаем сервер
            httpd.serve_forever()
            
    except KeyboardInterrupt:
        print("\n👋 Сервер остановлен")
    except Exception as e:
        print(f"❌ Ошибка: {e}")

if __name__ == "__main__":
    main()