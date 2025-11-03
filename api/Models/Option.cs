using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;


namespace Que.Models
{
    // Represents a single answer option belonging to a quiz question.
    public class Option
    {
        [Key]
        public int OptionId { get; set; }
        public string Text { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }

        // Foreign key linking this option to its parent question
        [ForeignKey(nameof(Question))]
            public int QuestionId { get; set; }
            public virtual Question? Question { get; set; }
        
    }
}