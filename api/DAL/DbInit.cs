using Microsoft.EntityFrameworkCore;
using Que.Models;

namespace Que.DAL;

public static class DBInit
{
    public static void Seed(IApplicationBuilder app)
    {
        using var serviceScope = app.ApplicationServices.CreateScope();
        QuizDbContext context = serviceScope.ServiceProvider.GetRequiredService<QuizDbContext>();
        // context.Database.EnsureDeleted();
        context.Database.EnsureCreated();

        if (!context.Quizes.Any())
        {
            var quizes = new List<Quiz>
            {
                new Quiz
                {
                    Name = "Quiz 1",
                    Description = "Description Quiz 1"
                },
                new Quiz
                {
                    Name = "Quiz 2",
                    Description = "Description Quiz 2"
                },
                new Quiz
                {
                    Name = "Quiz 3",
                    Description = "Description Quiz 3"
                }
            };
            context.AddRange(quizes);
            context.SaveChanges();
        }
    }
}