export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface QuizState {
  currentQuestionIndex: number;
  userAnswers: { [key: number]: number }; // questionIndex -> selectedOptionIndex
  isSubmitted: boolean;
  score: number;
}

export interface QuizHistoryItem {
  id: string;
  timestamp: string;
  grammarText: string;
  quizQuestions: QuizQuestion[];
  score: number | null; // null if not completed
  difficulty?: "Beginner" | "Intermediate" | "Advanced";
  questionCount?: number;
}

export interface AndroidFile {
  name: string;
  path: string;
  language: "kotlin" | "xml" | "gradle" | "json";
  content: string;
}
