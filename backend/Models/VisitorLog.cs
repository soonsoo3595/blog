namespace Blog.Api.Models;

public class VisitorLog
{
    public required string VisitorId { get; set; }
    public DateOnly Date { get; set; }
}
