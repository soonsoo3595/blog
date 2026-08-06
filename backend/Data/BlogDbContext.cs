using Blog.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace Blog.Api.Data;

public class BlogDbContext(DbContextOptions<BlogDbContext> options) : DbContext(options)
{
    public DbSet<PostView> PostViews => Set<PostView>();
    public DbSet<VisitorLog> VisitorLogs => Set<VisitorLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PostView>().HasKey(v => v.PostId);
        modelBuilder.Entity<VisitorLog>().HasKey(v => new { v.VisitorId, v.Date });
    }
}
