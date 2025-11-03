using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.Extensions.Options;
using Que.Models;

namespace Que.ViewModels
{
    // ViewModel representing a single quiz question, including its options and selected answers.
    public class QuestionsViewModel
    {
        public int QuestionId { get; set; }
        public string Text { get; set; } = string.Empty;
        public bool AllowMultiple { get; set; }

        public List<OptionsViewModel> Options { get; set; } = new List<OptionsViewModel>();
        public List<int> SelectedOptions { get; set; }
        public QuestionsViewModel()
        {
            // Initializes each question with four empty answer options by default
            Options = new List<OptionsViewModel>
            {
                new OptionsViewModel(),
                new OptionsViewModel(),
                new OptionsViewModel(),
                new OptionsViewModel()
            };
            SelectedOptions = new List<int>();
        }
    }
}