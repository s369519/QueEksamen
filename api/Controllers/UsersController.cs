using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using System.Security.Claims;
using Microsoft.AspNetCore.Identity;
using Que.Models;

namespace Que.Controllers;

// Controller for managing user profile operations
[ApiController]
[Route("api/[controller]")]
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
public class UsersController : ControllerBase
{
    private readonly UserManager<AuthUser> _userManager;
    private readonly ILogger<UsersController> _logger;

    // Constructor that injects required dependencies for user management
    public UsersController(UserManager<AuthUser> userManager, ILogger<UsersController> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    // Gets the profile information for the currently authenticated user
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        // Extract user ID from JWT token claims
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(userId))
        {
            _logger.LogWarning("GetProfile called without user id");
            return Unauthorized();
        }

        // Retrieve user from database
        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
        {
            _logger.LogWarning("User not found for id {UserId}", userId);
            return NotFound();
        }

        // Return user profile information
        return Ok(new {
            id = user.Id,
            username = user.UserName,
            email = user.Email
        });
    }
}