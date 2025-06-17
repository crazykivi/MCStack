# MCStack (работает только со стабильными версиями)
![3e702509-0e16-41a0-a713-361f6ced69af](https://github.com/user-attachments/assets/af2020b1-41a7-4ca7-9666-934371e67fa2)
Расширенная информация содержится тут: https://outline.nikitaredk0.ru/s/682c860b-97f6-452a-9a91-899b2df5ee63

## ⚠️ Disclaimer

This project is still in development. The translation is being handled by mysterious forces (AI), so expect some glitches and weirdness along the way. The original language of this project is Russian.

<details>
<summary>🇬🇧 Show description in English</summary>

## **Description**

The application allows you to: 

* Automatically download and install the required version of Java for running a Minecraft server.
* Manage server startup via HTTP requests.
* Configure server settings using a configuration file.

## **Requirements**

To run the application, you will need: 

* Internet access to download Java and server files.
* Docker (version 18.06.0 or higher) and Docker Compose (version 1.27.0 or higher). If Docker is not installed, you can run the start script to install it automatically.

## **Available Builds**

Currently, the following server types are supported in the automated build system: 

* ***Vanilla***
* ***Mods***:
  * *Forge*
  * *Fabric*
* ***Plugins***:
  * *Paper*

## **Installation**


1. Download the Project

   
   1. Option 1: Clone the Repository

      ```bash
      git clone https://github.com/crazykivi/minecraft-backend.git
      cd minecraft-backend
      ```
   2. Option 2: You can download one of the release versions from GitHub: [Releases](https://github.com/crazykivi/MCStack/releases)
   3. Option 3: Create a file named `docker-compose.yml` in your project folder and add the following content

      ```yaml
      version: "3"
      name: mcstack
      
      services:
        redis:
          image: redis:latest
          ports:
            - "6379:6379"
          networks:
            - minecraft-network
          profiles:
            - "local-redis"
            - "all"
      
        api:
          image: crazykivi/mcstack-api:0.2.531
          ports:
            - "3001:3001"
            - "25565:25565"
            - "3002:3002"
          volumes:
            - mcstack_data:/app/data
            - ./server:/app/server
            - ./config:/app/config
          env_file:
            - .env
          environment:
            DISABLE_REDIS: ${DISABLE_REDIS:-0}
            REDIS_HOST: ${REDIS_HOST:-redis}
          restart: always
          networks:
            - minecraft-network
          dns:
            - 8.8.8.8
            - 8.8.4.4
          profiles:
            - "local-redis"
            - "frontend"
            - "api-only"
            - "all"
      
        frontend:
          image: crazykivi/mcstack-frontend:0.2.531
          ports:
            - "3000:3000"
            - "80:80"
          depends_on:
            - api
          restart: always
          profiles:
            - "frontend"
            - "all"
          networks:
            - minecraft-network
      
      networks:
        minecraft-network:
      
      volumes:
        mcstack_data:
      ```
   4. Option 4: Download Pre-Made `docker-compose.yml`

      [docker-compose.yml 1084](/api/attachments.redirect?id=d6d42e19-e784-4845-8caf-1cbf2f45ec67)

2. Configure the `.env` File *(optional)*

   
   1. Create `.env` in the Project Root

      ```env
      # Path to SQLite database file (used for authentication)
      DATABASE_PATH=/app/data/users.db
      
      # Secret key for JWT encryption
      
      JWT_SECRET=your_jwt_secret_key_here
      
      # Redis settings (if using external Redis)
      # REDIS_HOST=redis
      # REDIS_PORT=6379
      
      # Launch Profiles
      # Run everything (API, Redis, Frontend)
      COMPOSE_PROFILES=all
      
      # Run without frontend but with Redis (mainly used in development)
      # COMPOSE_PROFILES=local-redis
      
      # Run without Redis but with Frontend
      # COMPOSE_PROFILES=frontend
      
      # To run only the API, set this variable to "api-only"
      # COMPOSE_PROFILES=api-only
      
      # URL to backend for frontend (if not set, defaults to http://localhost:3001)
      # REACT_APP_API_URL=http://yourdomain.com:3001
      ```
   2. Or Download Ready `.env` 

      [.env 1580](/api/attachments.redirect?id=7dabc6a9-9578-4e80-ae67-3ade512193dc)

3. Launch the Project

   
   1. Option A: Using Script (`start.bat` or `start.sh`)

      > For Windows: simply run `start.bat`
      >
      > For Linux (Ubuntu or Debian): make the script executable:
      >
      > 
      > 1. ```bash
      >    chmod +x start.sh
      >    ./start.sh
      >    ```
   2. Option B: Manual Start via Docker Compose

      ```bash
      docker compose up -d
      ```

</details>
<details>
<summary>🇷🇺 Показать описание на русском</summary>

## **Описание**

Приложение позволяет:

* Автоматически скачивать и устанавливать необходимую версию Java для запуска сервера Minecraft.
* Управлять запуском серверов через HTTP-запросы.
* Настроить параметры сервера с помощью конфигурационного файла.

## **Требования**

Для работы приложения необходимо:

* Доступ к интернету для скачивания Java и серверных файлов.
* Docker (версии 18.06.0 или выше) и Docker Compose (версии 1.27.0 или выше). Если Docker не установлен, то можно запустить скрипт start и установить Docker через него.

## **Доступные сборки**

На данный момент в автосборке сервера поддерживаются версии:

* ***Vanilla***
* ***Mods***:
  * *Forge*
  * *Fabric*
* ***Plugins***:
  * *Paper*

## **Установка**

Скачайте проект

    Склонируйте репозиторий:

    git clone https://github.com/crazykivi/minecraft-backend
    git cd minecraft-backend

    Или скачайте один из архивов, доступных в релизных версия: github.com/releases

    Или создайте в нужной папке файл docker-compose.yml и добавьте в него:

    version: "3"
    name: mcstack

    services:
      redis:
        image: redis:latest
        ports:
          - "6379:6379"
        networks:
          - minecraft-network
        profiles:
          - "local-redis"
          - "all"

      api:
        image: crazykivi/mcstack-api:latest
        ports:
          - "3001:3001"
          - "25565:25565"
          - "3002:3002"
        volumes:
          - mcstack_data:/app/data
          - ./server:/app/server
          - ./config:/app/config
        env_file:
          - .env
        environment:
          DISABLE_REDIS: ${DISABLE_REDIS:-0}
          REDIS_HOST: ${REDIS_HOST:-redis}
        restart: always
        networks:
          - minecraft-network
        dns:
          - 8.8.8.8
          - 8.8.4.4
        profiles:
          - "local-redis"
          - "frontend"
          - "api-only"
          - "all"

      frontend:
        image: crazykivi/mcstack-frontend:latest
        ports:
          - "3000:3000"
          - "80:80"
        depends_on:
          - api
        restart: always
        profiles:
          - "frontend"
          - "all"
        networks:
          - minecraft-network

    networks:
      minecraft-network:

    volumes:
      mcstack_data:

    Или просто скачайте готовый docker-compose.yml

Настройка .env файла (если требуется):

    Создайте .env файл в корне проекта и добавьте в него:

    # ENG/RUS
    DATABASE_PATH=/app/data/users.db
    JWT_SECRET=obyazatelno_input_your_jwt_secret_key

    # If you already have Redis, specify the host and port / Если у вас уже есть Redis, укажите хост и порт
    # REDIS_HOST=redis
    # REDIS_PORT=6379

    # Launch profiles / Профили запуска
    # Run everything / Запуск всего
    COMPOSE_PROFILES=all

    # Run without frontend and with Redis (currently used only in development, / Запуск без frontend с redis (пока используется только в разработке, 
    # in the future it will be possible to manage API requests) / в будущем будет возможность управлять api запросами)
    # COMPOSE_PROFILES=local-redis

    # Run without Redis but with frontend / Запуск без редис, но с frontend
    # COMPOSE_PROFILES=frontend
    # To run only the api, write api-only to the COMPOSE_PROFILES variable / Для запуска только api в переменную COMPOSE_PROFILES нужно записать api-only
    # COMPOSE_PROFILES=api-only

    # This variable is a link to the backend (for the frontend). If the REACT_APP_API_URL variable is missing, the default value 'http://localhost:3001' is used 
    # Эта переменная являетя ссылкой на бекенд (для фронтенда). Если переменная REACT_APP_API_URL отсутствует, берётся дефолтное значение 'http://localhost:3001'
    # REACT_APP_API_URL=http://192.168.20.184:3001

    Или просто скачайте готовый .env

    Запустите проект

        Запустите скрипт (start.bat или start.sh)

            Для Windows: просто запустите start.bat

            Для Linux (Ubuntu или Debian) нужно сделать файл исполняемым:

            chmod +x start.sh

            После чего запустите скрипт ./start.sh

        Или запустите проект вручную с помощью Docker Compose

        docker compose up -d

</details>