using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema;

namespace Que.Models
{
    // Represents a single quiz question, including its options and parent quiz relationship.
    public class Question
    {
        [Key]
        public int QuestionId { get; set; }
        public string Text { get; set; } = string.Empty;

        // Foreign key linking this question to its parent quiz
        public int QuizId { get; set; }
        public virtual Quiz? Quiz { get; set; }

        // List of possible answer options for this question
        public virtual List<Option> Options { get; set; } = new List<Option>();

        public bool AllowMultiple { get; set; } = false;
       
        // Not mapped to the database – used temporarily for storing selected answers
        [NotMapped]
        public int? SelectedOption { get; set; }
    }
}
