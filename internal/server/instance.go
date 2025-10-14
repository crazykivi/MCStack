package server

import (
	"encoding/json"
	"fmt"
	"io"
	"mcstack/internal/java"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"time"
)

type Instance struct {
	ID          string   `json:"id"`
	Type        string   `json:"type"`
	Version     string   `json:"version"`
	JavaVersion string   `json:"java_version,omitempty"` // авто-режим
	JavaPath    string   `json:"java_path,omitempty"`    // ручной режим
	Args        []string `json:"args"`
	Dir         string
	Running     bool `json:"running"`

	// Внутренние поля (не в JSON):
	resolvedJavaPath string
	javaPath         string
	Cmd              *exec.Cmd
	LogFile          *os.File
	logBuffer        *RingBuffer
	mu               sync.Mutex
}

// func (s *Instance) Start() error {
// 	s.mu.Lock()
// 	defer s.mu.Unlock()

// 	if s.Running {
// 		return fmt.Errorf("already running")
// 	}

// 	if s.resolvedJavaPath == "" {
// 		return fmt.Errorf("java executable path is not resolved; check logs for download errors")
// 	}

// 	logPath := filepath.Join(s.Dir, "server.log")
// 	logFile, err := os.Create(logPath)
// 	if err != nil {
// 		return err
// 	}
// 	s.LogFile = logFile

// 	cmd := exec.Command(s.resolvedJavaPath, s.Args...)
// 	cmd.Dir = s.Dir
// 	cmd.Stdout = io.MultiWriter(os.Stdout, logFile)
// 	cmd.Stderr = io.MultiWriter(os.Stderr, logFile)

// 	if err := cmd.Start(); err != nil {
// 		logFile.Close()
// 		return err
// 	}

// 	s.Cmd = cmd
// 	s.Running = true

// 	go func() {
// 		cmd.Wait()
// 		s.mu.Lock()
// 		s.Running = false
// 		s.LogFile.Close()
// 		s.mu.Unlock()
// 	}()

//		return nil
//	}
func (s *Instance) Start() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.Running {
		return fmt.Errorf("already running")
	}
	if s.resolvedJavaPath == "" {
		return fmt.Errorf("java executable path is not resolved")
	}

	logPath := filepath.Join(s.Dir, "server.log")
	logFile, err := os.Create(logPath)
	if err != nil {
		return err
	}
	s.LogFile = logFile

	s.logBuffer = NewRingBuffer(700)
	writer := io.MultiWriter(logFile, s.logBuffer, os.Stdout)

	cmd := exec.Command(s.resolvedJavaPath, s.Args...)
	cmd.Dir = s.Dir
	cmd.Stdout = writer
	cmd.Stderr = writer

	if err := cmd.Start(); err != nil {
		logFile.Close()
		return err
	}

	s.Cmd = cmd
	s.Running = true

	go func() {
		cmd.Wait()
		s.mu.Lock()
		s.Running = false
		s.LogFile.Close()
		s.mu.Unlock()
	}()

	return nil
}

func (s *Instance) Stop() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.Running || s.Cmd == nil {
		return fmt.Errorf("not running")
	}

	// SIGINT (Ctrl+C)
	if s.Cmd.Process != nil {
		fmt.Printf("Sending interrupt to process %d\n", s.Cmd.Process.Pid)
		err := s.Cmd.Process.Signal(os.Interrupt)
		if err != nil {
			fmt.Printf("Error sending interrupt: %v\n", err)
		}
	}

	done := make(chan error, 1)
	go func() {
		done <- s.Cmd.Wait()
	}()

	select {
	case err := <-done:
		fmt.Printf("Process exited with error: %v\n", err)
	case <-time.After(10 * time.Second):
		if s.Cmd.Process != nil {
			fmt.Printf("Killing process %d forcefully\n", s.Cmd.Process.Pid)
			err := s.Cmd.Process.Kill()
			if err != nil {
				return fmt.Errorf("failed to kill process: %w", err)
			}
		}
	}

	s.Running = false
	if s.LogFile != nil {
		s.LogFile.Close()
		s.LogFile = nil
	}
	return nil
}

func (s *Instance) SaveMeta() error {
	meta := struct {
		Type        string   `json:"type"`
		Version     string   `json:"version"`
		JavaVersion string   `json:"java_version,omitempty"` // авто-режим
		JavaPath    string   `json:"java_path,omitempty"`    // ручной режим
		Args        []string `json:"args"`
	}{
		Type:        s.Type,
		Version:     s.Version,
		JavaVersion: s.JavaVersion,
		JavaPath:    s.JavaPath,
		Args:        s.Args,
	}
	data, _ := json.MarshalIndent(meta, "", "  ")
	return os.WriteFile(filepath.Join(s.Dir, "meta.json"), data, 0644)
}

func LoadInstanceFromDir(id, dir, dataDir string) (*Instance, error) {
	metaPath := filepath.Join(dir, "meta.json")
	var meta struct {
		Type        string   `json:"type"`
		Version     string   `json:"version"`
		JavaVersion string   `json:"java_version,omitempty"` // авто-режим
		JavaPath    string   `json:"java_path,omitempty"`    // ручной режим
		Args        []string `json:"args"`
	}

	if _, err := os.Stat(metaPath); err == nil {
		data, _ := os.ReadFile(metaPath)
		json.Unmarshal(data, &meta)
	}

	if len(meta.Args) == 0 {
		meta.Args = []string{"-Xshare:off", "-Xmx1G", "-jar", "server.jar", "nogui"}
	}
	if meta.Type == "" {
		meta.Type = "vanilla"
	}
	if meta.Version == "" {
		meta.Version = "unknown"
	}

	var resolvedJavaPath string

	if meta.JavaPath != "" {
		if _, err := os.Stat(meta.JavaPath); err == nil {
			resolvedJavaPath = meta.JavaPath
		}
	} else {
		if meta.JavaVersion == "" {
			meta.JavaVersion = java.GetRequiredJavaVersion(meta.Version)
		}
		if path, err := java.EnsureJava(meta.JavaVersion, dataDir); err == nil {
			resolvedJavaPath = path
		} else {
			fmt.Printf("Warning: Java not resolved for server %s: %v\n", id, err)
		}
	}

	return &Instance{
		ID:               id,
		Type:             meta.Type,
		Version:          meta.Version,
		JavaVersion:      meta.JavaVersion,
		JavaPath:         meta.JavaPath,
		Args:             meta.Args,
		Dir:              dir,
		resolvedJavaPath: resolvedJavaPath,
		Running:          false,
	}, nil
}

func (s *Instance) GetLogs() string {
	if s.logBuffer == nil {
		return ""
	}
	return s.logBuffer.String()
}
