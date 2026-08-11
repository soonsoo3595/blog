using Blog.Api.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<BlogDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

var app = builder.Build();

// blog-api는 외부에 직접 노출되지 않고 backend 네트워크 안에서 blog-web이
// 평문 HTTP로만 호출하는 내부 전용 서비스라 HTTPS 리다이렉트가 필요 없다
// (오히려 내부 호출을 깨뜨릴 수 있어서 뺐다).

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

using (var scope = app.Services.CreateScope())
{
    await scope.ServiceProvider.GetRequiredService<BlogDbContext>().Database.MigrateAsync();
}

app.UseAuthorization();

app.MapControllers();

app.MapGet("/health/db", async (BlogDbContext db) =>
    await db.Database.CanConnectAsync() ? Results.Ok("connected") : Results.StatusCode(503));

app.Run();
