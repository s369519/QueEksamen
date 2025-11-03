using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Que.DAL;
using Que.Models;
using Que.ViewModels;
using Que.DTOs;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using System.IdentityModel.Tokens.Jwt;

namespace Que.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class QuizAPIController : ControllerBase
{
    private readonly IQuizRepository _quizRepository;
    private readonly ILogger<QuizAPIController> _logger;
    private readonly UserManager<AuthUser> _userManager;
    public QuizAPIController(IQuizRepository quizRepository, ILogger<QuizAPIController> logger, UserManager<AuthUser> userManager)
    {
        _quizRepository = quizRepository;
        _logger = logger;
        _userManager = userManager;
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
                IsPublic = q.IsPublic
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

    [Authorize]
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
        bool returnOk = await _quizRepository.DeleteQuiz(id);
        if (!returnOk) {
            _logger.LogError("[QuizAPIController] Quiz deletion failed for the QuizId {QuizId:0000}", id);
            return BadRequest("Quiz deletion failed");
        }
        return NoContent();
    }
}

public class QuizController : Controller
{
    private readonly IQuizRepository _quizRepository;
    private readonly ILogger<QuizController> _logger;

    public QuizController(IQuizRepository quizRepository, ILogger<QuizController> logger)
    {
        _quizRepository = quizRepository;
        _logger = logger;
    }

    // =========================
    // GRID VIEW – shows quizzes as cards
    // =========================

    public async Task<IActionResult> Grid()
    {
        var quizes = (await _quizRepository.GetAll()).ToList();
        if (quizes == null)
        {
            _logger.LogError("[QuizController] Quiz list not found while executing _quizRepository.GetAll().ToList()");
            return NotFound("Quiz list not found");
        }
        var viewModel = new QuizesViewModel(quizes, "Grid");
        return View(viewModel);
    }

    // =========================
    // TABLE VIEW – shows quizzes in table format
    // =========================

    public async Task<IActionResult> Table()
    {
        var quizes = (await _quizRepository.GetAll()).ToList();
        if (quizes == null)
        {
            _logger.LogError("[QuizController] Quiz list not found while executing _quizRepository.GetAll().ToList()");
            return NotFound("Quiz list not found");
        }
        var viewModel = new QuizesViewModel(quizes, "Table");
        return View(viewModel);
    }

    // Additional view – same pattern
    public async Task<IActionResult> SeeQuizes()
    {
        var quizes = (await _quizRepository.GetAll()).ToList();
        if (quizes == null)
        {
            _logger.LogError("[QuizController] Quiz list not found while executing _quizRepository.GetAll().ToList()");
            return NotFound("Quiz list not found");
        }
        var viewModel = new QuizesViewModel(quizes, "SeeQuizes");
        return View(viewModel);
    }

    // =========================
    // CREATE (GET) – returns empty form for new quiz
    // =========================

    [HttpGet]
    public IActionResult Create()
    {
        var model = new QuizesViewModel();
        return View(model);
    }

    // =========================
    // CREATE (POST) – builds a new Quiz object from the form data and saves it
    // =========================

    [HttpPost]
    public async Task<IActionResult> Create(QuizesViewModel model)
    {
        if (!ModelState.IsValid) return View(model);

        var quiz = new Quiz
        {
            Name = model.Quiz.Name,
            Description = model.Quiz.Description,
            Questions = model.Questions.Select(q => new Question
            {
                Text = q.Text,
                AllowMultiple = q.AllowMultiple,
                Options = q.Options.Select(o => new Option
                {
                    Text = o.Text,
                    IsCorrect = o.IsCorrect
                }).ToList()
            }).ToList()
        };

        await _quizRepository.CreateQuiz(quiz);
        return RedirectToAction("Table");
    }

    // =========================
    // UPDATE (GET) – fetches an existing quiz and loads it into a view model
    // =========================

    [HttpGet]
    public async Task<IActionResult> Update(int id)
    {
        var quiz = await _quizRepository.GetQuizWithDetailsAsync(id);
        if (quiz == null)
        {
            _logger.LogError("[QuizController] Quiz not found when updating the QuizId {QuizId:0000}", id);
            return BadRequest("Quiz not found for the QuizId");
        }

        var viewModel = new QuizesViewModel
        {
            Quiz = quiz,
            Questions = quiz.Questions.Select(q => new QuestionsViewModel
            {
                QuestionId = q.QuestionId,
                Text = q.Text,
                AllowMultiple = q.AllowMultiple,
                Options = q.Options.Select(o => new OptionsViewModel
                {
                    OptionId = o.OptionId,
                    Text = o.Text,
                    IsCorrect = o.IsCorrect
                }).ToList()
            }).ToList()
        };

        return View(viewModel);
    }

