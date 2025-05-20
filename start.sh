export LANG=C.UTF-8

# Funkciya dlya vypolneniya komandy s sudo, esli vozmozhno
run_with_sudo_if_possible() {
    if command -v sudo &> /dev/null && [ "$EUID" -ne 0 ]; then
        sudo "$@"
    else
        "$@"
    fi
}

# Funkciya dlya ochistki ekrana i otrazheniya menu
show_menu() {
    clear
    echo "         ========== MCStack Manager =========="
    echo ""
    echo "  [1] Start all services (all)"
    echo "  [2] Start local-redis (without frontend)"
    echo "  [3] Start frontend (without redis)"
    echo "  [4] Start only API"
    echo "  [5] Stop containers"
    echo "  [6] Restart containers"
    echo "  [7] View logs"
    echo "  [0] Exit"
    echo ""
}

# Proverka nalichiya Docker
if ! command -v docker &> /dev/null; then
    echo "Error: Docker not installed or unavailable!"
    echo ""
    echo "Important: If Docker is installed but not available,"
    echo "restart service 'sudo systemctl start docker'"
    echo ""
    echo "[1] Install Docker (via apt)"
    echo "[0] Exit"
    read -p "Select action (1 or 0): " choice

    case $choice in
        1)
            echo "Installing Docker and Docker Compose..."
            run_with_sudo_if_possible apt update && \
            run_with_sudo_if_possible apt install -y apt-transport-https ca-certificates curl software-properties-common && \

            curl -fsSL https://download.docker.com/linux/ubuntu/gpg  | run_with_sudo_if_possible gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg && \

            echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu  $(lsb_release -cs) stable" | run_with_sudo_if_possible tee /etc/apt/sources.list.d/docker.list > /dev/null && \

            run_with_sudo_if_possible apt update && \
            run_with_sudo_if_possible apt install -y docker-ce docker-ce-cli containerd.io && \

            run_with_sudo_if_possible systemctl enable docker && \
            run_with_sudo_if_possible systemctl start docker && \

            echo "Installing docker-compose..."
            run_with_sudo_if_possible curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose- $(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose && \
            run_with_sudo_if_possible chmod +x /usr/local/bin/docker-compose && \

            if ! [ "$EUID" -eq 0 ]; then
                run_with_sudo_if_possible usermod -aG docker $USER
                echo "You have been added to the 'docker' group. Log out and back in."
            fi

            echo "Docker and Docker Compose installed."
            echo "Restarting script..."
            exec "$0"
            ;;
        0)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice."
            sleep 2
            exec "$0"
            ;;
    esac
fi

# Osnovnoe menu
while true; do
    show_menu
    read -p "Select action (1-7) or 0 to exit: " choice

    case $choice in
        1)
            COMPOSE_PROFILES="all" docker compose up -d
            echo "Started with profile: all"
            read -n 1 -s -r -p "Press any key to continue..."
            ;;
        2)
            COMPOSE_PROFILES="local-redis" docker compose up -d
            echo "Started with profile: local-redis"
            read -n 1 -s -r -p "Press any key to continue..."
            ;;
        3)
            COMPOSE_PROFILES="frontend" docker compose up -d
            echo "Started with profile: frontend"
            read -n 1 -s -r -p "Press any key to continue..."
            ;;
        4)
            docker compose up -d
            echo "Only API started"
            read -n 1 -s -r -p "Press any key to continue..."
            ;;
        5)
            docker compose down
            echo "Containers stopped"
            read -n 1 -s -r -p "Press any key to continue..."
            ;;
        6)
            docker compose restart
            echo "Containers restarted"
            read -n 1 -s -r -p "Press any key to continue..."
            ;;
        7)
            docker compose logs -f
            read -n 1 -s -r -p "Press any key to continue..."
            ;;
        0)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid choice."
            sleep 2
            ;;
    esac
done