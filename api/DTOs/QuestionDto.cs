namespace Que.DTOs
{
    public class QuestionDto{
        public int QuestionId { get; set; }
        public string Text { get; set; } = string.Empty;
        public bool AllowMultiple { get; set; }
        public List<OptionDto> Options { get; set; } = new List<OptionDto>();
    }
}