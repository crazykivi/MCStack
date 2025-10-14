package downloader

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

type VersionManifest struct {
	Versions []struct {
		ID  string `json:"id"`
		URL string `json:"url"`
	} `json:"versions"`
}

type VersionMeta struct {
	Downloads struct {
		Server struct {
			URL string `json:"url"`
		} `json:"server"`
	} `json:"downloads"`
}

func GetVanillaURL(mcVersion string) (string, error) {
	resp, err := http.Get("https://launchermeta.mojang.com/mc/game/version_manifest.json")
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var manifest VersionManifest
	if err := json.NewDecoder(resp.Body).Decode(&manifest); err != nil {
		return "", err
	}

	for _, v := range manifest.Versions {
		if v.ID == mcVersion {
			metaResp, err := http.Get(v.URL)
			if err != nil {
				return "", err
			}
			defer metaResp.Body.Close()

			var meta VersionMeta
			if err := json.NewDecoder(metaResp.Body).Decode(&meta); err != nil {
				return "", err
			}

			if meta.Downloads.Server.URL == "" {
				return "", fmt.Errorf("no server jar for version %s", mcVersion)
			}
			return meta.Downloads.Server.URL, nil
		}
	}
	return "", fmt.Errorf("version %s not found", mcVersion)
}

func DownloadVanilla(mcVersion, destDir string) error {
	url, err := GetVanillaURL(mcVersion)
	if err != nil {
		return err
	}

	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	outPath := filepath.Join(destDir, "server.jar")
	out, err := os.Create(outPath)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}
