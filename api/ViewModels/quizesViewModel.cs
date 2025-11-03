using Que.Models;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace Que.ViewModels
{
    public class QuizesViewModel
    {
        public QuizesViewModel()
        {
            Quiz = new Quiz();

                // Initialize the view model with one default question
                // so that the Create view always has at least one question ready.
                Questions = new List<QuestionsViewModel>
                {
                    new QuestionsViewModel() // Starter med 1 spørsmål
                };
        }

        // Represents a single quiz (used for Create/Update forms)
        public Quiz Quiz { get; set; } = new Quiz();

        // List of question view models belonging to this quiz
        public List<QuestionsViewModel> Questions { get; set; } = new List<QuestionsViewModel>();

        // Collection of all quizzes (used for Grid/Table views)
        public IEnumerable<Quiz> Quizes { get; set; } = new List<Quiz>();

        // Used to track which view is currently active (e.g., "Grid" or "Table")
         public string? CurrentViewName { get; set; }

        // Optional filter/search fields
        public string? SearchTerm { get; set; }
        public string? Category { get; set; }
        public string? Difficulty { get; set; }
        public string? QuestionCount { get; set; }

        // Alternate constructor for list views (Grid/Table)
        public QuizesViewModel(IEnumerable<Quiz> quizes, string? currentViewName)
        {
            Quizes = quizes;
            CurrentViewName = currentViewName;
        }

        // Dropdown options for difficulty selection
        public List<SelectListItem> DifficultyOptions => new List<SelectListItem>
        {
            new SelectListItem("Easy", "Easy"),
            new SelectListItem("Medium", "Medium"),
            new SelectListItem("Hard", "Hard")
        };

        // Dropdown options for category selection
        public List<SelectListItem> CategoryOptions => new List<SelectListItem>
        {
            new SelectListItem("Trivia", "Trivia"),
            new SelectListItem("History", "History"),
            new SelectListItem("Geography", "Geography"),
            new SelectListItem("Math", "Math"),
            new SelectListItem("Science", "Science"),
            new SelectListItem("Sports", "Sports")
        };
    }
}
