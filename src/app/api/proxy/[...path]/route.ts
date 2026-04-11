import { NextRequest, NextResponse } from "next/server";

const API_TARGET_DEFAULT = "https://quizai-be.onrender.com";
const API_TARGET = process.env.API_SERVER_URL?.trim() || API_TARGET_DEFAULT;
/** 기본 false. 로컬에서만 `ENABLE_PROXY_MOCK_FALLBACK=true` 로 목 응답을 켤 수 있습니다. */
const ENABLE_MOCK_FALLBACK = process.env.ENABLE_PROXY_MOCK_FALLBACK === "true";

const wsOriginFromHttpBase = (httpBase: string): string => {
  try {
    const u = new URL(httpBase);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      throw new Error("invalid");
    }
    return `${u.protocol === "https:" ? "wss:" : "ws:"}//${u.host}`;
  } catch {
    return "wss://quizai-be.onrender.com";
  }
};

const WS_ORIGIN = wsOriginFromHttpBase(API_TARGET);

const FORWARDED_HEADERS = [
  "authorization",
  "content-type",
  "accept",
  "x-requested-with",
] as const;

const buildTargetUrl = (path: string[], searchParams: URLSearchParams): string => {
  const normalizedPath = path.join("/");
  const query = searchParams.toString();
  return `${API_TARGET}/${normalizedPath}${query ? `?${query}` : ""}`;
};

