// internal/api/handlers/servers.go
package handlers

import (
	"mcstack/internal/server"
	"net/http"

	"github.com/gin-gonic/gin"
)

type ServerHandler struct {
	manager *server.Manager
}

func NewServerHandler(manager *server.Manager) *ServerHandler {
	return &ServerHandler{manager: manager}
}

// Create создаёт новый сервер (vanilla или paper)
func (h *ServerHandler) Create(c *gin.Context) {
	var req struct {
		Type    string `json:"type" binding:"required,oneof=vanilla paper"`
		Version string `json:"version" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	id, err := h.manager.CreateServer(req.Type, req.Version)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"id": id})
}

// List возвращает список всех серверов
func (h *ServerHandler) List(c *gin.Context) {
	servers := h.manager.List()
	type Info struct {
		ID      string   `json:"id"`
		Type    string   `json:"type"`
		Version string   `json:"version"`
		Running bool     `json:"running"`
		Args    []string `json:"args"`
	}
	result := make([]Info, 0, len(servers))
	for _, s := range servers {
		result = append(result, Info{
			ID:      s.ID,
			Type:    s.Type,
			Version: s.Version,
			Running: s.Running,
		})
	}
	c.JSON(http.StatusOK, result)
}

// Start запускает сервер по ID
func (h *ServerHandler) Start(c *gin.Context) {
	id := c.Param("id")
	inst, ok := h.manager.Get(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "server not found"})
		return
	}

	var req struct {
		Args     []string `json:"args,omitempty"`
		JavaPath string   `json:"java_path,omitempty"`
	}
	if c.ShouldBindJSON(&req) == nil {
		if req.Args != nil {
			inst.Args = req.Args
		}
		if req.JavaPath != "" {
			inst.JavaPath = req.JavaPath
			inst.JavaVersion = ""
		}
		inst.SaveMeta()
	}

	if err := inst.Start(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "started"})
}

// Stop останавливает сервер по ID
func (h *ServerHandler) Stop(c *gin.Context) {
	id := c.Param("id")
	inst, ok := h.manager.Get(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "server not found"})
		return
	}
	if err := inst.Stop(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"status": "stopped"})
}

// GetLogs выводит текущий вывод сервера
func (h *ServerHandler) GetLogs(c *gin.Context) {
	id := c.Param("id")
	inst, ok := h.manager.Get(id)
	if !ok {
		c.JSON(http.StatusNotFound, gin.H{"error": "server not found"})
		return
	}

	logs := inst.GetLogs()
	c.Data(http.StatusOK, "text/plain; charset=utf-8", []byte(logs))
}
