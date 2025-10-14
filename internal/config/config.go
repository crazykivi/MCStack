package config

import (
	"log"
	"os"

	"github.com/spf13/viper"
)

type Config struct {
	Auth struct {
		Enabled bool   `mapstructure:"enabled"`
		Token   string `mapstructure:"token"`
	} `mapstructure:"auth"`
	Server struct {
		Port int `mapstructure:"port"`
	} `mapstructure:"server"`
	Paths struct {
		DataDir string `mapstructure:"data_dir"`
	} `mapstructure:"paths"`
}

func Load() *Config {
	viper.SetConfigName("config")
	viper.SetConfigType("json")
	viper.AddConfigPath(".")

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); ok {
			log.Println("config.json not found, using config.example.json as template")
			if err := copyExampleConfig(); err != nil {
				log.Fatal("Failed to create config.json:", err)
			}
			viper.ReadInConfig()
		} else {
			log.Fatal("Error reading config:", err)
		}
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		log.Fatal("Unable to decode config:", err)
	}

	if cfg.Paths.DataDir == "" {
		cfg.Paths.DataDir = "./data"
	}
	if err := os.MkdirAll(cfg.Paths.DataDir, 0755); err != nil {
		log.Fatal("Failed to create data dir:", err)
	}

	return &cfg
}

func copyExampleConfig() error {
	data, err := os.ReadFile("config.example.json")
	if err != nil {
		return err
	}
	return os.WriteFile("config.json", data, 0644)
}