const b64urlJson = (obj: object) =>
  Buffer.from(JSON.stringify(obj), "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

/** Unsigned JWT-shaped token so the client can read `role` from the payload (same as many real APIs). */
const createTokenResponse = (email: string, role: "student" | "instructor" | "admin") => {
  const access_token = `${b64urlJson({ alg: "none", typ: "JWT" })}.${b64urlJson({ sub: `mock-${role}`, email, role })}.x`;
  return {
    access_token,
    token_type: "bearer",
    user: {
      id: `mock-${role}-${crypto.randomUUID()}`,
      email,
      name: `Mock ${role}`,
      role,
    },
  };
};

const buildMockResponse = async (request: NextRequest, path: string[]) => {
  const routePath = `/${path.join("/")}`;
  const method = request.method.toUpperCase();
  const headers = { "x-proxy-mock": "true" };

  if (method === "GET" && routePath === "/health") {
    return NextResponse.json({ status: "ok", mode: "mock-fallback" }, { status: 200, headers });
  }

  if (method === "POST" && routePath === "/auth/login") {
    const body = (await request.json().catch(() => ({}))) as { email?: string; role?: string };
    const email = body.email ?? "student@quizai.local";
    const fromBody =
      body.role === "admin" || body.role === "instructor" || body.role === "student" ? body.role : null;
    const fromEmail = email.includes("admin")
      ? "admin"
      : email.includes("instructor")
        ? "instructor"
        : "student";
    const role = fromBody ?? fromEmail;
    return NextResponse.json(createTokenResponse(email, role), { status: 200, headers });
  }

  if (method === "POST" && routePath === "/auth/register") {
    const body = (await request.json().catch(() => ({}))) as {
      email?: string;
      role?: "student" | "instructor" | "admin";
    };
    const email = body.email ?? "student@quizai.local";
    const role = body.role ?? "student";
    return NextResponse.json(createTokenResponse(email, role), { status: 201, headers });
  }

  if (method === "POST" && routePath === "/lectures/upload") {
    const formData = await request.formData().catch(() => null);
    const existing = formData?.get("lecture_id");
    const titleField = formData?.get("title");
    const lecture_id =
      typeof existing === "string" && existing.trim().length > 0
        ? existing.trim()
        : `lec_${crypto.randomUUID().slice(0, 8)}`;
    const title =
      typeof titleField === "string" && titleField.trim().length > 0 ? titleField.trim() : "Mock Lecture";
    return NextResponse.json(
      {
        lecture_id,
        title,
        file_url: "https://example.com/mock.pdf",
        text_length: 4820,
        created_at: new Date().toISOString(),
      },
      { status: 201, headers },
    );
  }

  if (method === "GET" && routePath === "/lectures") {
    return NextResponse.json(
      {
        lectures: [
          {
            lecture_id: "lec_mock_001",
            title: "머신러닝 기초",
            quiz_count: 5,
            created_at: new Date().toISOString(),
            is_enrolled: false,
          },
        ],
        total: 1,
      },
      { status: 200, headers },
    );
  }

  if (method === "POST" && /^\/lectures\/[^/]+\/enroll$/.test(routePath)) {
    const lectureId = routePath.split("/")[2] ?? "lec_mock_001";
    return NextResponse.json(
      { lecture_id: lectureId, status: "enrolled" },
      { status: 200, headers },
    );
  }

  if (method === "POST" && routePath === "/quizzes/generate") {
    return NextResponse.json(
      {
        quiz_set_id: `qs_${crypto.randomUUID().slice(0, 8)}`,
        lecture_id: "lec_mock_001",
        quizzes: [
          {
            id: "q_001",
            question: "지도학습과 비지도학습의 가장 큰 차이점은?",
            options: [
              "사용하는 알고리즘의 종류",
              "레이블(정답) 데이터의 유무",
              "처리할 수 있는 데이터의 크기",
              "모델의 연산 속도",
            ],
            answer: 1,
            explanation:
              "지도학습은 레이블 데이터를 사용하고 비지도학습은 레이블 없이 패턴을 찾습니다.",
          },
        ],
      },
      { status: 201, headers },
    );
  }

  if (method === "POST" && routePath === "/sessions/start") {
    const sessionId = `sess_${crypto.randomUUID().slice(0, 8)}`;
    return NextResponse.json(
      {
        session_id: sessionId,
        session_code: "A7K3B9",
        ws_url: `${WS_ORIGIN}/sessions/${sessionId}/join`,
        status: "waiting",
      },
      { status: 201, headers },
    );
  }

  if (method === "GET" && routePath === "/students/me/quiz-results") {
    return NextResponse.json(
      {
        results: [
          {
            session_id: "sess_preview_001",
            title: "머신러닝 기초 라이브 퀴즈",
            attended_at: new Date().toISOString(),
            my_score: 72,
            grade: "needs_practice" as const,
          },
        ],
      },
      { status: 200, headers },
    );
  }

  if (method === "POST" && routePath === "/sessions/join") {
    const sessionId = `sess_${crypto.randomUUID().slice(0, 8)}`;
    return NextResponse.json(
      {
        session_id: sessionId,
        session_code: "A7K3B9",
        ws_url: `${WS_ORIGIN}/sessions/${sessionId}/join`,
        status: "active",
      },
      { status: 200, headers },
    );
  }

  if (method === "GET" && routePath.startsWith("/sessions/") && routePath.endsWith("/result")) {
    const sessionId = routePath.split("/")[2] ?? "sess_mock_001";
    return NextResponse.json(
      {
        session_id: sessionId,
        total_students: 24,
        avg_score: 68.5,
        grade_distribution: {
          excellent: 10,
          needs_practice: 9,
          needs_review: 5,
        },
        weak_concepts: ["과적합", "정규화"],
        quiz_stats: [
          {
            quiz_id: "q_001",
            correct_count: 18,
            wrong_count: 6,
            error_rate: 25.0,
          },
        ],
        students: [
          {
            student_id: "mock-student-001",
            nickname: "이수진",
            score: 67,
            grade: "needs_practice",
            answers: [{ quiz_id: "q_001", is_correct: true, selected_option: 1 }],
          },
        ],
      },
      { status: 200, headers },
    );
  }

  if (method === "GET" && routePath === "/dashboard/instructor") {
    return NextResponse.json(
      {
        instructor_id: "mock-instructor-001",
        total_sessions: 12,
        avg_participation_rate: 88.0,
        avg_correct_rate: 71.5,
        quality_score: {
          quiz_frequency: 85,
          student_performance: 72,
          followup_action: 90,
          total: 82,
        },
        recent_sessions: [
          {
            session_id: "sess_001",
            lecture_title: "머신러닝 기초",
            student_count: 24,
            avg_score: 68.5,
            created_at: new Date().toISOString(),
          },
        ],
      },
      { status: 200, headers },
    );
  }

  if (method === "GET" && routePath === "/dashboard/admin") {
    return NextResponse.json(
      {
        platform: {
          active_sessions: 12,
          today_sessions: 47,
          avg_participation: 82.0,
        },
        instructors: [
          {
            instructor_id: "mock-instructor-001",
            name: "김민준",
            total_sessions: 12,
            avg_participation_rate: 88.0,
            quality_score: 92,
          },
        ],
        at_risk_students: [
          {
            student_id: "mock-student-001",
            name: "최지수",
            risk_level: "high",
            risk_score: 92,
            risk_factors: ["미참여 3회", "연속 오답", "접속 이탈"],
          },
        ],
      },
      { status: 200, headers },
    );
  }

  return NextResponse.json(
    { detail: `Mock fallback not implemented for ${method} ${routePath}` },
    { status: 501, headers },
  );
};

const proxyRequest = async (
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) => {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(path, request.nextUrl.searchParams);
  const headers = new Headers();

  FORWARDED_HEADERS.forEach((header) => {
    const value = request.headers.get(header);
    if (value) {
      headers.set(header, value);
    }
  });

  const shouldHaveBody =
    request.method !== "GET" && request.method !== "HEAD";
  const requestBody = shouldHaveBody ? await request.arrayBuffer() : undefined;

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: requestBody,
      cache: "no-store",
    });
  } catch {
    if (ENABLE_MOCK_FALLBACK) {
      return buildMockResponse(request, path);
    }
    return NextResponse.json({ detail: "Upstream request failed" }, { status: 502 });
  }

  if (ENABLE_MOCK_FALLBACK && response.status === 503) {
    return buildMockResponse(request, path);
  }

  const responseHeaders = new Headers(response.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("content-length");

  return new NextResponse(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });
};

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
