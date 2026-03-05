package main

import (
	"log"
	"os"

	"essay-scorer/backend/config"
	"essay-scorer/backend/models"
	"essay-scorer/backend/routes"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	// Only load .env if running locally
	if os.Getenv("APP_ENV") != "docker" {
		_ = godotenv.Load(".env.local")
	}

	// Connect DB
	config.ConnectDB()

	// Auto-migrate schema
	if err := config.DB.AutoMigrate(
		&models.User{},
		&models.Question{},
		&models.Submission{},
	); err != nil {
		log.Fatal("Migration failed:", err)
	}
	log.Println("✅ Schema migrated")

	// Setup Gin
	r := gin.Default()

	// Health check
	r.GET("/health", func(c *gin.Context) {
		c.JSON(200, gin.H{"status": "ok"})
	})

	routes.Setup(r)

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("🚀 Server running on :%s\n", port)
	r.Run(":" + port)
}
