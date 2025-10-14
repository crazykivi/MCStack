package main

import (
	"fmt"
	"log"
	"mcstack/internal/api"
	"mcstack/internal/config"
	"mcstack/internal/server"
)

func main() {
	cfg := config.Load()
	manager := server.NewManager(cfg.Paths.DataDir)

	router := api.SetupRoutes(cfg, manager)

	log.Printf("Starting server on port %d", cfg.Server.Port)
	log.Fatal(router.Run(fmt.Sprintf(":%d", cfg.Server.Port)))
}
