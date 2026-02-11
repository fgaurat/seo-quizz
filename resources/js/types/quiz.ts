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
