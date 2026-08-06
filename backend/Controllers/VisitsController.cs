using Blog.Api.Data;
using Blog.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Blog.Api.Controllers;

[ApiController]
[Route("api/visits")]
public class VisitsController(BlogDbContext db) : ControllerBase
{
    public record VisitStatsResponse(int Today, int Total);
    public record LogVisitRequest(string VisitorId);

    [HttpGet]
    public async Task<ActionResult<VisitStatsResponse>> Get()
    {
        return await GetStats();
    }

    [HttpPost]
    public async Task<ActionResult<VisitStatsResponse>> Log(LogVisitRequest request)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var alreadyLogged = await db.VisitorLogs
            .AnyAsync(v => v.VisitorId == request.VisitorId && v.Date == today);

        if (!alreadyLogged)
        {
            db.VisitorLogs.Add(new VisitorLog { VisitorId = request.VisitorId, Date = today });
            await db.SaveChangesAsync();
        }

        return await GetStats();
    }

    private async Task<VisitStatsResponse> GetStats()
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var todayCount = await db.VisitorLogs.CountAsync(v => v.Date == today);
        var totalCount = await db.VisitorLogs.Select(v => v.VisitorId).Distinct().CountAsync();

        return new VisitStatsResponse(todayCount, totalCount);
    }
}
