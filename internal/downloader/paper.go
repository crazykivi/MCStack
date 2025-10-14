package downloader

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
)

type PaperVersionResponse struct {
	Versions []string `json:"versions"`
}

type PaperBuildsResponse struct {
	Builds []struct {
		Build int `json:"build"`
	} `json:"builds"`
}

func GetLatestPaperBuild(mcVersion string) (int, error) {
	resp, err := http.Get("https://api.papermc.io/v2/projects/paper")
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	var proj PaperVersionResponse
	if err := json.NewDecoder(resp.Body).Decode(&proj); err != nil {
		return 0, err
	}

	found := false
	for _, v := range proj.Versions {
		if v == mcVersion {
			found = true
			break
		}
	}
	if !found {
		return 0, fmt.Errorf("paper does not support Minecraft %s", mcVersion)
	}

	buildsURL := fmt.Sprintf("https://api.papermc.io/v2/projects/paper/versions/%s/builds", mcVersion)
	resp2, err := http.Get(buildsURL)
	if err != nil {
		return 0, err
	}
	defer resp2.Body.Close()

	var builds PaperBuildsResponse
	if err := json.NewDecoder(resp2.Body).Decode(&builds); err != nil {
		return 0, err
	}

	if len(builds.Builds) == 0 {
		return 0, fmt.Errorf("no builds for %s", mcVersion)
	}

	return builds.Builds[len(builds.Builds)-1].Build, nil
}

func DownloadPaper(mcVersion string, build int, destDir string) error {
	fileName := fmt.Sprintf("paper-%s-%d.jar", mcVersion, build)
	url := fmt.Sprintf("https://api.papermc.io/v2/projects/paper/versions/%s/builds/%d/downloads/%s",
		mcVersion, build, fileName)

	resp, err := http.Get(url)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != 200 {
		return fmt.Errorf("paper download failed: %d", resp.StatusCode)
	}

	outPath := filepath.Join(destDir, "server.jar")
	out, err := os.Create(outPath)
	if err != nil {
		return err
	}
	defer out.Close()

	_, err = io.Copy(out, resp.Body)
	return err
}
