using System.Collections.Generic;
using Que.Models;

namespace Que.ViewModels{
    // ViewModel used for the dashboard page, handling quiz lists, search, and filter options.
    public class DashboardViewModel
    {
        public List<Quiz> Quizes { get; set; } = new();
        public string? SearchTerm { get; set; }
        public string? SelectedCategory { get; set; }
        public string? SelectedDifficulty { get; set; }
        public string? SelectedQuestionCount { get; set; }

        public List<string> Categories { get; set; } = new() { "Trivia", "History", "Geography", "Math", "Science", "General" };
        public List<string> Difficulties { get; set; } = new() { "Easy", "Medium", "Hard" };

        public List<QuestionCountRange> QuestionCounts { get; set; } = new()
        {
            new QuestionCountRange { Label = "1-5 questions", Min = 1, Max = 5 },
            new QuestionCountRange { Label = "6-10 questions", Min = 6, Max = 10 },
            new QuestionCountRange { Label = "11-15 questions", Min = 11, Max = 15 },
            new QuestionCountRange { Label = "16-20 questions", Min = 16, Max = 20 },
            new QuestionCountRange { Label = "20+ questions", Min = 21, Max = int.MaxValue }
        };
    }

    // Helper class used to define question count filter ranges.
    public class QuestionCountRange
    {
        public string Label { get; set; } = string.Empty;
        public int Min { get; set; }
        public int Max { get; set; }
    }
}