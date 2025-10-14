package api

import (
	"mcstack/internal/api/handlers"
	"mcstack/internal/config"
	"mcstack/internal/server"

	"github.com/gin-gonic/gin"
)

func SetupRoutes(cfg *config.Config, manager *server.Manager) *gin.Engine {
	r := gin.Default()

	auth := AuthMiddleware(cfg)
	srvHandler := handlers.NewServerHandler(manager)

	r.POST("/servers", auth, srvHandler.Create)
	r.GET("/servers", auth, srvHandler.List)
	r.POST("/servers/:id/start", auth, srvHandler.Start)
	r.POST("/servers/:id/stop", auth, srvHandler.Stop)
	r.GET("/servers/:id/logs", auth, srvHandler.GetLogs)

	return r
}
