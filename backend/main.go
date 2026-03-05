package main

import (
	"log"
	"os"
	"strings"
	"time"

	"essay-scorer/backend/config"
	"essay-scorer/backend/models"
	"essay-scorer/backend/routes"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func getCORSOrigins() []string {
	// Comma-separated origins, e.g.:
	// "https://learning-portal.vercel.app,http://localhost:3000"
	raw := os.Getenv("ALLOWED_ORIGINS")
	if raw == "" {
		return []string{"http://localhost:3000"}
	}
	origins := []string{}
	for _, o := range strings.Split(raw, ",") {
		o = strings.TrimSpace(o)
		if o != "" {
			origins = append(origins, o)
		}
	}
	return origins
}

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

	// ── CORS ────────────────────────────────────────────────────────
	r.Use(cors.New(cors.Config{
		AllowOrigins:     getCORSOrigins(),
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization", "Accept"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
		MaxAge:           12 * time.Hour,
	}))

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
