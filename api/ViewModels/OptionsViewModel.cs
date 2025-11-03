using System.ComponentModel.DataAnnotations;
using Que.Models;

namespace Que.ViewModels
{
    // ViewModel representing a single answer option within a quiz question.
    public class OptionsViewModel
    {
        public int OptionId { get; set; } 
        public string Text { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }
    }
}