    // =========================
    // UPDATE (POST) – saves edited quiz data
    // =========================

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Update(QuizesViewModel model)
    {
        _logger.LogInformation("[QuizController] Update called for QuizId {QuizId:0000}", model.Quiz?.QuizId);

        if (!ModelState.IsValid)
        {
            _logger.LogWarning("[QuizController] ModelState invalid when updating QuizId {QuizId:0000}. Errors: {Errors}",
                model.Quiz?.QuizId,
                string.Join("; ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage))
            );
            return View(model);
        }

        try
        {
            // --- Logging av inndata ---
            _logger.LogInformation("[QuizController] Starting update for QuizId {QuizId:0000}. Name='{Name}', Questions={QuestionCount}",
                model.Quiz.QuizId,
                model.Quiz.Name,
                model.Questions?.Count ?? 0
            );

            var updatedQuiz = new Quiz
            {
                QuizId = model.Quiz.QuizId,
                Name = model.Quiz.Name,
                Description = model.Quiz.Description,
                Category = model.Quiz.Category,
                Difficulty = model.Quiz.Difficulty,
                TimeLimit = model.Quiz.TimeLimit,
                Questions = model.Questions.Select(qvm => new Question
                {
                    QuestionId = qvm.QuestionId,
                    Text = qvm.Text,
                    AllowMultiple = qvm.AllowMultiple,
                    Options = qvm.Options.Select(ovm => new Option
                    {
                        OptionId = ovm.OptionId,
                        Text = ovm.Text,
                        IsCorrect = ovm.IsCorrect
                    }).ToList()
                }).ToList()
            };

            // --- Logging av detaljerte spørsmål og svaralternativer ---
            foreach (var q in updatedQuiz.Questions)
            {
                _logger.LogDebug("[QuizController] QuestionId={QuestionId}, Text='{Text}', AllowMultiple={AllowMultiple}",
                    q.QuestionId, q.Text, q.AllowMultiple);

                foreach (var o in q.Options)
                {
                    _logger.LogDebug("    OptionId={OptionId}, Text='{OptionText}', IsCorrect={IsCorrect}",
                        o.OptionId, o.Text, o.IsCorrect);
                }
            }

            var success = await _quizRepository.UpdateQuizFullAsync(updatedQuiz);

            if (!success)
            {
                _logger.LogError("[QuizController] UpdateQuizFullAsync failed for QuizId {QuizId:0000}", updatedQuiz.QuizId);
                ModelState.AddModelError(string.Empty, "En feil oppstod under lagring av endringene.");
                return View(model);
            }

            _logger.LogInformation("[QuizController] Successfully updated QuizId {QuizId:0000}", updatedQuiz.QuizId);
            return RedirectToAction("Table");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "[QuizController] Exception while updating QuizId {QuizId:0000}: {Message}",
                model.Quiz?.QuizId, ex.Message);

            ModelState.AddModelError(string.Empty, "En uventet feil oppstod. Prøv igjen senere.");
            return View(model);
        }
    }


    // =========================
    // DELETE (GET) – confirmation page
    // =========================

    [HttpGet]
    public async Task<IActionResult> Delete(int id)
    {
        var quiz = await _quizRepository.GetQuizById(id);
        if (quiz == null)
        {
            return NotFound();
        }
        return View(quiz);
    }

    // =========================
    // DELETE (POST) – deletes the quiz from DB
    // =========================

    [HttpPost]
    public async Task<IActionResult> DeleteConfirmed(int id)
    {
        await _quizRepository.DeleteQuiz(id);
        return RedirectToAction(nameof(Table));
    }

    // =========================
    // TAKE (GET) – shows one question at a time
    // URL: /Quiz/Take/{id}?questionNumber=1
    // =========================

