using System.Security.Claims;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using NotVarMi.Api.Data;
using NotVarMi.Api.Features;

var builder = WebApplication.CreateBuilder(args);
if (builder.Environment.IsDevelopment())
    builder.Services.AddDataProtection().PersistKeysToFileSystem(new DirectoryInfo(Path.Combine(builder.Environment.ContentRootPath, ".keys")));
builder.Configuration.AddJsonFile("appsettings.Local.json", optional: true).AddEnvironmentVariables();
if (!builder.Environment.IsDevelopment())
    throw new InvalidOperationException("Üretim için kalıcı veritabanı ve güvenli oturum yapılandırması henüz hazır değil.");
builder.Services.AddDbContext<NotesDbContext>(options => options.UseSqlite(
    builder.Configuration.GetConnectionString("Notes") ?? $"Data Source={Path.Combine(builder.Environment.ContentRootPath, "notvarmi.local.db")}"));
builder.WebHost.ConfigureKestrel(options => options.Limits.MaxRequestBodySize = 101L * 1024 * 1024);
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options => options.MultipartBodyLengthLimit = 101L * 1024 * 1024);
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme).AddCookie(options =>
{
    options.Cookie.Name = "notvarmi.session";
    options.Cookie.HttpOnly = true;
    options.Cookie.SameSite = SameSiteMode.Strict;
    options.Cookie.SecurePolicy = CookieSecurePolicy.SameAsRequest;
    options.Events.OnRedirectToLogin = context => { context.Response.StatusCode = 401; return Task.CompletedTask; };
    options.Events.OnRedirectToAccessDenied = context => { context.Response.StatusCode = 403; return Task.CompletedTask; };
});
builder.Services.AddAuthorization(options => options.AddPolicy("AdminOnly", policy => policy.RequireRole("Admin")));
builder.Services.AddRateLimiter(options => { options.RejectionStatusCode = 429; options.AddFixedWindowLimiter("login", limiter =>
{
    limiter.PermitLimit = 10;
    limiter.Window = TimeSpan.FromMinutes(1);
    limiter.QueueLimit = 0;
}); });
var app = builder.Build();
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<NotesDbContext>();
    DatabaseBootstrap.Initialize(db);
}
// A same-origin custom header blocks browser cross-site form submissions on state-changing requests.
app.Use(async (context, next) =>
{
    if (context.Request.Path.StartsWithSegments("/api") && !HttpMethods.IsGet(context.Request.Method)
        && !HttpMethods.IsHead(context.Request.Method) && !HttpMethods.IsOptions(context.Request.Method)
        && context.Request.Headers["X-NotVarMi-Request"] != "1")
    {
        context.Response.StatusCode = StatusCodes.Status400BadRequest;
        return;
    }
    await next();
});
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapPost("/api/auth/login", async (LoginRequest input, HttpContext context, IConfiguration config) =>
{
    var username = input.Username?.Trim() ?? "";
    var role = username.Equals("yunusdinc", StringComparison.OrdinalIgnoreCase) ? "Admin"
        : username.Equals("misafir", StringComparison.OrdinalIgnoreCase) ? "Viewer" : null;
    var hash = role is null ? null : config[$"Accounts:{role}:PasswordHash"];
    var hasher = new PasswordHasher<string>();
    if (role is null || string.IsNullOrWhiteSpace(hash) || string.IsNullOrEmpty(input.Password) || input.Password.Length > 256
        || hasher.VerifyHashedPassword(role, hash, input.Password) == PasswordVerificationResult.Failed)
        return Results.Unauthorized();
    var identity = new ClaimsIdentity(new[] { new Claim(ClaimTypes.Name, username), new Claim(ClaimTypes.Role, role) }, CookieAuthenticationDefaults.AuthenticationScheme);
    await context.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));
    return Results.Ok(new { username, role });
}).RequireRateLimiting("login");
app.MapPost("/api/auth/logout", async (HttpContext context) =>
{
    await context.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
    return Results.NoContent();
}).RequireAuthorization();
app.MapGet("/api/auth/me", (ClaimsPrincipal user) => Results.Ok(new { username = user.Identity?.Name, role = user.FindFirstValue(ClaimTypes.Role) })).RequireAuthorization();
app.MapCourseEndpoints();
app.MapGet("/api/health", () => Results.Ok(new { status = "ok" }));
app.Run();
record LoginRequest(string? Username, string? Password);
