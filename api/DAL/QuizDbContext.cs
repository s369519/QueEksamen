using Microsoft.EntityFrameworkCore;
using Que.Models;

namespace Que.DAL;

public class QuizDbContext : DbContext
{
    public QuizDbContext(DbContextOptions<QuizDbContext> options) : base(options)
    {
        // Database.EnsureCreated();  // Fjern denne linjen hvis du bruker migrasjoner
    }

    public DbSet<Quiz> Quizes { get; set; }
    public DbSet<Question> Questions { get; set; }
    public DbSet<Option> Options { get; set; } = null!;

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        optionsBuilder.UseLazyLoadingProxies();
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // ==========================
        // RELASJONER MED CASCADING DELETE
        // ==========================

        // Quiz -> Question
        modelBuilder.Entity<Question>()
            .HasOne(q => q.Quiz)
            .WithMany(qz => qz.Questions)
            .HasForeignKey(q => q.QuizId)
            .OnDelete(DeleteBehavior.Cascade);

        // Question -> Option
        modelBuilder.Entity<Option>()
            .HasOne(o => o.Question)
            .WithMany(q => q.Options)
            .HasForeignKey(o => o.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        // ==========================
        // SEEDING
        // ==========================

        // Quiz
        modelBuilder.Entity<Quiz>().HasData(
            new Quiz
            {
                QuizId = 1,
                Name = "General Knowledge Basics",
                Description = "Test your basic knowledge."
            }
        );

        // Question
        modelBuilder.Entity<Question>().HasData(
            new Question { QuestionId = 1, QuizId = 1, Text = "What is the capital of Norway?" },
            new Question { QuestionId = 2, QuizId = 1, Text = "What is the largest planet in our solar system?" }
        );

        // Option
        modelBuilder.Entity<Option>().HasData(
            // Alternativer for Question 1
            new Option { OptionId = 1, QuestionId = 1, Text = "Bergen", IsCorrect = false },
            new Option { OptionId = 2, QuestionId = 1, Text = "Oslo", IsCorrect = true },
            new Option { OptionId = 3, QuestionId = 1, Text = "Trondheim", IsCorrect = false },
            new Option { OptionId = 4, QuestionId = 1, Text = "Stavanger", IsCorrect = false },

            // Alternativer for Question 2
            new Option { OptionId = 5, QuestionId = 2, Text = "Saturn", IsCorrect = false },
            new Option { OptionId = 6, QuestionId = 2, Text = "Jupiter", IsCorrect = true },
            new Option { OptionId = 7, QuestionId = 2, Text = "Mars", IsCorrect = false },
            new Option { OptionId = 8, QuestionId = 2, Text = "Jorden", IsCorrect = false }
        );

        base.OnModelCreating(modelBuilder);
    }
}