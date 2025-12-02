using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Que.DTOs;
using Que.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Que.Controllers
{
    /// Controller for handling user authentication operations (register, login, logout)
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<AuthUser> _userManager;
        private readonly SignInManager<AuthUser> _signInManager;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthController> _logger;

        /// Constructor that injects required dependencies for authentication
        public AuthController(UserManager<AuthUser> userManager, SignInManager<AuthUser> signInManager, IConfiguration configuration, ILogger<AuthController> logger)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _configuration = configuration;
            _logger = logger;
        }

        /// Registers a new user with username, email, and password
        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            // Create new user object with provided credentials
            var user = new AuthUser
            {
                UserName = registerDto.Username,
                Email = registerDto.Email,
            };

            // Attempt to create user with Identity framework
            var result = await _userManager.CreateAsync(user, registerDto.Password);
            
            if (result.Succeeded)
            {
                _logger.LogInformation("[AuthAPIController] user registered for {@username}", registerDto.Username);
                return Ok(new { Message = "User registered successfully" });
            }

            _logger.LogWarning("[AuthAPIController] user registration failed for {@username}", registerDto.Username);
            
            // Return user-friendly error messages if registration fails
            var errors = result.Errors.Select(e => e.Description).ToList();
            var errorMessage = string.Join(" ", errors);
            return BadRequest(new { message = errorMessage, errors = errors });
        }

        /// Authenticates a user and returns a JWT token if credentials are valid
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            // Find user by username
            var user = await _userManager.FindByNameAsync(loginDto.Username);

            // Verify user exists and password is correct
            if (user != null && await _userManager.CheckPasswordAsync(user, loginDto.Password))
            {
                _logger.LogInformation("[AuthAPIController] user authorized for {@username}", loginDto.Username);
                // Generate and return JWT token for authenticated user
                var token = GenerateJwtToken(user);
                return Ok(new { Token = token });
            }
            _logger.LogWarning("[AuthAPIContoller] user not authorized for {@username}", loginDto.Username);
            return Unauthorized();
        }

        /// Logs out the currently authenticated user
        [Authorize]
        [HttpPost("logout")]
        public async Task<IActionResult> LogOut()
        {
            // Sign out user from Identity framework
            await _signInManager.SignOutAsync();
            _logger.LogInformation("[AuthAPIController] user logged out");
            return Ok(new { Message = "Logout successfull" });
        }

        /// Generates JWT token for an authenticated user
        private string GenerateJwtToken(AuthUser user)
        {
            ArgumentNullException.ThrowIfNull(user);

            // Retrieve JWT configuration from appsettings
            var jwtKey = _configuration["Jwt:Key"];
            var jwtIssuer = _configuration["Jwt:Issuer"];
            var jwtAudience = _configuration["Jwt:Audience"];

            // Ensure all required JWT configuration values are present
            if (string.IsNullOrEmpty(jwtKey) || string.IsNullOrEmpty(jwtIssuer) || string.IsNullOrEmpty(jwtAudience))
            {
                _logger.LogError("JWT configuration is missing (Key/Issuer/Audience)");
                throw new InvalidOperationException("JWT configuration is missing.");
            }

            var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

            // Define claims that will be embedded in the token
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),                                               // GUID for Backend
                new Claim(ClaimTypes.Name, user.UserName ?? ""),                                             // Username
                new Claim(JwtRegisteredClaimNames.Email, user.Email ?? ""),                                  // Email
                new Claim(JwtRegisteredClaimNames.Sub, user.Id),                                             // SUB should also be GUID
                new Claim("username", user.UserName ?? ""),                                                  // Explicit username claim
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),                           // Unique token ID
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString()) // Issued at timestamp
            };

            // Create the JWT token with all required parameters (Token valid for 2 hours)
            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                claims: claims,
                expires: DateTime.UtcNow.AddHours(2),
                signingCredentials: credentials
            );

            _logger.LogInformation("JWT token generated for UserId={UserId}", user.Id);

            // Serialize token to string and return
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}