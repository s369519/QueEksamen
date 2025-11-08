using System;

namespace Que.Models;
public class QuizAttempt
{
    public int QuizAttemptId { get; set; }
    public int QuizId { get; set; }

    // virtual for lazy-loading / change-tracking proxies
    public virtual Quiz? Quiz { get; set; }

    public string UserId { get; set; } = null!;
    public double Score { get; set; }
    public DateTime AttemptedAt { get; set; } = DateTime.UtcNow;

    public QuizAttempt() { }
}