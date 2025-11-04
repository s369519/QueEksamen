using Que.Models;

namespace Que.DTOs
{
    public class QuizTakeDto
    {
        public int QuizId { get; set; }
        public string QuizName { get; set; } = string.Empty;
        public int TotalQuestions { get; set; }
        public int TimeLimit { get; set; }
        public List<QuestionTakeDto> Questions { get; set; } = new();
    }

    public class QuestionTakeDto
    {
        public int QuestionId { get; set; }
        public string Text { get; set; } = string.Empty;
        public bool AllowMultiple { get; set; }
        public List<OptionTakeDto> Options { get; set; } = new();
    }

    public class OptionTakeDto
    {
        public int OptionId { get; set; }
        public string Text { get; set; } = string.Empty;
        // IsCorrect is optional - only included when reviewing answers after completion
        public bool? IsCorrect { get; set; }
    }

    public class SubmitAnswerDto
    {
        public int QuizId { get; set; }
        public int QuestionId { get; set; }
        public List<int> SelectedOptionIds { get; set; } = new();
    }

    public class AnswerResultDto
    {
        public bool IsCorrect { get; set; }
        public int CurrentScore { get; set; }
        public int QuestionNumber { get; set; }
        public int TotalQuestions { get; set; }
        public bool IsLastQuestion { get; set; }
    }

    public class QuizResultDto
    {
        public int QuizId { get; set; }
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public double Percentage { get; set; }
    }
}
