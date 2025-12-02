using Microsoft.EntityFrameworkCore;
using Que.Models;
using Que.DAL;
using Microsoft.AspNetCore.Mvc;

namespace Que.DAL;

// Repository implementation for quiz data access operations
// Handles CRUD operations and complex queries for quizzes, questions, and quiz attempts
public class QuizRepository : IQuizRepository
{
    private readonly QuizDbContext _db;
    private readonly ILogger<QuizRepository> _logger;

    // Constructor that injects database context and logger
    public QuizRepository(QuizDbContext context, ILogger<QuizRepository> logger)
    {
        _db = context;
        _logger = logger;
    }

    // QUIZ OPERATIONS
    // Gets all quizzes without including related entities
    public async Task<IEnumerable<Quiz>> GetAllQuizes()
    {
        return await _db.Quizes.ToListAsync();
    }
    
    // Gets a single quiz by ID without including related entities
    public async Task<Quiz?> GetQuizById(int quizId)
    {
        return await _db.Quizes.FindAsync(quizId);
    }

    // Creates a new quiz in the database
    // Validates that quiz name is unique for the owner
    public async Task<Quiz?> CreateQuiz(Quiz quiz)
    {
        try {
            // Check for duplicate quiz name by same owner
            var existingQuiz = await _db.Quizes
                .FirstOrDefaultAsync(q => q.Name == quiz.Name && q.OwnerId == quiz.OwnerId);
            
            if (existingQuiz != null)
            {
                _logger.LogWarning("Attempted to create duplicate quiz '{QuizName}' for owner {OwnerId}", quiz.Name, quiz.OwnerId);
                throw new InvalidOperationException($"A quiz with the name '{quiz.Name}' already exists for this user.");
            }

            // Add quiz and save to database
            _db.Quizes.Add(quiz);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Quiz '{QuizName}' created successfully with ID {QuizId}", quiz.Name, quiz.QuizId);
            return quiz;
        } catch (Exception ex) {
            _logger.LogError(ex, "Unexpected error while creating quiz '{QuizName}'", quiz.Name);
            throw;
        }
    }

    // Deletes a quiz from the database
    public async Task<bool> DeleteQuiz(int quizId)
    {
        var quiz = await _db.Quizes.FindAsync(quizId);
        if (quiz == null)
        {
            _logger.LogWarning("Attempted to delete non-existing quiz with ID {QuizId}", quizId);
            return false;
        }
        _db.Quizes.Remove(quiz);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Deleted quiz with ID {QuizId}", quizId);
        return true;
    }

    // Updates an existing quiz (basic properties only)
    public async Task<bool> UpdateQuiz(Quiz quiz)
    {
        try {
            _db.Quizes.Update(quiz);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Updated quiz '{QuizName}' (ID: {QuizId})", quiz.Name, quiz.QuizId);
            return true;
        } catch (Exception ex) {
            _logger.LogError(ex, "Error updating quiz '{QuizName}' (ID: {QuizId})", quiz.Name, quiz.QuizId);
            return false;
        }
    }

    // Updates a quiz including all related questions and options
    // Used for full quiz updates from the UI
    public async Task<bool> UpdateQuizFullAsync(Quiz quiz)
    {
        try
        {
            _db.Quizes.Update(quiz);
            await _db.SaveChangesAsync();
            return true;
        }
        catch
        {
            return false;
        }
    }

    // Gets all quizzes with full details (questions and options included)
    public async Task<List<Quiz>> GetAll()
    {
        return await _db.Quizes
            .Include(q => q.Questions)
            .ThenInclude(q => q.Options)
            .ToListAsync();
    }

    // Gets a single quiz with all related questions and options
    public async Task<Quiz?> GetQuizWithDetailsAsync(int id)
    {
        return await _db.Quizes
            .Include(q => q.Questions)
                .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(q => q.QuizId == id);
    }

    // Gets all quizzes created by a specific user
    // Includes questions and options, ordered by newest first
    public async Task<IEnumerable<Quiz>> GetQuizzesByUserId(string userId)
    {
        return await _db.Quizes
            .Where(q => q.OwnerId == userId)
            .Include(q => q.Questions)
            .ThenInclude(q => q.Options)
            .OrderByDescending(q => q.QuizId)
            .ToListAsync();
    }

    // Gets all quizzes that a user has attempted (based on QuizAttempts records)
    public async Task<IEnumerable<Quiz>> GetAttemptedQuizzesByUserId(string userId)
    {
        // Get all unique quiz IDs the user has attempted
        var quizIds = await _db.QuizAttempts
            .Where(a => a.UserId == userId)
            .Select(a => a.QuizId)
            .Distinct()
            .ToListAsync();

        // If no attempts, return empty list
        if (quizIds.Count == 0) return new List<Quiz>();

        // Get all quizzes based on the quiz IDs
        return await _db.Quizes
            .Where(q => quizIds.Contains(q.QuizId))
            .Include(q => q.Questions)
                .ThenInclude(q => q.Options)
            .ToListAsync();
    }

    // QUESTION OPERATIONS
    // Gets a single question with its options
    // Used for validating answers during quiz taking
    public async Task<Question?> GetQuestionByIdAsync(int questionId)
    {
        return await _db.Questions
            .Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.QuestionId == questionId);
    }

    // Gets all questions for a specific quiz with their options
    public async Task<List<Question>> GetQuestionsByQuizId(int quizId)
    {
        var quiz = await _db.Quizes
            .Include(q => q.Questions)
                .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(q => q.QuizId == quizId);

        return quiz?.Questions ?? new List<Question>();
    }
}