export type QuizQuestion = {
  id: string;
  title: string;
  categoryIds: string[];
  categoryNames: string[];
};

export type QuizCategory = { id: string; label: string; count: number };
export type QuizStats = { correct: number; attempts: number };
export type QuizReference = { id: string; title: string; slug: string };
