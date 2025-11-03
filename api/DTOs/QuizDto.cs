using System.ComponentModel.DataAnnotations;

namespace Que.DTOs
{
    public class QuizDto
    {
        public int QuizId { get; set; }

        [Required]
        [RegularExpression(@"[0-9a-zA-ZæøåÆØÅ. \-]{2,40}", ErrorMessage = "The name must be numbers or letters between 2 and 40 characters")]
        [Display(Name = "Quiz name")]
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Category { get; set; }
        public string? Difficulty { get; set; }

        [Required]
        [Range(1, 100, ErrorMessage = "The time limit must be between 1 and 100 minutes")]
        public int TimeLimit { get; set; }
        public bool IsPublic { get; set; }

        public List<QuestionDto> Questions { get; set; } = new List<QuestionDto>();
    }
}