    [HttpGet]
    public async Task<IActionResult> Take(int id, int questionNumber = 1)
    {
        // Fetch quiz and its questions
        var quiz = await _quizRepository.GetQuizById(id);
        var questions = await _quizRepository.GetQuestionsByQuizId(id);

        if (quiz == null || questions == null || !questions.Any())
        {
            return NotFound("Quiz or its questions were not found.");
        }

        // If questionNumber is out of range, redirect to Result
        if (questionNumber < 1 || questionNumber > questions.Count)
        {
            var key = $"score_{id}";
            int score = 0;
            if (TempData.TryGetValue(key, out var tmp) && tmp is int s)
            {
                score = s;
            }
            TempData.Remove(key);
            return RedirectToAction(nameof(Result), new { id = id, score = score });
        }

        // Build the view model for the current question
        var question = questions[questionNumber - 1];

        var viewModel = new QuizTakeViewModel
        {
            QuizId = quiz.QuizId,
            QuizName = quiz.Name ?? "Unknown Quiz",
            QuestionNumber = questionNumber,
            TotalQuestions = questions.Count,
            QuestionId = question.QuestionId,
            QuestionText = question.Text,
            AllowMultiple = question.AllowMultiple,
            TimeLimit = quiz.TimeLimit, // <- Legg til
            Options = question.Options?.Select(o => new Option
            {
                OptionId = o.OptionId,
                Text = o.Text,
                IsCorrect = o.IsCorrect
            }).ToList() ?? new List<Option>()
        };

        return View(viewModel);
    }

    // ========================
    // TAKE (POST): evaluates answer and moves to next question or result
    // ========================

    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Take(QuizTakeViewModel model)
    {
        // Get questions from repository
        var questions = await _quizRepository.GetQuestionsByQuizId(model.QuizId);
        if (questions == null || !questions.Any())
        {
            return NotFound();
        }

        // Find current question
        var currentQuestion = questions.FirstOrDefault(q => q.QuestionId == model.QuestionId);
        if (currentQuestion == null)
        {
            ModelState.AddModelError(string.Empty, "Question not found");
            return View(model);
        }

        // If no answer selected → re-display same view with error message
        if (model.SelectedOptionIds == null || !model.SelectedOptionIds.Any())
        {
            ModelState.AddModelError(string.Empty, "Please select at least one answer before continuing.");
            model.Options = currentQuestion.Options?.Select(o => new Option
            {
                OptionId = o.OptionId,
                Text = o.Text,
                IsCorrect = o.IsCorrect
            }).ToList() ?? new List<Option>();
            model.TotalQuestions = questions.Count;
            model.AllowMultiple = currentQuestion.AllowMultiple;
            return View(model);
        }

        // Store and update score using TempData (temporary session storage)
        var key = $"score_{model.QuizId}";
        int currentScore = 0;
        if (TempData.TryGetValue(key, out var stored) && stored is int cs)
        {
            currentScore = cs;
        }

        // Check if answer is correct
        if (currentQuestion.AllowMultiple)
        {
            // Compare sets of correct vs selected options
            var correctOptions = currentQuestion.Options.Where(o => o.IsCorrect).Select(o => o.OptionId).ToHashSet();
            var chosen = model.SelectedOptionIds.ToHashSet();

            if (chosen.SetEquals(correctOptions))
            {
                currentScore += 1; // full score only if all correct
            }
        }
        else
        {
            var chosenOption = currentQuestion.Options.FirstOrDefault(o => o.OptionId == model.SelectedOptionIds.First());
            if (chosenOption != null && chosenOption.IsCorrect)
            {
                currentScore += 1;
            }
        }

        TempData[key] = currentScore; // save updated score

        // Move to next question or finish the quiz
        var nextQuestionNumber = model.QuestionNumber + 1;
        var total = questions.Count;

        if (nextQuestionNumber > total)
        {
            // Quiz finished - calculate final score
            int finalScore = 0;
            if (TempData.TryGetValue(key, out var finalVal) && finalVal is int fs)
            {
                finalScore = fs;
            }
            TempData.Remove(key);

            // Prepare result view model
            var quiz = await _quizRepository.GetQuizById(model.QuizId);
            int totalQuestions = quiz?.Questions?.Count ?? total;

            var resultVm = new ResultViewModel
            {
                QuizId = model.QuizId,
                Score = finalScore,
                TotalQuestions = totalQuestions,
                Percentage = totalQuestions > 0 ? (double)finalScore / totalQuestions * 100.0 : 0.0
            };

            // Redirect to next question
            return View("Result", resultVm);
        }

        return RedirectToAction(nameof(Take), new { id = model.QuizId, questionNumber = nextQuestionNumber });
    }

    // =========================
    // RESULT VIEW – displays final score after quiz is finished
    // =========================
    
    [HttpGet]
    public IActionResult Result(int id, int score)
    {
        // If no score provided, show zero results
        var vm = new ResultViewModel
        {
            QuizId = id,
            Score = score,
            TotalQuestions = 0,
            Percentage = 0
        };
        return View(vm);
    }
}
