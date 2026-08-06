using Blog.Api.Data;
using Blog.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blog.Api.Controllers;

[ApiController]
[Route("api/posts/{postId}/views")]
public class PostViewsController(BlogDbContext db) : ControllerBase
{
    public record ViewCountResponse(int Count);

    [HttpGet]
    public async Task<ActionResult<ViewCountResponse>> Get(string postId)
    {
        var count = await db.PostViews
            .Where(v => v.PostId == postId)
            .Select(v => v.Count)
            .FirstOrDefaultAsync();

        return new ViewCountResponse(count);
    }

    [HttpPost]
    public async Task<ActionResult<ViewCountResponse>> Increment(string postId)
    {
        var view = await db.PostViews.FindAsync(postId);
        if (view is null)
        {
            view = new PostView { PostId = postId, Count = 0 };
            db.PostViews.Add(view);
        }

        view.Count++;
        await db.SaveChangesAsync();

        return new ViewCountResponse(view.Count);
    }
}
