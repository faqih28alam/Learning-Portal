package models

import (
	"time"

	"gorm.io/gorm"
)

type Question struct {
	ID        uint           `json:"id"         gorm:"primaryKey;autoIncrement"`
	Title     string         `json:"title"      gorm:"not null"`
	Body      string         `json:"body"       gorm:"type:text;not null"`
	AnswerKey string         `json:"answer_key" gorm:"type:text;not null"`
	CreatedBy uint           `json:"created_by" gorm:"not null"`
	Teacher   User           `json:"teacher"    gorm:"foreignKey:CreatedBy"`
	CreatedAt time.Time      `json:"created_at"`
	DeletedAt gorm.DeletedAt `json:"-"          gorm:"index"`
}

type QuestionResponse struct {
	ID        uint      `json:"id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	CreatedBy uint      `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
	// NOTE: AnswerKey intentionally excluded from student responses
}

type QuestionDetailResponse struct {
	ID        uint      `json:"id"`
	Title     string    `json:"title"`
	Body      string    `json:"body"`
	AnswerKey string    `json:"answer_key"` // only shown to teacher
	CreatedBy uint      `json:"created_by"`
	CreatedAt time.Time `json:"created_at"`
}
