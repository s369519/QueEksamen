namespace Que.ViewModels
{
    // ViewModel used to display the final quiz result, including score, total questions, and percentage.
    public class ResultViewModel
    {
        public int QuizId { get; set; }
        public int Score { get; set; }
        public int TotalQuestions { get; set; }
        public double Percentage { get; set; }

        // Optional: summary message shown in the result view
        public string Message => $"You scored {Score} / {TotalQuestions} ({Percentage:F1}%)";
    }
}
