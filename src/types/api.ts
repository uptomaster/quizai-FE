export type UserRole = "instructor" | "student" | "admin";

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export type AppUser = UserResponse;

export interface AuthTokens {
  accessToken: string;
  tokenType: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: AppUser;
}

export interface AuthRequest {
  email: string;
  password: string;
  name?: string; // register only
  role?: UserRole; // register only
}

export interface Lecture {
  id: string;
  title: string;
  instructor_id: string;
  text_length: number;
  created_at: string;
}

export interface QuizChoice {
  label: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizChoice[];
  answer: string;
  explanation?: string;
}

export interface GenerateQuizRequest {
  lecture_id: string;
  count?: number;
  quiz_type?: string;
}

export interface GenerateQuizResponse {
  quiz_set_id: string;
  quizzes: QuizQuestion[];
}

export interface UploadLectureRequest {
  file: File;
  title: string;
}

export interface Session {
  session_id: string;
  session_code: string;
  ws_url: string;
  status: string;
}

export interface StartSessionRequest {
  quiz_set_id: string;
  time_limit: number;
}

export interface SessionAnswerRequest {
  quiz_id: string;
  selected_option: string;
  response_time_ms: number;
}

export interface SessionAnswerResponse {
  is_correct: boolean;
  correct_option: string;
  explanation?: string | null;
}

export interface StudentSessionResult {
  user_id: string;
  grade: string;
  reason: string;
}

export interface SessionResult {
  session_id: string;
  grade_distribution: Record<string, number>;
  weak_concepts: string[];
  students: StudentSessionResult[];
}

export interface InstructorRecentSession {
  session_id: string;
  session_code: string;
  status: string;
  created_at: string;
  participant_count: number;
  correct_rate: number;
}

export interface InstructorDashboardResponse {
  total_sessions: number;
  avg_participation_rate: number;
  avg_correct_rate: number;
  quality_score: number;
  recent_sessions: InstructorRecentSession[];
}

export interface AdminPlatformStats {
  total_users: number;
  total_sessions: number;
  total_answers: number;
  avg_correct_rate: number;
}

export interface AdminInstructorSummary {
  instructor_id: string;
  name: string;
  email: string;
  total_sessions: number;
  quality_score: number;
}

export interface AdminAtRiskStudent {
  user_id: string;
  name: string;
  email: string;
  overall_correct_rate: number;
  total_answers: number;
}

export interface AdminDashboardResponse {
  platform: AdminPlatformStats;
  instructors: AdminInstructorSummary[];
  at_risk_students: AdminAtRiskStudent[];
}

export interface ApiErrorPayload {
  detail?: string;
  message?: string;
}
