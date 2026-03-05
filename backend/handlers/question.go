package handlers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"strconv"
	"time"

	"essay-scorer/backend/config"
	"essay-scorer/backend/models"

	"github.com/gin-gonic/gin"
)

// ── Helpers ───────────────────────────────────────────────────────────

func toQuestionResponse(q models.Question) models.QuestionResponse {
	return models.QuestionResponse{
		ID:        q.ID,
		Title:     q.Title,
		Body:      q.Body,
		CreatedBy: q.CreatedBy,
		CreatedAt: q.CreatedAt,
	}
}

// ── CREATE Question (Teacher only) ────────────────────────────────────

type CreateQuestionRequest struct {
	Title     string `json:"title"      binding:"required,min=3,max=200"`
	Body      string `json:"body"       binding:"required,min=10"`
	AnswerKey string `json:"answer_key" binding:"required,min=20"`
}

func CreateQuestion(c *gin.Context) {
	var req CreateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")

	question := models.Question{
		Title:     req.Title,
		Body:      req.Body,
		AnswerKey: req.AnswerKey,
		CreatedBy: userID.(uint),
	}

	if result := config.DB.Create(&question); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create question"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":  "question created",
		"question": toQuestionResponse(question),
	})
}

// ── LIST Questions (All authenticated users) ──────────────────────────

func ListQuestions(c *gin.Context) {
	var questions []models.Question

	config.DB.Find(&questions)

	// Students get response without answer_key
	role, _ := c.Get("role")
	if role == "teacher" {
		c.JSON(http.StatusOK, gin.H{"questions": questions})
		return
	}

	// Strip answer_key for students
	responses := make([]models.QuestionResponse, len(questions))
	for i, q := range questions {
		responses[i] = toQuestionResponse(q)
	}
	c.JSON(http.StatusOK, gin.H{"questions": responses})
}

// ── GET Single Question ───────────────────────────────────────────────

func GetQuestion(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var question models.Question
	if result := config.DB.First(&question, id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
		return
	}

	role, _ := c.Get("role")
	if role == "teacher" {
		c.JSON(http.StatusOK, models.QuestionDetailResponse{
			ID:        question.ID,
			Title:     question.Title,
			Body:      question.Body,
			AnswerKey: question.AnswerKey,
			CreatedBy: question.CreatedBy,
			CreatedAt: question.CreatedAt,
		})
		return
	}

	c.JSON(http.StatusOK, toQuestionResponse(question))
}

// ── UPDATE Question (Teacher only, own questions) ─────────────────────

type UpdateQuestionRequest struct {
	Title     string `json:"title"      binding:"omitempty,min=3,max=200"`
	Body      string `json:"body"       binding:"omitempty,min=10"`
	AnswerKey string `json:"answer_key" binding:"omitempty,min=20"`
}

func UpdateQuestion(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var question models.Question
	if result := config.DB.First(&question, id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
		return
	}

	// Ownership check
	userID, _ := c.Get("user_id")
	if question.CreatedBy != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only edit your own questions"})
		return
	}

	var req UpdateQuestionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	updates := map[string]interface{}{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Body != "" {
		updates["body"] = req.Body
	}
	if req.AnswerKey != "" {
		updates["answer_key"] = req.AnswerKey
	}

	config.DB.Model(&question).Updates(updates)

	c.JSON(http.StatusOK, gin.H{
		"message":  "question updated",
		"question": toQuestionResponse(question),
	})
}

// ── DELETE Question (Teacher only, own questions) ─────────────────────

func DeleteQuestion(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid id"})
		return
	}

	var question models.Question
	if result := config.DB.First(&question, id); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
		return
	}

	userID, _ := c.Get("user_id")
	if question.CreatedBy != userID.(uint) {
		c.JSON(http.StatusForbidden, gin.H{"error": "you can only delete your own questions"})
		return
	}

	config.DB.Delete(&question) // soft delete via DeletedAt
	c.JSON(http.StatusOK, gin.H{"message": "question deleted"})
}

// ── SUBMIT Answer (Student only) ──────────────────────────────────────

type SubmitAnswerRequest struct {
	AnswerText string `json:"answer_text" binding:"required,min=10"`
}

// scorePayload matches what Python service expects
type scorePayload struct {
	AnswerKey     string `json:"answer_key"`
	StudentAnswer string `json:"student_answer"`
}

// scoreResult matches what Python service returns
type scoreResult struct {
	Score float64 `json:"score"`
}

func SubmitAnswer(c *gin.Context) {
	questionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid question id"})
		return
	}

	var req SubmitAnswerRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Load the question (need answer_key for scoring)
	var question models.Question
	if result := config.DB.First(&question, questionID); result.Error != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "question not found"})
		return
	}

	// Call Python NLP service
	score, err := callNLPService(question.AnswerKey, req.AnswerText)
	if err != nil {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "scoring service unavailable"})
		return
	}

	studentID, _ := c.Get("user_id")

	submission := models.Submission{
		QuestionID:  uint(questionID),
		StudentID:   studentID.(uint),
		AnswerText:  req.AnswerText,
		Score:       score,
		SubmittedAt: time.Now(),
	}

	if result := config.DB.Create(&submission); result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to save submission"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"message":       "answer submitted",
		"score":         score,
		"score_percent": fmt.Sprintf("%.1f%%", score*100),
		"submission_id": submission.ID,
	})
}

// callNLPService sends texts to Python and returns similarity score 0-1
func callNLPService(answerKey, studentAnswer string) (float64, error) {
	nlpURL := os.Getenv("NLP_SERVICE_URL")
	if nlpURL == "" {
		nlpURL = "http://nlp-service:5000"
	}

	payload := scorePayload{
		AnswerKey:     answerKey,
		StudentAnswer: studentAnswer,
	}
	body, _ := json.Marshal(payload)

	resp, err := http.Post(nlpURL+"/score", "application/json", bytes.NewBuffer(body))
	if err != nil {
		return 0, err
	}
	defer resp.Body.Close()

	var result scoreResult
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return 0, err
	}

	return result.Score, nil
}

// ── GET Submissions (Teacher: all for question, Student: own) ─────────

func GetSubmissions(c *gin.Context) {
	questionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid question id"})
		return
	}

	role, _ := c.Get("role")
	userID, _ := c.Get("user_id")

	var submissions []models.Submission

	query := config.DB.
		Preload("Student").
		Where("question_id = ?", questionID)

	// Students can only see their own submissions
	if role == "student" {
		query = query.Where("student_id = ?", userID)
	}

	query.Find(&submissions)

	c.JSON(http.StatusOK, gin.H{"submissions": submissions})
}

// ── GET Submissions (Student's own submission history) ─────────

func MySubmissions(c *gin.Context) {
	studentID, _ := c.Get("user_id")

	var submissions []models.Submission
	config.DB.
		Preload("Question").
		Where("student_id = ?", studentID).
		Order("submitted_at desc").
		Find(&submissions)

	c.JSON(http.StatusOK, gin.H{"submissions": submissions})
}
