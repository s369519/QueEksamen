using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Que.Models;

namespace Que.Models
{
    public class Quiz
    {
        public int QuizId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? Category { get; set; } = "General";
        public string? Difficulty { get; set; } = "Medium";

        [Range(1, 100, ErrorMessage = "Time limit must be between 1 and 100 minutes!")]
        public int TimeLimit { get; set; } = 10;

        public virtual List<Question> Questions { get; set; } = new List<Question>();

        public bool IsPublic { get; set; } = false;

        [ForeignKey("AuthUser")]
        public string? OwnerId { get; set; }
        public virtual AuthUser? Owner { get; set; }
    }
}