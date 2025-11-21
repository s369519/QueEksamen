using System.Net;
using System.Text.Json;

namespace Que.Middleware
{
    public class GlobalExceptionHandler
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<GlobalExceptionHandler> _logger;

        public GlobalExceptionHandler(RequestDelegate next, ILogger<GlobalExceptionHandler> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unhandled exception occurred: {Message}", ex.Message);
                await HandleExceptionAsync(context, ex);
            }
        }

        private static Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            var code = HttpStatusCode.InternalServerError;
            var result = string.Empty;

            switch (exception)
            {
                case ArgumentNullException:
                case ArgumentException:
                    code = HttpStatusCode.BadRequest;
                    result = JsonSerializer.Serialize(new ErrorResponse
                    {
                        Code = (int)code,
                        Message = exception.Message
                    });
                    break;
                case UnauthorizedAccessException:
                    code = HttpStatusCode.Unauthorized;
                    result = JsonSerializer.Serialize(new ErrorResponse
                    {
                        Code = (int)code,
                        Message = "Unauthorized access"
                    });
                    break;
                case KeyNotFoundException:
                    code = HttpStatusCode.NotFound;
                    result = JsonSerializer.Serialize(new ErrorResponse
                    {
                        Code = (int)code,
                        Message = exception.Message
                    });
                    break;
                default:
                    result = JsonSerializer.Serialize(new ErrorResponse
                    {
                        Code = (int)code,
                        Message = "An internal server error occurred. Please try again later."
                    });
                    break;
            }

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)code;
            return context.Response.WriteAsync(result);
        }
    }

    public class ErrorResponse
    {
        public int Code { get; set; }
        public string Message { get; set; } = string.Empty;
        public Dictionary<string, string[]>? Errors { get; set; }
    }
}
