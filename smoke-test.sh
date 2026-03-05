#!/bin/bash

BASE="http://localhost:8080/api/v1"
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

pass() { echo -e "${GREEN}✅ PASS${NC}: $1"; }
fail() { echo -e "${RED}❌ FAIL${NC}: $1"; }

echo ""
echo "=== EssayScore Smoke Test ==="
echo ""

# ── 1. Health checks ──────────────────────────────────────────────────
STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health)
[ "$STATUS" = "200" ] && pass "Go backend health" || fail "Go backend health ($STATUS)"

STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/health)
[ "$STATUS" = "200" ] && pass "Python NLP health" || fail "Python NLP health ($STATUS)"

# ── 2. Register teacher ───────────────────────────────────────────────
echo ""
echo "--- Auth ---"
RES=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Teacher","email":"teacher@test.com","password":"pass123","role":"teacher"}')
echo "$RES" | grep -q "user registered" && pass "Teacher register" || pass "Teacher already exists (ok)"

# ── 3. Register student ───────────────────────────────────────────────
RES=$(curl -s -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Student","email":"student@test.com","password":"pass123","role":"student"}')
echo "$RES" | grep -q "user registered" && pass "Student register" || pass "Student already exists (ok)"

# ── 4. Login teacher ──────────────────────────────────────────────────
RES=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"teacher@test.com","password":"pass123"}')
TEACHER_TOKEN=$(echo "$RES" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[ -n "$TEACHER_TOKEN" ] && pass "Teacher login → got JWT" || fail "Teacher login"

# ── 5. Login student ──────────────────────────────────────────────────
RES=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"student@test.com","password":"pass123"}')
STUDENT_TOKEN=$(echo "$RES" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[ -n "$STUDENT_TOKEN" ] && pass "Student login → got JWT" || fail "Student login"

# ── 6. GET /me ────────────────────────────────────────────────────────
RES=$(curl -s "$BASE/me" -H "Authorization: Bearer $TEACHER_TOKEN")
echo "$RES" | grep -q "teacher" && pass "GET /me returns correct role" || fail "GET /me"

# ── 7. Create question (teacher) ──────────────────────────────────────
echo ""
echo "--- Questions ---"
RES=$(curl -s -X POST "$BASE/questions" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title":"Photosynthesis Test",
    "body":"Explain the process of photosynthesis in plants.",
    "answer_key":"Photosynthesis is the process by which green plants use sunlight, water, and carbon dioxide to produce glucose and oxygen through chemical reactions in chloroplasts."
  }')
echo "$RES" | grep -q "question created" && pass "Create question (teacher)" || fail "Create question: $RES"
QUESTION_ID=$(echo "$RES" | grep -o '"id":[0-9]*' | head -1 | cut -d: -f2)

# ── 8. Student cannot create question ────────────────────────────────
RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/questions" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hack","body":"Test body here","answer_key":"Answer key here for testing purposes"}')
[ "$RES" = "403" ] && pass "Student blocked from creating question (403)" || fail "Student role guard ($RES)"

# ── 9. List questions ─────────────────────────────────────────────────
RES=$(curl -s "$BASE/questions" -H "Authorization: Bearer $STUDENT_TOKEN")
echo "$RES" | grep -q "questions" && pass "List questions (student)" || fail "List questions"

# ── 10. Answer key hidden from student ───────────────────────────────
echo "$RES" | grep -q "answer_key" && fail "answer_key leaked to student!" || pass "answer_key hidden from student"

# ── 11. Submit answer (student) ───────────────────────────────────────
echo ""
echo "--- Scoring ---"
RES=$(curl -s -X POST "$BASE/questions/$QUESTION_ID/submit" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answer_text":"Plants use sunlight and carbon dioxide and water to make food. This process happens in leaves and is called photosynthesis, producing glucose for energy."}')
echo "$RES" | grep -q "score" && pass "Submit answer → score returned" || fail "Submit answer: $RES"
SCORE=$(echo "$RES" | grep -o '"score":[0-9.]*' | cut -d: -f2)
echo "       Score: $SCORE ($(echo "$RES" | grep -o '"score_percent":"[^"]*"' | cut -d'"' -f4))"

# ── 12. Teacher blocks student role guard ─────────────────────────────
RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/questions/$QUESTION_ID/submit" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answer_text":"Teachers should not be able to submit answers here."}')
[ "$RES" = "403" ] && pass "Teacher blocked from submitting answer (403)" || fail "Teacher role guard ($RES)"

# ── 13. No token blocked ─────────────────────────────────────────────
RES=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/questions")
[ "$RES" = "401" ] && pass "Unauthenticated request blocked (401)" || fail "Auth guard ($RES)"

# ── 14. View submissions (teacher) ────────────────────────────────────
echo ""
echo "--- Teacher Dashboard ---"
RES=$(curl -s "$BASE/questions/$QUESTION_ID/submissions" \
  -H "Authorization: Bearer $TEACHER_TOKEN")
echo "$RES" | grep -q "submissions" && pass "Teacher views submissions" || fail "View submissions: $RES"

# ── 15. Student views own submissions ────────────────────────────────
RES=$(curl -s "$BASE/my-submissions" \
  -H "Authorization: Bearer $STUDENT_TOKEN")
echo "$RES" | grep -q "submissions" && pass "Student views own history" || fail "My submissions: $RES"

# ── 16. Validation: empty fields ─────────────────────────────────────
echo ""
echo "--- Validation ---"
RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"name":"","email":"bad","password":"x","role":"teacher"}')
[ "$RES" = "400" ] && pass "Invalid register rejected (400)" || fail "Validation guard ($RES)"

RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/questions" \
  -H "Authorization: Bearer $TEACHER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Hi","body":"short","answer_key":"too short"}')
[ "$RES" = "400" ] && pass "Short question fields rejected (400)" || fail "Question validation ($RES)"

RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE/questions/$QUESTION_ID/submit" \
  -H "Authorization: Bearer $STUDENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"answer_text":"hi"}')
[ "$RES" = "400" ] && pass "Short answer rejected (400)" || fail "Answer validation ($RES)"

# ── 17. NLP Service direct test ───────────────────────────────────────
echo ""
echo "--- NLP Service ---"
RES=$(curl -s -X POST "http://localhost:5000/score" \
  -H "Content-Type: application/json" \
  -d '{
    "answer_key": "Photosynthesis converts sunlight into chemical energy stored as glucose in plant cells.",
    "student_answer": "Plants turn sunlight into food using a process called photosynthesis which makes glucose."
  }')
echo "$RES" | grep -q "score" && pass "NLP /score endpoint responds" || fail "NLP service: $RES"
NLP_SCORE=$(echo "$RES" | grep -o '"score":[0-9.]*' | cut -d: -f2)
LABEL=$(echo "$RES" | grep -o '"label":"[^"]*"' | cut -d'"' -f4)
echo "       Score: $NLP_SCORE | Label: $LABEL"

# ── Summary ───────────────────────────────────────────────────────────
echo ""
echo "=== Smoke Test Complete ==="
echo ""