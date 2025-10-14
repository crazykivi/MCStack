package server

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"sync"

	"mcstack/internal/downloader"
	"mcstack/internal/java"
)

type Manager struct {
	instances map[string]*Instance
	dataDir   string
	mu        sync.RWMutex
}

func NewManager(dataDir string) *Manager {
	os.MkdirAll(filepath.Join(dataDir, "servers"), 0755)

	m := &Manager{
		instances: make(map[string]*Instance),
		dataDir:   dataDir,
	}

	m.loadExistingServers()

	return m
}

func (m *Manager) loadExistingServers() {
	serversDir := filepath.Join(m.dataDir, "servers")
	files, err := os.ReadDir(serversDir)
	if err != nil {
		return
	}

	for _, f := range files {
		if !f.IsDir() {
			continue
		}

		id := f.Name()
		serverDir := filepath.Join(serversDir, id)

		inst, err := LoadInstanceFromDir(id, serverDir, m.dataDir)
		if err != nil {
			continue
		}

		m.mu.Lock()
		m.instances[id] = inst
		m.mu.Unlock()
	}
}

func (m *Manager) CreateServer(serverType, mcVersion string) (string, error) {
	id := generateID()
	dir := filepath.Join(m.dataDir, "servers", id)

	if err := os.MkdirAll(dir, 0755); err != nil {
		return "", err
	}

	javaVersion := java.GetRequiredJavaVersion(mcVersion)
	javaPath, err := java.EnsureJava(javaVersion, m.dataDir)
	if err != nil {
		return "", fmt.Errorf("failed to get java %s: %w", javaVersion, err)
	}

	switch serverType {
	case "vanilla":
		if err := downloader.DownloadVanilla(mcVersion, dir); err != nil {
			return "", err
		}
	case "paper":
		build, err := downloader.GetLatestPaperBuild(mcVersion)
		if err != nil {
			return "", err
		}
		if err := downloader.DownloadPaper(mcVersion, build, dir); err != nil {
			return "", err
		}
	default:
		return "", fmt.Errorf("unsupported server type: %s", serverType)
	}

	eulaPath := filepath.Join(dir, "eula.txt")
	os.WriteFile(eulaPath, []byte("eula=true"), 0644)

	instance := &Instance{
		ID:          id,
		Type:        serverType,
		Version:     mcVersion,
		JavaVersion: javaVersion,
		Args:        []string{"-Xshare:off", "-Xmx1G", "-Xms1G", "-jar", "server.jar", "nogui"},
		Dir:         dir,
		javaPath:    javaPath,
	}

	instance.SaveMeta()

	m.mu.Lock()
	m.instances[id] = instance
	m.mu.Unlock()

	return id, nil
}

func (m *Manager) Get(id string) (*Instance, bool) {
	m.mu.RLock()
	defer m.mu.RUnlock()
	inst, ok := m.instances[id]
	return inst, ok
}

func (m *Manager) List() map[string]*Instance {
	m.mu.RLock()
	defer m.mu.RUnlock()
	result := make(map[string]*Instance, len(m.instances))
	for k, v := range m.instances {
		result[k] = v
	}
	return result
}

func generateID() string {
	bytes := make([]byte, 8)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}
