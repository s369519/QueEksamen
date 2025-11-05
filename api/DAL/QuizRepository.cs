using Microsoft.EntityFrameworkCore;
using Que.Models;
using Que.DAL;
using Microsoft.AspNetCore.Mvc;

namespace Que.DAL;

public class QuizRepository : IQuizRepository
{
    private readonly QuizDbContext _db;

    private readonly ILogger<QuizRepository> _logger;

    public QuizRepository(QuizDbContext context, ILogger<QuizRepository> logger)
    {
        _db = context;
        _logger = logger;
    }

    //QUIZ
    public async Task<IEnumerable<Quiz>> GetAllQuizes()
    {
        return await _db.Quizes.ToListAsync();
    }
    
    public async Task<Quiz?> GetQuizById(int quizId)
    {
        return await _db.Quizes.FindAsync(quizId);
    }

    public async Task<Quiz?> CreateQuiz(Quiz quiz)
    {
        try {
            _db.Quizes.Add(quiz);
            await _db.SaveChangesAsync();
            _logger.LogInformation("Quiz '{QuizName}' created successfully with ID {QuizId}", quiz.Name, quiz.QuizId);
            return quiz;
        } catch (Exception ex) {
            _logger.LogError(ex, "Unexpected error while creating quiz '{QuizName}'", quiz.Name);
            return null;
        }
    }

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

    public async Task<Question?> GetQuestionByIdAsync(int questionId)
    {
        return await _db.Questions
            .Include(q => q.Options)
            .FirstOrDefaultAsync(q => q.QuestionId == questionId);
    }

    public async Task<List<Question>> GetQuestionsByQuizId(int quizId)
    {
        var quiz = await _db.Quizes
            .Include(q => q.Questions)
                .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(q => q.QuizId == quizId);

        return quiz?.Questions ?? new List<Question>();
    }
    public async Task<List<Quiz>> GetAll()
    {
        return await _db.Quizes
            .Include(q => q.Questions)
            .ThenInclude(q => q.Options)
            .ToListAsync();
    }

    public async Task<Quiz?> GetQuizWithDetailsAsync(int id)
    {
        return await _db.Quizes
            .Include(q => q.Questions)
                .ThenInclude(q => q.Options)
            .FirstOrDefaultAsync(q => q.QuizId == id);
    }

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
}