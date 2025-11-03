using Microsoft.AspNetCore.Mvc;
using Que.DAL;
using Que.Models;
using Que.ViewModels;

namespace Que.Controllers
{
    // Handles the main dashboard logic: showing quizzes, filtering by category,
    // and switching between table and grid views.
    public class DashboardController : Controller
    {
        private readonly QuizDbContext _context;

        public DashboardController(QuizDbContext context)
        {
            _context = context;
        }

        // =========================
        // INDEX – main dashboard page
        // Shows all quizzes, optionally filtered by category
        // =========================

        [HttpGet]
        public IActionResult Index(string selectedCategory)
        {
            // Get all quizzes from the database
            var quizes = _context.Quizes.ToList(); // hent alle quizer fra DB

            // If a specific category is selected, filter the list
            if (!string.IsNullOrEmpty(selectedCategory) && selectedCategory != "all")
            {
                quizes = quizes.Where(q => q.Category == selectedCategory).ToList();
            }

            // Prepare data for the view (list of quizzes + current filter)
            var model = new DashboardViewModel
            {
                Quizes = quizes,
                SelectedCategory = selectedCategory ?? "all"
            };

            return View(model);
        }

        // =========================
        // TABLE VIEW – displays quizzes in a table format
        // =========================
        
        public IActionResult Table()
        {
            var viewModel = new QuizesViewModel(_context.Quizes.ToList(), "Table");
            return View(viewModel);
        }

        // =========================
        // GRID VIEW – displays quizzes as cards
        // =========================
        public IActionResult Grid()
        {
            var quizes = _context.Quizes.ToList();
            return View(quizes);
        }
        
    }
}