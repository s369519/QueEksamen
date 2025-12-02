using Microsoft.EntityFrameworkCore;
using Que.Models;

namespace Que.DAL;

// Database initialization class for seeding test data during development
public static class DbInit
{
    // Seeds the database with sample quizzes, questions, and options
    // Only runs in development environment if database is empty
    public static void Seed(IApplicationBuilder app)
    {
        using var serviceScope = app.ApplicationServices.CreateScope();
        var context = serviceScope.ServiceProvider.GetRequiredService<QuizDbContext>();
        var loggerFactory = serviceScope.ServiceProvider.GetRequiredService<ILoggerFactory>();
        var logger = loggerFactory.CreateLogger("DbInit");

        try
        {
            // Ensure database is created (development only)
            context.Database.EnsureCreated();
            logger.LogInformation("Database ensured created for seeding");

            // Only seed if database is empty
            if (context.Quizes.Any())
            {
                logger.LogInformation("Database already contains data, skipping seed");
                return;
            }

            logger.LogInformation("Starting database seeding...");

            // Create sample quizzes with complete data
            var quizzes = new List<Quiz>
            {
                new Quiz
                {
                    Name = "General Knowledge Quiz",
                    Description = "Test your general knowledge with this quiz covering various topics",
                    Category = "General",
                    Difficulty = "Easy",
                    TimeLimit = 15,
                    IsPublic = true,
                    OwnerId = null, // System quiz, no specific owner
                    Questions = new List<Question>
                    {
                        new Question
                        {
                            Text = "What is the capital of Norway?",
                            AllowMultiple = false,
                            Options = new List<Option>
                            {
                                new Option { Text = "Oslo", IsCorrect = true },
                                new Option { Text = "Bergen", IsCorrect = false },
                                new Option { Text = "Trondheim", IsCorrect = false },
                                new Option { Text = "Stavanger", IsCorrect = false }
                            }
                        },
                        new Question
                        {
                            Text = "Which of these are Scandinavian countries? (Select all that apply)",
                            AllowMultiple = true,
                            Options = new List<Option>
                            {
                                new Option { Text = "Norway", IsCorrect = true },
                                new Option { Text = "Sweden", IsCorrect = true },
                                new Option { Text = "Denmark", IsCorrect = true },
                                new Option { Text = "Finland", IsCorrect = false },
                                new Option { Text = "Iceland", IsCorrect = false }
                            }
                        },
                        new Question
                        {
                            Text = "What year did World War II end?",
                            AllowMultiple = false,
                            Options = new List<Option>
                            {
                                new Option { Text = "1943", IsCorrect = false },
                                new Option { Text = "1944", IsCorrect = false },
                                new Option { Text = "1945", IsCorrect = true },
                                new Option { Text = "1946", IsCorrect = false }
                            }
                        }
                    }
                },
                new Quiz
                {
                    Name = "Programming Basics",
                    Description = "Test your knowledge of basic programming concepts",
                    Category = "Technology",
                    Difficulty = "Medium",
                    TimeLimit = 20,
                    IsPublic = true,
                    OwnerId = null,
                    Questions = new List<Question>
                    {
                        new Question
                        {
                            Text = "What does HTML stand for?",
                            AllowMultiple = false,
                            Options = new List<Option>
                            {
                                new Option { Text = "HyperText Markup Language", IsCorrect = true },
                                new Option { Text = "High Tech Modern Language", IsCorrect = false },
                                new Option { Text = "Home Tool Markup Language", IsCorrect = false },
                                new Option { Text = "Hyperlinks and Text Markup Language", IsCorrect = false }
                            }
                        },
                        new Question
                        {
                            Text = "Which of these are programming languages? (Select all that apply)",
                            AllowMultiple = true,
                            Options = new List<Option>
                            {
                                new Option { Text = "C#", IsCorrect = true },
                                new Option { Text = "Python", IsCorrect = true },
                                new Option { Text = "HTML", IsCorrect = false },
                                new Option { Text = "JavaScript", IsCorrect = true },
                                new Option { Text = "CSS", IsCorrect = false }
                            }
                        }
                    }
                },
                new Quiz
                {
                    Name = "Mathematics Challenge",
                    Description = "Challenge yourself with these math problems",
                    Category = "Mathematics",
                    Difficulty = "Hard",
                    TimeLimit = 30,
                    IsPublic = true,
                    OwnerId = null,
                    Questions = new List<Question>
                    {
                        new Question
                        {
                            Text = "What is the square root of 144?",
                            AllowMultiple = false,
                            Options = new List<Option>
                            {
                                new Option { Text = "10", IsCorrect = false },
                                new Option { Text = "11", IsCorrect = false },
                                new Option { Text = "12", IsCorrect = true },
                                new Option { Text = "13", IsCorrect = false }
                            }
                        },
                        new Question
                        {
                            Text = "What is 15% of 200?",
                            AllowMultiple = false,
                            Options = new List<Option>
                            {
                                new Option { Text = "25", IsCorrect = false },
                                new Option { Text = "30", IsCorrect = true },
                                new Option { Text = "35", IsCorrect = false },
                                new Option { Text = "40", IsCorrect = false }
                            }
                        }
                    }
                }
            };

            // Add quizzes to database
            context.Quizes.AddRange(quizzes);
            context.SaveChanges();

            logger.LogInformation("Successfully seeded {Count} quizzes with questions and options", quizzes.Count);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "An error occurred while seeding the database");
            throw;
        }
    }
}