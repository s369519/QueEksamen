using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Que.Middleware;

namespace Que.Filters
{
    /// Action filter that automatically validates model state before controller actions execute
    /// Returns structured validation errors if model state is invalid
    /// Registered globally in Program.cs to apply to all controller actions
    public class ValidateModelStateAttribute : ActionFilterAttribute
    {
        /// Executes before the action method runs
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            // Check if model validation failed (based on DataAnnotations)
            if (!context.ModelState.IsValid)
            {
                // Extract all validation errors from ModelState
                // Creates a dictionary where key = property name, value = array of error messages
                var errors = context.ModelState
                    .Where(e => e.Value?.Errors.Count > 0)
                    .ToDictionary(
                        kvp => kvp.Key,
                        kvp => kvp.Value?.Errors.Select(e => e.ErrorMessage).ToArray() ?? Array.Empty<string>()
                    );

                // Create structured error response matching global error format
                var errorResponse = new ErrorResponse
                {
                    Code = 400,
                    Message = "Validation failed",
                    Errors = errors
                };

                // Return 400 Bad Request with validation errors, preventing action execution
                context.Result = new BadRequestObjectResult(errorResponse);
            }
        }
    }
}
