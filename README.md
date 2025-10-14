# Команды:
## 1. Создание сервера
POST /servers
Content-Type: application/json

```json
{
  "type": "vanilla",  // или "paper" (в будущем fabric и forge)
  "version": "1.20.4"
}
```
Ответ:
```json
{ "id": "a1b2c3d4e5f6" }
```

### Поддерживаемые версии:
Vanilla: любая стабильная (например, 1.20.4, 1.21, 1.19.4)
Paper: только те, что есть в официальном API 
     
## 2. Получить список всех серверов
GET /servers
Ответ:
```json
[
  {
    "id": "a1b2c3d4e5f6",
    "type": "paper",
    "version": "1.20.4",
    "running": false
  }
]
```
## 3. Запуск сервера
POST /servers/{id}/start
Ответ:
```json
{ "status": "started" }
```

## 4. Остановка сервера
POST /servers/{id}/stop
Ответ:
```json
{ "status": "stopped" }
```

## 5. Удаление сервера (пока не реализовано)

## 6. Вывод логов сервера
GET servers/{id}/logs
Ответ:
```
Starting net.minecraft.server.Main
[14:40:49] [ServerMain/INFO]: Environment: authHost='https://authserver.mojang.com'...
[14:40:50] [ServerMain/INFO]: Loaded 7 recipes
```
Особенности: хранит только последних 700 строк

# Запуск
Проект можно запустить как локально на вашей машине (без Docker), так и собрать в Docker-образ.

## Локальный запуск (рекомендуется для разработки)
Убедитесь, что у вас установлен [Go 1.22+](https://golang.org/dl/).
1. Клонируйте репозиторий:
```bash
git clone -b golang https://github.com/ваш-юзер/mcstack.git
cd mcstack
```
2. Скопируйте пример конфигурации:
```bash
cp config.example.json config.json
```
3. Запустите приложение:
```bash
go run cmd/mcstack/main.go
```
Приложение будет доступно по адресу:  **http://localhost:8080**
> Сервер автоматически создаст папку `data/` для хранения Java, серверов и логов.
---
### Запуск через Docker (для production или тестирования)
1. Соберите образ:
```bash
docker build -t mcstack .
```
2. Скопируйте пример конфигурации:
```bash
cp config.example.json config.json
```
3. Запустите контейнер:
```bash
docker run -d -p 8080:8080 --name mcstack mcstack
```

Приложение будет доступно по адресу:  **http://localhost:8080**
> Обратите внимание: по умолчанию данные (сервера, Java) хранятся **внутри контейнера**. Чтобы сохранить их между перезапусками, используйте volume:
> ```bash
> docker run -d -p 8080:8080 -v ./data:/app/data --name mcstack mcstack
> ```


