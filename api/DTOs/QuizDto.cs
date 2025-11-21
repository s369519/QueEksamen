using System.ComponentModel.DataAnnotations;

namespace Que.DTOs
{
    public class QuizDto
    {
        public int QuizId { get; set; }

        [Required(ErrorMessage = "Quiz name is required")]
        [RegularExpression(@"[0-9a-zA-ZæøåÆØÅ. \-]{2,40}", ErrorMessage = "The name must be numbers or letters between 2 and 40 characters")]
        [Display(Name = "Quiz name")]
        public string Name { get; set; } = string.Empty;
        
        [StringLength(500, ErrorMessage = "Description cannot exceed 500 characters")]
        public string? Description { get; set; }
        
        [StringLength(50, ErrorMessage = "Category cannot exceed 50 characters")]
        public string? Category { get; set; }
        
        [RegularExpression("^(Easy|Medium|Hard)$", ErrorMessage = "Difficulty must be Easy, Medium, or Hard")]
        public string? Difficulty { get; set; }

        [Required(ErrorMessage = "Time limit is required")]
        [Range(1, 100, ErrorMessage = "The time limit must be between 1 and 100 minutes")]
        public int TimeLimit { get; set; }
        
        public bool IsPublic { get; set; }
        public string? OwnerId { get; set; }

        [Required(ErrorMessage = "Questions are required")]
        [MinLength(1, ErrorMessage = "A quiz must have at least one question")]
        public List<QuestionDto> Questions { get; set; } = new List<QuestionDto>();
    }

    public class QuestionDto
    {
        public int QuestionId { get; set; }
        
        [Required(ErrorMessage = "Question text is required")]
        [StringLength(500, MinimumLength = 1, ErrorMessage = "Question text must be between 1 and 500 characters")]
        public string Text { get; set; } = string.Empty;
        
        public bool AllowMultiple { get; set; }
        
        [Required(ErrorMessage = "Options are required")]
        [MinLength(2, ErrorMessage = "A question must have at least 2 options")]
        public List<OptionDto> Options { get; set; } = new List<OptionDto>();
    }

    public class OptionDto
    {
        public int OptionId { get; set; }
        
        [Required(ErrorMessage = "Option text is required")]
        [StringLength(200, MinimumLength = 1, ErrorMessage = "Option text must be between 1 and 200 characters")]
        public string Text { get; set; } = string.Empty;
        
        public bool IsCorrect { get; set; }
    }

}