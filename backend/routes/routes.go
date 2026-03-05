package routes

import (
	"essay-scorer/backend/handlers"
	"essay-scorer/backend/middleware"

	"github.com/gin-gonic/gin"
)

func Setup(r *gin.Engine) {
	api := r.Group("/api/v1")

	// ── Public routes ──────────────────────────────────────
	auth := api.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}

	// ── Protected routes (all roles) ───────────────────────
	protected := api.Group("/")
	protected.Use(middleware.AuthMiddleware())
	{
		protected.GET("/me", handlers.Me)

		// Questions — read available to all
		protected.GET("/questions", handlers.ListQuestions)
		protected.GET("/questions/:id", handlers.GetQuestion)

		// Questions — write restricted to teacher
		teacher := protected.Group("/")
		teacher.Use(middleware.RequireRole("teacher"))
		{
			teacher.POST("/questions", handlers.CreateQuestion)
			teacher.PUT("/questions/:id", handlers.UpdateQuestion)
			teacher.DELETE("/questions/:id", handlers.DeleteQuestion)
			teacher.GET("/questions/:id/submissions", handlers.GetSubmissions)
		}

		// Submissions — student only
		student := protected.Group("/")
		student.Use(middleware.RequireRole("student"))
		{
			student.POST("/questions/:id/submit", handlers.SubmitAnswer)
		}

		// Student's own submission history
		protected.GET("/my-submissions", handlers.MySubmissions)
	}
}
