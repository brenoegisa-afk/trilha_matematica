export type TileType = 'Normal' | 'Green' | 'Red' | 'Yellow' | 'Blue' | 'Purple' | 'Start' | 'Finish';

export interface SessionStats {
    totalQuestions: number;
    correctAnswers: number;
    skillsPracticed: Record<string, { attempts: number; successes: number }>;
}

export interface Tile {
    position: number;
    type: TileType;
}

export type Role = 'student' | 'teacher' | 'parent' | 'admin';

export interface School {
    id: string;
    name: string;
    createdAt?: string;
}

export interface Player {
    id: string;
    name: string;
    color: string;
    avatar: string;
    mascot?: string;
    currentPosition: number;
    inventoryProtectionCount: number;
    score: number;
    streak: number;
    class_id?: string;
    user_id?: string; // Link to Supabase Auth User ID
    role?: Role;
    school_id?: string;
    globalRank?: number;
    level: number;
    xp: number;
    achievements: Achievement[];
    hp: number;
    maxHp: number;
    mascots: Mascot[];
    skillsMastery: SkillMastery[];
    sessionStats: SessionStats;
}

export interface Skill {
    id: string;
    name: string;
    subjectId: string;
    description?: string;
}

export interface Subject {
    id: string;
    name: string;
    icon: string;
    description?: string;
}

export interface SkillMastery {
    skillId: string;
    level: 'bronze' | 'silver' | 'gold' | 'diamond';
    points: number; // 0-1000
    attempts: number;
    successes: number;
}

export interface Mascot {
    id: string;
    name: string;
    icon: string;
    equipped: boolean;
    xp: number;
    level: number;
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlockedAt?: Date;
}

export interface StructuredExplanation {
    title: string;
    steps: string[];
}

export interface Question {
    id?: string;
    question: string;
    answer: string;
    options: string[];
    skillId?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    explanation?: string | StructuredExplanation;
    isReinforcement?: boolean;
}

export type SkillStatus = 'mastered' | 'in_progress' | 'needs_help';

export interface DiagnosticInsight {
    skillId: string;
    skillName: string;
    status: SkillStatus;
    trend: 'improving' | 'declining' | 'stable';
    message: string;
}

export interface Enemy {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    icon: string;
    level: number;
}

export interface Class {
    id: string;
    name: string;
    grade: string;
    teacherId: string;
    schoolId?: string;
    studentIds: string[];
}

export interface TeacherProfile {
    id: string;
    name: string;
    classes: string[];
    schoolId?: string;
    role?: Role;
}

export interface ParentProfile {
    id: string;
    name: string;
    childrenIds: string[]; // references student IDs
    role?: Role;
}

export type GameStatus = 'setup' | 'playing' | 'card_event' | 'battle' | 'finished';

export interface GameState {
    players: Player[];
    currentPlayerIndex: number;
    tiles: Tile[];
    status: GameStatus;
    activeCardType: TileType | null;
    activeQuestion: Question | null;
    rolledValue: number | null;
    answerFeedback: 'correct' | 'wrong' | null;
    waitingFeedback: boolean;
    waitingVictory: { player: Player, mascot: Mascot } | null;
}
