using Xunit;
using Moq;
using Microsoft.Extensions.Logging;
using Que.DAL;
using Que.Models;
using Microsoft.EntityFrameworkCore;

namespace api.Tests.DAL;

public class QuizRepositoryTests
{
    // Helper method to create an InMemory QuizDbContext
    private QuizDbContext CreateInMemoryContext()
    {
        var options = new DbContextOptionsBuilder<QuizDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
        
        return new QuizDbContext(options);
    }

    // Test 1: GetAllQuizes - Positive Test
    [Fact]
    public async Task GetAllQuizes_ReturnsAllQuizzes_WhenQuizzesExist()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mockLogger = new Mock<ILogger<QuizRepository>>();
        
        var quizzes = new List<Quiz>
        {
            new Quiz { QuizId = 1, Name = "Test Quiz 1", Category = "History", Difficulty = "Easy", TimeLimit = 10, IsPublic = true, OwnerId = "user1" },
            new Quiz { QuizId = 2, Name = "Test Quiz 2", Category = "Science", Difficulty = "Hard", TimeLimit = 20, IsPublic = false, OwnerId = "user2" }
        };

        await context.Quizes.AddRangeAsync(quizzes);
        await context.SaveChangesAsync();
        
        var repository = new QuizRepository(context, mockLogger.Object);

