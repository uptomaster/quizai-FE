export type UserRole = "instructor" | "student" | "admin";

export interface UserBase {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export interface Instructor extends UserBase {
  role: "instructor";
  institution?: string;
}

export interface Student extends UserBase {
  role: "student";
  studentCode?: string;
}

export interface Admin extends UserBase {
  role: "admin";
}

export type AppUser = Instructor | Student | Admin;

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: "bearer";
  expiresIn?: number;
}

export interface AuthResponse {
  user: AppUser;
  tokens: AuthTokens;
}

export interface AuthRequest {
  email: string;
  password: string;
  name?: string;
  role?: Extract<UserRole, "instructor" | "student">;
}

export interface Lecture {
  id: string;
  title: string;
  description?: string;
  sourceFileName: string;
  status: "uploaded" | "processing" | "ready" | "failed";
  instructorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuizChoice {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  lectureId: string;
  prompt: string;
  type: "multiple_choice" | "short_answer";
  choices?: QuizChoice[];
  answer?: string;
  explanation?: string;
  difficulty?: "easy" | "medium" | "hard";
  createdAt: string;
}

export interface GenerateQuizRequest {
  lectureId: string;
  questionCount: number;
}

export interface Session {
  id: string;
  lectureId: string;
  quizId: string;
  hostInstructorId: string;
  status: "waiting" | "active" | "ended";
  joinCode: string;
  startedAt?: string;
  endedAt?: string;
  createdAt: string;
}

export interface SessionAnswerRequest {
  questionId: string;
  answer: string;
}

export interface StudentSessionResult {
  studentId: string;
  studentName: string;
  score: number;
  correctCount: number;
  totalCount: number;
  submittedAt: string;
}

export interface SessionResult {
  sessionId: string;
  averageScore: number;
  participationRate: number;
  questionAccuracy: Record<string, number>;
  students: StudentSessionResult[];
}

export interface ApiErrorPayload {
  detail?: string;
  message?: string;
}
