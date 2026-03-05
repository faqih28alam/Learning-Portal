import axios from "axios";

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Redirect to login on 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.clear();
            window.location.href = "/login";
        }
        return Promise.reject(err);
    }
);

// ── Types ──────────────────────────────────────────────────────────────

export type Role = "teacher" | "student";

export interface User {
    id: number;
    name: string;
    email: string;
    role: Role;
}

export interface Question {
    id: number;
    title: string;
    body: string;
    answer_key?: string; // only present for teacher
    created_by: number;
    created_at: string;
}

export interface Submission {
    id: number;
    question_id: number;
    student_id: number;
    answer_text: string;
    score: number;
    submitted_at: string;
    student?: User;
    question?: Question;
}

// ── Auth ───────────────────────────────────────────────────────────────

export const authAPI = {
    register: (data: { name: string; email: string; password: string; role: Role }) =>
        api.post("/auth/register", data),

    login: (data: { email: string; password: string }) =>
        api.post<{ token: string; user: User }>("/auth/login", data),

    me: () => api.get<User>("/me"),
};

// ── Questions ──────────────────────────────────────────────────────────

export const questionsAPI = {
    list: () => api.get<{ questions: Question[] }>("/questions"),

    get: (id: number) => api.get<Question>(`/questions/${id}`),

    create: (data: { title: string; body: string; answer_key: string }) =>
        api.post<{ question: Question }>("/questions", data),

    update: (id: number, data: Partial<{ title: string; body: string; answer_key: string }>) =>
        api.put(`/questions/${id}`, data),

    delete: (id: number) => api.delete(`/questions/${id}`),

    submit: (id: number, answer_text: string) =>
        api.post<{ score: number; score_percent: string; submission_id: number }>(
            `/questions/${id}/submit`,
            { answer_text }
        ),

    getSubmissions: (id: number) =>
        api.get<{ submissions: Submission[] }>(`/questions/${id}/submissions`),
};

// ── Student ────────────────────────────────────────────────────────────

export const studentAPI = {
    mySubmissions: () => api.get<{ submissions: Submission[] }>("/my-submissions"),
};

export default api;