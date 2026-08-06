using Microsoft.EntityFrameworkCore;

namespace Blog.Api.Data;

public class BlogDbContext(DbContextOptions<BlogDbContext> options) : DbContext(options)
{
}
