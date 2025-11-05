using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Que.DAL;
using Que.Models;
using Que.DTOs;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.EntityFrameworkCore;

namespace Que.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class QuizAPIController : ControllerBase
{
    private readonly IQuizRepository _quizRepository;
    private readonly ILogger<QuizAPIController> _logger;
    private readonly UserManager<AuthUser> _userManager;
    private readonly QuizDbContext _quizDbContext;
    
    public QuizAPIController(
        IQuizRepository quizRepository, 
        ILogger<QuizAPIController> logger, 
        UserManager<AuthUser> userManager,
        QuizDbContext quizDbContext)
    {
        _quizRepository = quizRepository;
        _logger = logger;
        _userManager = userManager;
        _quizDbContext = quizDbContext;
    }

    [AllowAnonymous]
    [HttpGet("quizlist")]
    public async Task<IActionResult> GetAllQuizes()
    {
        // Hent brukerinfo fra token (om innlogget)
        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        bool isAuthenticated = User.Identity?.IsAuthenticated ?? false;

        _logger.LogInformation("[QuizAPIController] Fetching quiz list for user: {UserId}", userId ?? "Anonymous");

        // Hent alle quizer fra databasen
        var quizzes = await _quizRepository.GetAllQuizes();

        if (quizzes == null)
        {
            _logger.LogWarning("[QuizAPIController] No quizzes found in repository");
            return NotFound("No quizzes found");
        }

        // Filtrer synlighet
        var visibleQuizzes = quizzes
            .Where(q => q.IsPublic || (isAuthenticated && q.OwnerId == userId))
            .Select(q => new QuizDto
            {
                QuizId = q.QuizId,
                Name = q.Name,
                Description = q.Description,
                Category = q.Category,
                Difficulty = q.Difficulty,
                TimeLimit = q.TimeLimit,
                IsPublic = q.IsPublic,
                OwnerId = q.OwnerId
            })
            .ToList();

        _logger.LogInformation("[QuizAPIController] Returning {Count} visible quizzes for user: {UserId}", visibleQuizzes.Count, userId ?? "Anonymous");

        return Ok(visibleQuizzes);
    }

    [Authorize]
    [HttpPost("create")]
    public async Task<IActionResult> Create([FromBody] QuizDto quizDto)
    {
        if (quizDto == null)
            return BadRequest("Quiz cannot be null");

        // --- Logg alle claims for debugging ---
        _logger.LogInformation("Claims for current user:");
        foreach (var c in User.Claims)
        {
            _logger.LogInformation("{Type} = {Value}", c.Type, c.Value);
        }

        // --- Hent GUID-Id fra claim NameIdentifier ---
        var userId = User.Claims.FirstOrDefault(
            c => c.Type == ClaimTypes.NameIdentifier && Guid.TryParse(c.Value, out _)
        )?.Value;

        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogError("No valid NameIdentifier GUID claim found in token");
            return Unauthorized("User not authenticated");
        }

