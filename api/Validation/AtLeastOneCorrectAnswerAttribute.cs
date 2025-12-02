using System.ComponentModel.DataAnnotations;
using Que.DTOs;

namespace Que.Validation
{
    /// <summary>
    /// Validates that a list of OptionDto contains at least one correct answer
    /// </summary>
    public class AtLeastOneCorrectAnswerAttribute : ValidationAttribute
    {
        protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
        {
            if (value is List<OptionDto> options)
            {
                if (!options.Any(o => o.IsCorrect))
                {
                    return new ValidationResult("At least one option must be marked as correct");
                }
            }

            return ValidationResult.Success;
        }
    }
}
