package utils

import (
	"strings"

	"github.com/gin-gonic/gin"
)

// ValidationError returns a clean, readable error for binding failures
func ValidationError(c *gin.Context, err error) {
	msg := err.Error()

	// Make Gin's binding errors human-readable
	replacements := map[string]string{
		"Key: 'RegisterRequest.Name' Error:Field validation for 'Name' failed on the 'required' tag":    "Name is required",
		"Key: 'RegisterRequest.Email' Error:Field validation for 'Email' failed on the 'email' tag":     "Valid email is required",
		"Key: 'RegisterRequest.Password' Error:Field validation for 'Password' failed on the 'min' tag": "Password must be at least 6 characters",
		"Key: 'RegisterRequest.Role' Error:Field validation for 'Role' failed on the 'oneof' tag":       "Role must be 'teacher' or 'student'",
	}

	for raw, clean := range replacements {
		if strings.Contains(msg, raw) {
			msg = clean
			break
		}
	}

	c.JSON(400, gin.H{"error": msg})
}