        // --- Hent bruker fra databasen ---
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            _logger.LogError("User not found in database for UserId={UserId}", userId);
            return Unauthorized("User not found in database");
        }

        // --- Sørg for at brukeren finnes i QuizDbContext (for FK-constraint) ---
        var userInQuizDb = await _quizDbContext.Set<AuthUser>().FindAsync(userId);
        if (userInQuizDb == null)
        {
            _logger.LogInformation("Syncing user {UserId} to QuizDbContext", userId);
            var userCopy = new AuthUser
            {
                Id = user.Id,
                UserName = user.UserName,
                NormalizedUserName = user.NormalizedUserName,
                Email = user.Email,
                NormalizedEmail = user.NormalizedEmail,
                EmailConfirmed = user.EmailConfirmed,
                PasswordHash = user.PasswordHash,
                SecurityStamp = user.SecurityStamp,
                ConcurrencyStamp = user.ConcurrencyStamp,
                PhoneNumber = user.PhoneNumber,
                PhoneNumberConfirmed = user.PhoneNumberConfirmed,
                TwoFactorEnabled = user.TwoFactorEnabled,
                LockoutEnd = user.LockoutEnd,
                LockoutEnabled = user.LockoutEnabled,
                AccessFailedCount = user.AccessFailedCount
            };
            _quizDbContext.Set<AuthUser>().Add(userCopy);
            await _quizDbContext.SaveChangesAsync();
        }

        try
        {
                // --- Lag quiz med riktig OwnerId ---
                var newQuiz = new Quiz
                {
                    Name = quizDto.Name ?? throw new ArgumentNullException(nameof(quizDto.Name)),
                    Description = quizDto.Description ?? "",
                    Category = quizDto.Category ?? "General",
                    Difficulty = quizDto.Difficulty ?? "Medium",
                    TimeLimit = quizDto.TimeLimit,
                    IsPublic = quizDto.IsPublic,
                    OwnerId = userId // Use userId directly
                };

                // Add questions if they exist
                if (quizDto.Questions != null)
                {
                    newQuiz.Questions = quizDto.Questions.Select(q => new Question
                    {
                        Text = q.Text ?? throw new ArgumentNullException(nameof(q.Text)),
                        AllowMultiple = q.AllowMultiple,
                        Options = q.Options?.Select(o => new Option
                        {
                            Text = o.Text ?? throw new ArgumentNullException(nameof(o.Text)),
                            IsCorrect = o.IsCorrect
                        }).ToList() ?? new List<Option>()
                    }).ToList();
                }

            var createdQuiz = await _quizRepository.CreateQuiz(newQuiz);

            if (createdQuiz == null)
            {
                _logger.LogError("Failed to save quiz {@Quiz}", newQuiz);
                return StatusCode(500, "Failed to create quiz");
            }

            return CreatedAtAction(nameof(GetQuiz), new { id = createdQuiz.QuizId }, createdQuiz);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Exception when creating quiz for UserId={UserId}", user.Id);
            return StatusCode(500, "Internal server error while creating quiz");
        }
    }

    [AllowAnonymous]
    [HttpGet("{id}")]
    public async Task<IActionResult> GetQuiz(int id)
    {
         var quiz = await _quizRepository.GetQuizById(id);
        if (quiz == null)
        {
            _logger.LogError("[QuizAPIController] Quiz not found for the QuizId {QuizId:0000}", id);
            return NotFound("Quiz not found for the QuizId");
        }

        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        bool isAuthenticated = User.Identity?.IsAuthenticated ?? false;

        if (!quiz.IsPublic && (!isAuthenticated || quiz.OwnerId != userId))
        {
            return Forbid("You are not authorized to access this private quiz.");
        }

        return Ok(quiz);
    }

    [Authorize]
    [HttpPut("update/{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] QuizDto quizDto)
    {
        if (quizDto == null)return BadRequest("Quiz data cannot be null");

        var existingQuiz = await _quizRepository.GetQuizById(id);
        if (existingQuiz == null) return NotFound("Quiz not found");

        // Check if the current user is the owner of the quiz
        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (existingQuiz.OwnerId != userId)
        {
            _logger.LogWarning("[QuizAPIController] User {UserId} attempted to update quiz {QuizId} owned by {OwnerId}", 
                userId, id, existingQuiz.OwnerId);
            return Forbid("You are not authorized to update this quiz.");
        }

        existingQuiz.Name = quizDto.Name;
        existingQuiz.Description = quizDto.Description;
        existingQuiz.Category = quizDto.Category;
        existingQuiz.Difficulty = quizDto.Difficulty;
        existingQuiz.TimeLimit = quizDto.TimeLimit;
        existingQuiz.IsPublic = quizDto.IsPublic;

        foreach (var qDto in quizDto.Questions)
        {
            var existingQuestion = existingQuiz.Questions.FirstOrDefault(q => q.QuestionId == qDto.QuestionId);
            if (existingQuestion != null)
            {
                existingQuestion.Text = qDto.Text;
                existingQuestion.AllowMultiple = qDto.AllowMultiple;

                foreach (var oDto in qDto.Options)
                {
                    var existingOption = existingQuestion.Options.FirstOrDefault(o => o.OptionId == oDto.OptionId);
                    if (existingOption != null)
                    {
                        existingOption.Text = oDto.Text;
                        existingOption.IsCorrect = oDto.IsCorrect;
                    }
                    else
                    {
                        existingQuestion.Options.Add(new Option
                        {
                            Text = oDto.Text,
                            IsCorrect = oDto.IsCorrect
                        });
                    }
                }
                existingQuestion.Options.RemoveAll(o => !qDto.Options.Any(dto => dto.OptionId == o.OptionId));
            }
            else
            {
                existingQuiz.Questions.Add(new Question
                {
                    Text = qDto.Text,
                    AllowMultiple = qDto.AllowMultiple,
                    Options = qDto.Options.Select(o => new Option
                    {
                        Text = o.Text,
                        IsCorrect = o.IsCorrect
                    }).ToList()
                });
            }
        }
        existingQuiz.Questions.RemoveAll(q => !quizDto.Questions.Any(dto => dto.QuestionId == q.QuestionId));
        var success = await _quizRepository.UpdateQuizFullAsync(existingQuiz);
        if (!success)
        {
            return StatusCode(500, "Failed to update quiz");
        }
        return Ok(existingQuiz);
    }

    [Authorize]
    [HttpDelete("delete/{id}")]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        var existingQuiz = await _quizRepository.GetQuizById(id);
        if (existingQuiz == null)
        {
            _logger.LogError("[QuizAPIController] Quiz not found for the QuizId {QuizId:0000}", id);
            return NotFound("Quiz not found");
        }

        // Check if the current user is the owner of the quiz
        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (existingQuiz.OwnerId != userId)
        {
            _logger.LogWarning("[QuizAPIController] User {UserId} attempted to delete quiz {QuizId} owned by {OwnerId}", 
                userId, id, existingQuiz.OwnerId);
            return Forbid("You are not authorized to delete this quiz.");
        }

        bool returnOk = await _quizRepository.DeleteQuiz(id);
        if (!returnOk) {
            _logger.LogError("[QuizAPIController] Quiz deletion failed for the QuizId {QuizId:0000}", id);
            return BadRequest("Quiz deletion failed");
        }
        return NoContent();
    }

    // =========================
    // TAKE QUIZ - Get quiz data for taking (without correct answers)
    // =========================
    [AllowAnonymous]
    [HttpGet("take/{id}")]
    public async Task<IActionResult> GetQuizForTaking(int id)
    {
        var quiz = await _quizRepository.GetQuizWithDetailsAsync(id);
        if (quiz == null)
        {
            _logger.LogError("[QuizAPIController] Quiz not found for taking, QuizId {QuizId:0000}", id);
            return NotFound("Quiz not found");
        }

        // Check access: public quizzes for all, private only for owner
        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        bool isAuthenticated = User.Identity?.IsAuthenticated ?? false;

        if (!quiz.IsPublic && (!isAuthenticated || quiz.OwnerId != userId))
        {
            _logger.LogWarning("[QuizAPIController] User {UserId} attempted to take private quiz {QuizId}", 
                userId ?? "Anonymous", id);
            return Forbid("You are not authorized to take this private quiz.");
        }

        // Map to DTO without revealing correct answers
        var quizTakeDto = new QuizTakeDto
        {
            QuizId = quiz.QuizId,
            QuizName = quiz.Name,
            TotalQuestions = quiz.Questions?.Count ?? 0,
            TimeLimit = quiz.TimeLimit,
            Questions = quiz.Questions?.Select(q => new QuestionTakeDto
            {
                QuestionId = q.QuestionId,
                Text = q.Text,
                AllowMultiple = q.AllowMultiple,
                Options = q.Options?.Select(o => new OptionTakeDto
                {
                    OptionId = o.OptionId,
                    Text = o.Text
                    // IsCorrect is intentionally NOT included
                }).ToList() ?? new List<OptionTakeDto>()
            }).ToList() ?? new List<QuestionTakeDto>()
        };

        _logger.LogInformation("[QuizAPIController] User {UserId} started taking quiz {QuizId}", 
            userId ?? "Anonymous", id);

        return Ok(quizTakeDto);
    }

    // =========================
    // SUBMIT ANSWER - Check if answer is correct (with partial scoring)
    // =========================
    [AllowAnonymous]
    [HttpPost("take/answer")]
    public async Task<IActionResult> SubmitAnswer([FromBody] SubmitAnswerDto submitDto)
    {
        if (submitDto == null || submitDto.SelectedOptionIds == null || !submitDto.SelectedOptionIds.Any())
        {
            return BadRequest("No answer selected");
        }

        // Get the question with options
        var question = await _quizRepository.GetQuestionByIdAsync(submitDto.QuestionId);
        if (question == null)
        {
            return NotFound("Question not found");
        }

        // Verify the question belongs to the quiz
        if (question.QuizId != submitDto.QuizId)
        {
            return BadRequest("Question does not belong to this quiz");
        }

        // Calculate score (0.0 to 1.0)
        double scoreValue = 0.0;
        bool isFullyCorrect = false;

        if (question.AllowMultiple)
        {
            // For multiple choice: calculate partial score
            var correctOptionIds = question.Options.Where(o => o.IsCorrect).Select(o => o.OptionId).ToHashSet();
            var incorrectOptionIds = question.Options.Where(o => !o.IsCorrect).Select(o => o.OptionId).ToHashSet();
            var selectedSet = submitDto.SelectedOptionIds.ToHashSet();

            // Count correct selections and incorrect selections
            int correctSelected = selectedSet.Intersect(correctOptionIds).Count();
            int incorrectSelected = selectedSet.Intersect(incorrectOptionIds).Count();
            int totalCorrect = correctOptionIds.Count;

            if (totalCorrect > 0)
            {
                // Score = (correct selections / total correct options) - penalty for wrong selections
                // Penalty: each wrong selection reduces score proportionally
                double correctRatio = (double)correctSelected / totalCorrect;
                double penalty = (double)incorrectSelected / totalCorrect;
                scoreValue = Math.Max(0.0, correctRatio - penalty);
                
                // Fully correct if all correct selected and no incorrect selected
                isFullyCorrect = correctSelected == totalCorrect && incorrectSelected == 0;
            }
        }
        else
        {
            // For single choice: either correct (1.0) or incorrect (0.0)
            var selectedOption = question.Options.FirstOrDefault(o => o.OptionId == submitDto.SelectedOptionIds.First());
            if (selectedOption != null && selectedOption.IsCorrect)
            {
                scoreValue = 1.0;
                isFullyCorrect = true;
            }
        }

        _logger.LogInformation("[QuizAPIController] Answer submitted for QuizId {QuizId}, QuestionId {QuestionId}, Score: {Score:F2}, FullyCorrect: {IsCorrect}", 
            submitDto.QuizId, submitDto.QuestionId, scoreValue, isFullyCorrect);

        return Ok(new { 
            isCorrect = isFullyCorrect,
            scoreValue = scoreValue,
            isPartiallyCorrect = scoreValue > 0.0 && !isFullyCorrect
        });
    }

    // =========================
    // GET QUIZ RESULTS - Get quiz with correct answers (for review after completion)
    // =========================
    [AllowAnonymous]
    [HttpGet("results/{id}")]
    public async Task<IActionResult> GetQuizResults(int id)
    {
        var quiz = await _quizRepository.GetQuizWithDetailsAsync(id);
        if (quiz == null)
        {
            _logger.LogError("[QuizAPIController] Quiz not found for results, QuizId {QuizId:0000}", id);
            return NotFound("Quiz not found");
        }

        // Check access: public quizzes for all, private only for owner
        string? userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        bool isAuthenticated = User.Identity?.IsAuthenticated ?? false;

        if (!quiz.IsPublic && (!isAuthenticated || quiz.OwnerId != userId))
        {
            _logger.LogWarning("[QuizAPIController] User {UserId} attempted to view results for private quiz {QuizId}", 
                userId ?? "Anonymous", id);
            return Forbid("You are not authorized to view results for this private quiz.");
        }

        // Map to DTO WITH correct answers (for review)
        var quizResultsDto = new QuizTakeDto
        {
            QuizId = quiz.QuizId,
            QuizName = quiz.Name,
            TotalQuestions = quiz.Questions?.Count ?? 0,
            TimeLimit = quiz.TimeLimit,
            Questions = quiz.Questions?.Select(q => new QuestionTakeDto
            {
                QuestionId = q.QuestionId,
                Text = q.Text,
                AllowMultiple = q.AllowMultiple,
                Options = q.Options?.Select(o => new OptionTakeDto
                {
                    OptionId = o.OptionId,
                    Text = o.Text,
                    IsCorrect = o.IsCorrect  // NOW included for review
                }).ToList() ?? new List<OptionTakeDto>()
            }).ToList() ?? new List<QuestionTakeDto>()
        };

        _logger.LogInformation("[QuizAPIController] User {UserId} viewed results for quiz {QuizId}", 
            userId ?? "Anonymous", id);

        return Ok(quizResultsDto);
    }
}
