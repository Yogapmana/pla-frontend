import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Quiz from '../pages/Quiz';
import { useQuiz } from '@/hooks/useQuiz';

// Mock hooks
vi.mock('@/hooks/useQuiz', () => ({
  useQuiz: vi.fn(),
  useSubmitQuiz: vi.fn(() => ({ mutateAsync: vi.fn() })),
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(() => ({ toast: vi.fn() })),
}));

// Mock components
vi.mock('@/components/quiz/QuizResult', () => ({
  QuizResult: () => <div data-testid="quiz-result">Result Page</div>,
}));

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ topicId: 'react-101' }),
  useNavigate: () => vi.fn(),
}));

describe('Quiz Page Smoke Tests', () => {
  const renderQuiz = () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <Quiz />
      </QueryClientProvider>
    );
  };

  it('Quiz page renders questions and options', () => {
    const mockQuizData = {
      questions: [
        {
          id: 1,
          question: 'What is React?',
          options: ['Library', 'Framework', 'Language', 'Database'],
          correct_answer: 'Library',
          explanation: 'React is a JS library.',
        },
      ],
    };

    vi.mocked(useQuiz).mockReturnValue({
      data: mockQuizData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderQuiz();

    // Check for question text
    expect(screen.getByText(/What is React\?/i)).toBeInTheDocument();

    // Check for option buttons
    expect(screen.getByText(/Library/i)).toBeInTheDocument();
    expect(screen.getByText(/Framework/i)).toBeInTheDocument();
  });

  it('Option buttons are clickable and reveal feedback', () => {
    const mockQuizData = {
      questions: [
        {
          id: 1,
          question: 'What is React?',
          options: ['Library', 'Framework'],
          correct_answer: 'Library',
          explanation: 'React is a JS library.',
        },
      ],
    };

    vi.mocked(useQuiz).mockReturnValue({
      data: mockQuizData,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderQuiz();

    const optionButton = screen.getByText(/Library/i);
    fireEvent.click(optionButton);

    // After clicking, feedback should be visible
    expect(screen.getByText(/React is a JS library\./i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Lihat Hasil/i })).toBeInTheDocument();
  });
});
