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

* Clone the repository:

```javascript
git clone https://github.com/crazykivi/minecraft-backend.git
cd minecraft-backend
```

* Or download one of the archives from the release page: [github.com/releases](https://github.com/crazykivi/MCStack/releases)
* Run the start.bat script (for Windows) or start.sh (for Ubuntu and Debian) 
> For Linux (Ubuntu or Debian), make the script executable first:
> ```bash
> chmod +x start.sh
> ```
> Then run the script:
* Or manually start the project using Docker Compose:

```javascript
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

* Склонируйте репозиторий:

```javascript
git clone https://github.com/crazykivi/minecraft-backend.git
cd minecraft-backend
```
* Или скачайте один из архивов, доступных в релизных версия: [github.com/releases](https://github.com/crazykivi/MCStack/releases)
* Запустите скрипт start.bat (для Windows) или start.sh (для Ubuntu и Debian)
> Для Linux (Ubuntu или Debian) нужно сделать файл исполняемым: 
> ```bash
> chmod +x start.sh
> ```
> После чего запустите скрипт ./start.sh
* Или запустите проект вручную с помощью Docker Compose

```javascript
docker compose up -d
```
</details>