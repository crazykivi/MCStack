package server

import (
	"strings"
	"sync"
)

// RingBuffer - кольцевой буфер для хранения последних N строк
type RingBuffer struct {
	lines []string
	size  int
	head  int // индекс следующей позиции для записи
	mu    sync.RWMutex
}

// NewRingBuffer создаёт новый кольцевой буфер с заданным размером
func NewRingBuffer(size int) *RingBuffer {
	return &RingBuffer{
		lines: make([]string, size),
		size:  size,
		head:  0,
	}
}

// Write добавляет строку в буфер (или несколько строк, если есть `\n`)
func (rb *RingBuffer) Write(p []byte) (n int, err error) {
	rb.mu.Lock()
	defer rb.mu.Unlock()

	text := string(p)
	lines := strings.Split(text, "\n")

	for _, line := range lines {
		if line == "" {
			continue
		}
		rb.lines[rb.head] = line
		rb.head = (rb.head + 1) % rb.size
	}

	return len(p), nil
}

// String возвращает все строки в буфере, от самой старой до самой новой
func (rb *RingBuffer) String() string {
	rb.mu.RLock()
	defer rb.mu.RUnlock()

	var result []string
	start := rb.head
	if start == 0 {
		start = rb.size
	}
	for i := 1; i <= rb.size; i++ {
		idx := (start - i + rb.size) % rb.size
		if rb.lines[idx] != "" {
			result = append(result, rb.lines[idx])
		}
	}
	// Переворот, чтобы старые строки были сверху
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}
	return strings.Join(result, "\n")
}

// Lines возвращает срез строк (без блокировки - только для чтения)
func (rb *RingBuffer) Lines() []string {
	rb.mu.RLock()
	defer rb.mu.RUnlock()

	var result []string
	start := rb.head
	if start == 0 {
		start = rb.size
	}
	for i := 1; i <= rb.size; i++ {
		idx := (start - i + rb.size) % rb.size
		if rb.lines[idx] != "" {
			result = append(result, rb.lines[idx])
		}
	}
	// Также переворот
	for i, j := 0, len(result)-1; i < j; i, j = i+1, j-1 {
		result[i], result[j] = result[j], result[i]
	}
	return result
}
