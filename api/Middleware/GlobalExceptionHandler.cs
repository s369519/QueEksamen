using System.Net;
using System.Text.Json;

namespace Que.Middleware
{
    // Global exception handling middleware that catches all unhandled exceptions
    // Maps exceptions to appropriate HTTP status codes and returns structured error responses
    // Registered as first middleware in Program.cs to catch all downstream exceptions
    public class GlobalExceptionHandler
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionHandler> _logger;

        // Constructor that injects the next middleware delegate and logger
        public GlobalExceptionHandler(RequestDelegate next, ILogger<GlobalExceptionHandler> logger)
        {
            _next = next;
            _logger = logger;
        }

        // Invokes the middleware, wrapping the request pipeline in try-catch
        // Catches any unhandled exceptions and converts them to structured error responses
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                // Call the next middleware in the pipeline
                await _next(context);
            }
            catch (Exception ex)
            {
                // Log the exception with full details
                _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
                // Convert exception to HTTP response
                await HandleExceptionAsync(context, ex);
            }
        }

        // Maps exceptions to HTTP status codes and creates structured error responses
        // Different exception types are mapped to appropriate status codes:
        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var code = HttpStatusCode.InternalServerError;
            var result = string.Empty;

            // Map exception types to HTTP status codes
            switch (exception)
            {
                case ArgumentNullException:
                case ArgumentException:
                    // Invalid input parameters
                    code = HttpStatusCode.BadRequest;
                    result = JsonSerializer.Serialize(new ErrorResponse
                    {
                        Code = (int)code,
                        Message = exception.Message
                    });
                    break;
                case UnauthorizedAccessException:
                    // User not authorized for this action
                    code = HttpStatusCode.Unauthorized;
                    result = JsonSerializer.Serialize(new ErrorResponse
                    {
                        Code = (int)code,
                        Message = "Unauthorized access"
                    });
                    break;
                case KeyNotFoundException:
                    // Resource not found in database
                    code = HttpStatusCode.NotFound;
                    result = JsonSerializer.Serialize(new ErrorResponse
                    {
                        Code = (int)code,
                        Message = exception.Message
                    });
                    break;
                default:
                    // Unexpected server error - don't expose internal details to client
                    result = JsonSerializer.Serialize(new ErrorResponse
                    {
                        Code = (int)code,
                        Message = "An internal server error occurred. Please try again later."
                    });
                    break;
            }

            // Set response headers and write error JSON
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)code;
            return context.Response.WriteAsync(result);
        }
    }

    // Standardized error response structure used throughout the application
    public class ErrorResponse
    {
        // HTTP status code
        public int Code { get; set; }
        
        // Human-readable error message
        public string Message { get; set; } = string.Empty;
        
        // Optional validation errors (field name -> error messages)
        public Dictionary<string, string[]>? Errors { get; set; }
    }
}
