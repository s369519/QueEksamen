using Que.Models;

namespace Que.DAL;

public interface IQuizRepository
{
    Task<Quiz?> GetQuizById(int quizId);
    Task<IEnumerable<Quiz>> GetAllQuizzesAsync();
    Task AddQuizAsync(Quiz quiz);
    Task<Quiz?> CreateQuiz(Quiz quiz);
    Task<bool> UpdateQuiz(Quiz quiz);
    Task<bool> DeleteQuiz(int id);
    Task<List<Question>> GetQuestionsByQuizId(int quizId);
    Task<List<Quiz>> GetAll();
    Task<Quiz?> GetQuizWithDetailsAsync(int id);
    Task<bool> UpdateQuizFullAsync(Quiz quiz);
    Task<IEnumerable<Quiz>> GetAllQuizes();

    Task<Question?> GetQuestionByIdAsync(int questionId);
    Task UpdateQuestionAsync(Question question);
    Task<IEnumerable<Question>> GetQuestionsByQuizIdAsync(int quizId);

    Task<Option?> GetOptionByIdAsync(int optionId);
    Task UpdateOptionAsync(Option option);
    Task<IEnumerable<Option>> GetOptionsByQuizId(int quizId);

    
    
    

    
   
    
}
