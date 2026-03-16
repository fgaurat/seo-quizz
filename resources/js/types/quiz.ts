export type QuizStatus = 'draft' | 'published' | 'archived';
export type MediaType = 'image' | 'video';

export type QuestionMedia = {
    url: string;
    type: MediaType;
    caption?: string | null;
};

export type QuizSettings = {
    show_results?: boolean;
    randomize_questions?: boolean;
    randomize_answers?: boolean;
    time_limit?: number | null;
    [key: string]: unknown;
};

export type Answer = {
    id: number;
    question_id: number;
    body: string;
    is_correct: boolean;
    explanation: string | null;
    order: number;
    created_at: string;
    updated_at: string;
};

export type Question = {
    id: number;
    quiz_id: number;
    body: string;
    media: QuestionMedia[] | null;
    order: number;
    answers: Answer[];
    created_at: string;
    updated_at: string;
};

export type Project = {
    id: number;
    uuid: string;
    user_id: number;
    name: string;
    slug: string;
    url: string | null;
    description: string | null;
    custom_css?: string | null;
    quizzes_count?: number;
    quiz_attempts_count?: number;
    created_at: string;
    updated_at: string;
};

export type Quiz = {
    id: number;
    uuid: string;
    user_id: number;
    project_id?: number | null;
    project?: Project | null;
    title: string;
    slug: string;
    description: string | null;
    status: QuizStatus;
    settings: QuizSettings | null;
    custom_css?: string | null;
    questions: Question[];
    questions_count?: number;
    quiz_attempts_count?: number;
    created_at: string;
    updated_at: string;
};

export type QuizAttempt = {
    id: number;
    uuid: string;
    quiz_id: number;
    participant_name: string | null;
    participant_email: string | null;
    score: number;
    total_questions: number;
    started_at: string | null;
    completed_at: string | null;
    ip_address: string | null;
    user_agent: string | null;
    referrer_url: string | null;
    created_at: string;
    updated_at: string;
};

export type QuestionResult = {
    question_id: number;
    question_body: string;
    selected_answer_id: number | null;
    correct_answer_id: number;
    is_correct: boolean;
    explanation: string | null;
};

export type QuizSubmissionResult = {
    score: number;
    total_questions: number;
    percentage: number;
    results: QuestionResult[];
};

export type PaginatedData<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: {
        url: string | null;
        label: string;
        active: boolean;
    }[];
};

export type GameSessionStatus = 'waiting' | 'in_progress' | 'reviewing' | 'completed';

export type GamePlayer = {
    id: number;
    uuid: string;
    game_session_id: number;
    nickname: string;
    avatar: string | null;
    score: number;
    is_connected: boolean;
    created_at: string;
    updated_at: string;
};

export type GameResponse = {
    id: number;
    game_session_id: number;
    game_player_id: number;
    question_id: number;
    answer_id: number | null;
    is_correct: boolean;
    response_time_ms: number | null;
    points_earned: number;
    created_at: string;
    updated_at: string;
};

export type GameSession = {
    id: number;
    uuid: string;
    quiz_id: number;
    host_user_id: number;
    pin: string;
    status: GameSessionStatus;
    current_question_index: number;
    question_started_at: string | null;
    time_per_question: number;
    settings: Record<string, unknown> | null;
    started_at: string | null;
    completed_at: string | null;
    quiz?: Quiz;
    players?: GamePlayer[];
    responses?: GameResponse[];
    created_at: string;
    updated_at: string;
};

export type GameState = {
    status: GameSessionStatus;
    current_question_index: number;
    question: {
        id: number;
        body: string;
        media: QuestionMedia[] | null;
        answers: { id: number; body: string; order: number }[];
    } | null;
    time_remaining_ms: number;
    players_count: number;
    players_answered_count: number;
    leaderboard: Pick<GamePlayer, 'uuid' | 'nickname' | 'score'>[];
};