        // Act
        var result = await repository.GetAllQuizes();

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
        Assert.Equal("Test Quiz 1", result.First().Name);
    }

    // Test 2: GetAllQuizes - Returns Empty List When No Quizzes
    [Fact]
    public async Task GetAllQuizes_ReturnsEmptyList_WhenNoQuizzesExist()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mockLogger = new Mock<ILogger<QuizRepository>>();
        
        var repository = new QuizRepository(context, mockLogger.Object);

        // Act
        var result = await repository.GetAllQuizes();

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }

    // Test 3: GetQuizById - Positive Test
    [Fact]
    public async Task GetQuizById_ReturnsQuiz_WhenQuizExists()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mockLogger = new Mock<ILogger<QuizRepository>>();
        
        var quiz = new Quiz 
        { 
            QuizId = 1, 
            Name = "Test Quiz", 
            Category = "History", 
            Difficulty = "Easy", 
            TimeLimit = 10, 
            IsPublic = true, 
            OwnerId = "user1",
            Questions = new List<Question>()
        };

        await context.Quizes.AddAsync(quiz);
        await context.SaveChangesAsync();
        
        var repository = new QuizRepository(context, mockLogger.Object);

        // Act
        var result = await repository.GetQuizById(1);

        // Assert
        Assert.NotNull(result);
        Assert.Equal(1, result.QuizId);
        Assert.Equal("Test Quiz", result.Name);
    }

    // Test 4: GetQuizById - Negative Test (Quiz Not Found)
    [Fact]
    public async Task GetQuizById_ReturnsNull_WhenQuizDoesNotExist()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mockLogger = new Mock<ILogger<QuizRepository>>();
        
        var repository = new QuizRepository(context, mockLogger.Object);

        // Act
        var result = await repository.GetQuizById(999);

        // Assert
        Assert.Null(result);
    }

    // Test 5: CreateQuiz - Positive Test
    [Fact]
    public async Task CreateQuiz_ReturnsCreatedQuiz_WhenSuccessful()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mockLogger = new Mock<ILogger<QuizRepository>>();
        
        var newQuiz = new Quiz 
        { 
            Name = "New Quiz", 
            Category = "Geography", 
            Difficulty = "Medium", 
            TimeLimit = 15, 
            IsPublic = true, 
            OwnerId = "user1",
            Questions = new List<Question>()
        };

        var repository = new QuizRepository(context, mockLogger.Object);

        // Act
        var result = await repository.CreateQuiz(newQuiz);

        // Assert
        Assert.NotNull(result);
        Assert.Equal("New Quiz", result.Name);
        
        // Verify the quiz was actually saved to the database
        var savedQuiz = await context.Quizes.FindAsync(result.QuizId);
        Assert.NotNull(savedQuiz);
        Assert.Equal("New Quiz", savedQuiz.Name);
    }

    // Test 6: CreateQuiz - Negative Test (Invalid Quiz)
    [Fact]
    public async Task CreateQuiz_ReturnsNull_WhenSaveFails()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mockLogger = new Mock<ILogger<QuizRepository>>();
        
        // Create an invalid quiz that will fail validation (null Name)
        var newQuiz = new Quiz 
        { 
            Name = null!, // Invalid - Name is required
            Category = "Geography", 
            Difficulty = "Medium", 
            TimeLimit = 15, 
            IsPublic = true, 
            OwnerId = "user1"
        };

        var repository = new QuizRepository(context, mockLogger.Object);

        // Act
        var result = await repository.CreateQuiz(newQuiz);

        // Assert
        // Even though validation may not catch this in InMemory, 
        // the test demonstrates the expected behavior
        Assert.Null(result);
    }

    // Test 7: DeleteQuiz - Positive Test
    [Fact]
    public async Task DeleteQuiz_ReturnsTrue_WhenQuizExistsAndIsDeleted()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mockLogger = new Mock<ILogger<QuizRepository>>();
        
        var quiz = new Quiz 
        { 
            QuizId = 1, 
            Name = "Quiz to Delete", 
            Category = "History", 
            Difficulty = "Easy", 
            TimeLimit = 10, 
            IsPublic = true, 
            OwnerId = "user1"
        };

        await context.Quizes.AddAsync(quiz);
        await context.SaveChangesAsync();
        
        var repository = new QuizRepository(context, mockLogger.Object);

        // Act
        var result = await repository.DeleteQuiz(1);

        // Assert
        Assert.True(result);
        
        // Verify the quiz was actually deleted
        var deletedQuiz = await context.Quizes.FindAsync(1);
        Assert.Null(deletedQuiz);
    }

    // Test 8: DeleteQuiz - Negative Test (Quiz Not Found)
    [Fact]
    public async Task DeleteQuiz_ReturnsFalse_WhenQuizDoesNotExist()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mockLogger = new Mock<ILogger<QuizRepository>>();
        
        var repository = new QuizRepository(context, mockLogger.Object);

        // Act
        var result = await repository.DeleteQuiz(999);

        // Assert
        Assert.False(result);
    }

    // Test 9: UpdateQuiz - Positive Test
    [Fact]
    public async Task UpdateQuiz_ReturnsTrue_WhenUpdateSucceeds()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mockLogger = new Mock<ILogger<QuizRepository>>();
        
        var quiz = new Quiz 
        { 
            QuizId = 1, 
            Name = "Original Quiz", 
            Category = "History", 
            Difficulty = "Easy", 
            TimeLimit = 10, 
            IsPublic = true, 
            OwnerId = "user1"
        };

        await context.Quizes.AddAsync(quiz);
        await context.SaveChangesAsync();
        
        var repository = new QuizRepository(context, mockLogger.Object);

        // Modify the quiz
        quiz.Name = "Updated Quiz";
        quiz.Category = "Science";
        quiz.Difficulty = "Hard";

        // Act
        var result = await repository.UpdateQuiz(quiz);

        // Assert
        Assert.True(result);
        
        // Verify the quiz was actually updated
        var updatedQuiz = await context.Quizes.FindAsync(1);
        Assert.NotNull(updatedQuiz);
        Assert.Equal("Updated Quiz", updatedQuiz.Name);
        Assert.Equal("Science", updatedQuiz.Category);
    }

    // Test 10: UpdateQuiz - Negative Test (Update Non-Existing Quiz)
    [Fact]
    public async Task UpdateQuiz_ReturnsFalse_WhenUpdateFails()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mockLogger = new Mock<ILogger<QuizRepository>>();
        
        var quiz = new Quiz 
        { 
            QuizId = 999, // Non-existing ID
            Name = "Quiz to Update", 
            Category = "History", 
            Difficulty = "Easy", 
            TimeLimit = 10, 
            IsPublic = true, 
            OwnerId = "user1"
        };

        var repository = new QuizRepository(context, mockLogger.Object);

        // Act
        var result = await repository.UpdateQuiz(quiz);

        // Assert
        Assert.False(result);
    }

    // Test 11: GetQuizzesByUserId - Positive Test
    [Fact]
    public async Task GetQuizzesByUserId_ReturnsUserQuizzes_WhenQuizzesExist()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mockLogger = new Mock<ILogger<QuizRepository>>();
        
        var quizzes = new List<Quiz>
        {
            new Quiz { QuizId = 1, Name = "User Quiz 1", Category = "History", Difficulty = "Easy", TimeLimit = 10, IsPublic = true, OwnerId = "user1", Questions = new List<Question>() },
            new Quiz { QuizId = 2, Name = "User Quiz 2", Category = "Science", Difficulty = "Hard", TimeLimit = 20, IsPublic = false, OwnerId = "user1", Questions = new List<Question>() },
            new Quiz { QuizId = 3, Name = "Other User Quiz", Category = "Math", Difficulty = "Medium", TimeLimit = 15, IsPublic = true, OwnerId = "user2", Questions = new List<Question>() }
        };

        await context.Quizes.AddRangeAsync(quizzes);
        await context.SaveChangesAsync();
        
        var repository = new QuizRepository(context, mockLogger.Object);

        // Act
        var result = await repository.GetQuizzesByUserId("user1");

        // Assert
        Assert.NotNull(result);
        Assert.Equal(2, result.Count());
        Assert.All(result, q => Assert.Equal("user1", q.OwnerId));
    }

    // Test 12: GetQuizzesByUserId - Returns Empty When No User Quizzes
    [Fact]
    public async Task GetQuizzesByUserId_ReturnsEmpty_WhenNoUserQuizzesExist()
    {
        // Arrange
        var context = CreateInMemoryContext();
        var mockLogger = new Mock<ILogger<QuizRepository>>();
        
        var quizzes = new List<Quiz>
        {
            new Quiz { QuizId = 1, Name = "Other Quiz", Category = "History", Difficulty = "Easy", TimeLimit = 10, IsPublic = true, OwnerId = "user2" }
        };

        await context.Quizes.AddRangeAsync(quizzes);
        await context.SaveChangesAsync();
        
        var repository = new QuizRepository(context, mockLogger.Object);

        // Act
        var result = await repository.GetQuizzesByUserId("user1");

        // Assert
        Assert.NotNull(result);
        Assert.Empty(result);
    }
}
