export LANG=C.UTF-8

# Функция для выполнения команды с sudo, если возможно
run_with_sudo_if_possible() {
    if command -v sudo &> /dev/null && [ "$EUID" -ne 0 ]; then
        sudo "$@"
    else
        "$@"
    fi
}

# Функция для очистки экрана и отображения меню
show_menu() {
    clear
    echo "         ========== MCStack Manager =========="
    echo ""
    echo "  [1] Запустить все сервисы (all)"
    echo "  [2] Запустить local-redis (без frontend)"
    echo "  [3] Запустить frontend (без redis/api)"
    echo "  [4] Запустить только API"
    echo "  [5] Остановить контейнеры"
    echo "  [6] Перезапустить контейнеры"
    echo "  [7] Посмотреть логи"
    echo "  [0] Выход"
    echo ""
}

# Проверка наличия Docker
if ! command -v docker &> /dev/null; then
    echo "Ошибка: Docker не установлен или недоступен!"
    echo ""
    echo "Важно: Если Docker установлен, но не доступен,"
    echo "перезапустите службу 'sudo systemctl start docker'"
    echo ""
    echo "[1] Установить Docker (через apt)"
    echo "[0] Выйти"
    read -p "Выберите действие (1 или 0): " choice

    case $choice in
        1)
            echo "Установка Docker и Docker Compose..."
            run_with_sudo_if_possible apt update && \
            run_with_sudo_if_possible apt install -y apt-transport-https ca-certificates curl software-properties-common && \

            curl -fsSL https://download.docker.com/linux/ubuntu/gpg  | run_with_sudo_if_possible gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \

            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu  $(lsb_release -cs) stable" | run_with_sudo_if_possible tee /etc/apt/sources.list.d/docker.list > /dev/null && \

            run_with_sudo_if_possible apt update && \
            run_with_sudo_if_possible apt install -y docker-ce docker-ce-cli containerd.io && \

            run_with_sudo_if_possible systemctl enable docker && \
            run_with_sudo_if_possible systemctl start docker && \

            echo "Установка docker-compose..."
            run_with_sudo_if_possible curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose- $(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
            run_with_sudo_if_possible chmod +x /usr/local/bin/docker-compose && \

            if ! [ "$EUID" -eq 0 ]; then
                run_with_sudo_if_possible usermod -aG docker $USER
                echo "Вас добавили в группу 'docker'. Выйдите из системы и войдите снова."
            fi

            echo "Docker и Docker Compose установлены."
            echo "Повторный запуск скрипта..."
            exec "$0"
            ;;
        0)
            echo "Выход..."
            exit 0
            ;;
        *)
            echo "Неверный выбор."
            sleep 2
            exec "$0"
            ;;
    esac
fi

# Основное меню
while true; do
    show_menu
    read -p "Выберите действие (1-7) или 0 для выхода: " choice

    case $choice in
        1)
            COMPOSE_PROFILES="all" docker compose up -d
            echo "Запущено с профилем: all"
            read -n 1 -s -r -p "Нажмите любую клавишу, чтобы продолжить..."
            ;;
        2)
            COMPOSE_PROFILES="local-redis" docker compose up -d
            echo "Запущено с профилем: local-redis"
            read -n 1 -s -r -p "Нажмите любую клавишу, чтобы продолжить..."
            ;;
        3)
            COMPOSE_PROFILES="frontend" docker compose up -d
            echo "Запущено с профилем: frontend"
            read -n 1 -s -r -p "Нажмите любую клавишу, чтобы продолжить..."
            ;;
        4)
            docker compose up -d
            echo "Запущен только API"
            read -n 1 -s -r -p "Нажмите любую клавишу, чтобы продолжить..."
            ;;
        5)
            docker compose down
            echo "Контейнеры остановлены"
            read -n 1 -s -r -p "Нажмите любую клавишу, чтобы продолжить..."
            ;;
        6)
            docker compose restart
            echo "Контейнеры перезапущены"
            read -n 1 -s -r -p "Нажмите любую клавишу, чтобы продолжить..."
            ;;
        7)
            docker compose logs -f
            read -n 1 -s -r -p "Нажмите любую клавишу, чтобы продолжить..."
            ;;
        0)
            echo "Выход..."
            exit 0
            ;;
        *)
            echo "Неверный выбор."
            sleep 2
            ;;
    esac
done