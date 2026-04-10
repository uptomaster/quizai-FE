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
  lecture_id: string;
  title: string;
  file_url?: string;
  text_length?: number;
  quiz_count?: number;
  created_at: string;
  /** When provided by API, indicates the student is enrolled (can join sessions for this class). */
  is_enrolled?: boolean;
}

export interface LecturesListResponse {
  lectures: Lecture[];
  total: number;
}

export interface LectureEnrollResponse {
  lecture_id: string;
  status: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation?: string | null;
}

export interface GenerateQuizRequest {
  lecture_id: string;
  count?: number;
  type?: "multiple_choice" | "short_answer";
}

export interface GenerateQuizResponse {
  quiz_set_id: string;
  lecture_id: string;
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
  selected_option: number;
  response_time_ms: number;
}

export interface SessionAnswerResponse {
  is_correct: boolean;
  correct_option: number;
  explanation?: string | null;
}

export interface SessionQuizStat {
  quiz_id: string;
  correct_count: number;
  wrong_count: number;
  error_rate: number;
}

export interface SessionStudentAnswer {
  quiz_id: string;
  is_correct: boolean;
  selected_option: number;
}

export interface SessionStudentResult {
  student_id: string;
  nickname: string;
  score: number;
  grade: "excellent" | "needs_practice" | "needs_review";
  answers: SessionStudentAnswer[];
}

export interface SessionResult {
  session_id: string;
  total_students: number;
  avg_score: number;
  grade_distribution: {
    excellent: number;
    needs_practice: number;
    needs_review: number;
  };
  weak_concepts: string[];
  quiz_stats: SessionQuizStat[];
  students: SessionStudentResult[];
}

export interface InstructorQualityScore {
  quiz_frequency: number;
  student_performance: number;
  followup_action: number;
  total: number;
}

export interface InstructorRecentSession {
  session_id: string;
  lecture_title: string;
  student_count: number;
  avg_score: number;
  created_at: string;
}

export interface InstructorDashboardResponse {
  instructor_id: string;
  total_sessions: number;
  avg_participation_rate: number;
  avg_correct_rate: number;
  quality_score: InstructorQualityScore;
  recent_sessions: InstructorRecentSession[];
}

export interface AdminPlatformStats {
  active_sessions: number;
  today_sessions: number;
  avg_participation: number;
}

export interface AdminInstructorSummary {
  instructor_id: string;
  name: string;
  total_sessions: number;
  avg_participation_rate: number;
  quality_score: number;
}

export interface AdminAtRiskStudent {
  student_id: string;
  name: string;
  risk_level: "high" | "medium" | "low";
  risk_score: number;
  risk_factors: string[];
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
