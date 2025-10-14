package java

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"runtime"
)

func EnsureJava(version string, dataDir string) (string, error) {
	absDataDir, err := filepath.Abs(dataDir)
	if err != nil {
		return "", fmt.Errorf("failed to get absolute path for dataDir: %w", err)
	}

	goos := runtime.GOOS
	var url, archiveName string

	switch goos {
	case "windows":
		url = fmt.Sprintf("https://api.adoptium.net/v3/binary/latest/%s/ga/windows/x64/jdk/hotspot/normal/adoptium?project=jdk", version)
		archiveName = "java.zip"
	default:
		url = fmt.Sprintf("https://api.adoptium.net/v3/binary/latest/%s/ga/linux/x64/jdk/hotspot/normal/adoptium?project=jdk", version)
		archiveName = "java.tar.gz"
	}

	javaBase := filepath.Join(absDataDir, "java", version)

	if path, err := findJavaInDir(javaBase, goos); err == nil {
		fmt.Printf("Java found at: %s\n", path)
		return path, nil
	}

	fmt.Println("Java not found, downloading...")

	resp, err := http.Get(url)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("download failed: %s", resp.Status)
	}

	tmpFile := filepath.Join(os.TempDir(), archiveName)
	out, err := os.Create(tmpFile)
	if err != nil {
		return "", err
	}
	_, err = io.Copy(out, resp.Body)
	out.Close()
	if err != nil {
		return "", err
	}

	if err := os.MkdirAll(javaBase, 0755); err != nil {
		return "", err
	}

	if goos == "windows" {
		err = unzip(tmpFile, javaBase)
	} else {
		err = untar(tmpFile, javaBase)
	}
	os.Remove(tmpFile)
	if err != nil {
		return "", err
	}

	if err := compressStructure(javaBase); err != nil {
		return "", fmt.Errorf("failed to flatten JDK structure: %w", err)
	}

	if path, err := findJavaInDir(javaBase, goos); err == nil {
		absPath, err := filepath.Abs(path)
		if err != nil {
			return "", fmt.Errorf("failed to make java path absolute: %w", err)
		}
		fmt.Printf("Java unpacked and found at: %s\n", absPath)
		return absPath, nil
	}

	return "", fmt.Errorf("java binary not found in %s after unpacking", javaBase)
}

// findJavaInDir ищет bin/java(.exe) в корне dir или в одном из его подкаталогов первого уровня
// (по сути, это уже не нужно, т.к. EnsureJava распаковывает и перемещает java, убирая подпапку)
func findJavaInDir(dir, goos string) (string, error) {
	binPath := filepath.Join(dir, "bin", "java")
	if goos == "windows" {
		binPath += ".exe"
	}
	if _, err := os.Stat(binPath); err == nil {
		return binPath, nil
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return "", err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			candidate := filepath.Join(dir, entry.Name(), "bin", "java")
			if goos == "windows" {
				candidate += ".exe"
			}
			if _, err := os.Stat(candidate); err == nil {
				return candidate, nil
			}
		}
	}

	return "", fmt.Errorf("java not found in %s", dir)
}

func compressStructure(dir string) error {
	entries, err := os.ReadDir(dir)
	if err != nil {
		return err
	}

	var dirs []string
	for _, entry := range entries {
		if entry.IsDir() {
			dirs = append(dirs, entry.Name())
		}
	}

	if len(dirs) == 1 {
		subdir := filepath.Join(dir, dirs[0])
		subEntries, err := os.ReadDir(subdir)
		if err != nil {
			return err
		}

		for _, entry := range subEntries {
			srcPath := filepath.Join(subdir, entry.Name())
			dstPath := filepath.Join(dir, entry.Name())

			if err := os.Rename(srcPath, dstPath); err != nil {
				return fmt.Errorf("failed to move %s to %s: %w", srcPath, dstPath, err)
			}
		}

		if err := os.Remove(subdir); err != nil {
			return fmt.Errorf("failed to remove empty subdir %s: %w", subdir, err)
		}

		fmt.Printf("Compressed structure: moved contents from %s into %s\n", subdir, dir)
	}

	return nil
}
