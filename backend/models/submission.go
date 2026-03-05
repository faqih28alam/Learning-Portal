package models

import "time"

type Submission struct {
	ID          uint      `json:"id"          gorm:"primaryKey;autoIncrement"`
	QuestionID  uint      `json:"question_id" gorm:"not null"`
	Question    Question  `json:"question"    gorm:"foreignKey:QuestionID"`
	StudentID   uint      `json:"student_id"  gorm:"not null"`
	Student     User      `json:"student"     gorm:"foreignKey:StudentID"`
	AnswerText  string    `json:"answer_text" gorm:"type:text;not null"`
	Score       float64   `json:"score"       gorm:"type:decimal(5,4)"`
	SubmittedAt time.Time `json:"submitted_at"`
}
