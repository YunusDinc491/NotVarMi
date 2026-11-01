using Microsoft.EntityFrameworkCore;
using NotVarMi.Api.Data;

namespace NotVarMi.Api.Features;

public static class CourseEndpoints
{
    private const long MaxFileSize = 100L * 1024 * 1024;
    private static readonly Dictionary<string, string> Types = new(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = "application/pdf", [".png"] = "image/png", [".jpg"] = "image/jpeg", [".jpeg"] = "image/jpeg", [".webp"] = "image/webp",
        [".txt"] = "text/plain", [".doc"] = "application/msword", [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        [".xls"] = "application/vnd.ms-excel", [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        [".ppt"] = "application/vnd.ms-powerpoint", [".pptx"] = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    };
    private static string Storage(IConfiguration config, IWebHostEnvironment env) => config["FileStorage:Path"] ?? Path.Combine(env.ContentRootPath, ".uploads");
    private static object Describe(CourseFile file) => new { file.Id, file.CourseId, file.Name, file.Size, file.ContentType, file.CreatedAt };
    public static void MapCourseEndpoints(this WebApplication app)
    {
        var courses = app.MapGroup("/api/courses").RequireAuthorization();
        courses.MapGet("/", async (NotesDbContext db) => Results.Ok(await db.Courses.Where(c => !c.IsDeleted).OrderBy(c => c.Name).Select(c => new { c.Id, c.Name }).ToListAsync()));
        courses.MapGet("/{id:int}", async (int id, NotesDbContext db) =>
        {
            var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (course is null) return Results.NotFound();
            var files = await db.Files.Where(f => f.CourseId == id && !f.IsDeleted).OrderByDescending(f => f.CreatedAt).ToListAsync();
            return Results.Ok(new { course.Id, course.Name, Files = files.Select(Describe) });
        });
        courses.MapPost("/", async (CourseInput input, NotesDbContext db) =>
        {
            var name = input.Name?.Trim();
            if (string.IsNullOrWhiteSpace(name) || name.Length > 100) return Results.BadRequest(new { message = "Ders adı 1 ile 100 karakter arasında olmalı." });
            if (await db.Courses.AnyAsync(c => c.Name == name)) return Results.Conflict(new { message = "Bu adda bir ders zaten var; geri dönüşüm kutusunu da kontrol et." });
            await using var transaction = await db.Database.BeginTransactionAsync();
            var course = new Course { Name = name }; db.Courses.Add(course); await db.SaveChangesAsync();
            db.Notebooks.Add(NotebookExamples.ForCourse(course)); await db.SaveChangesAsync(); await transaction.CommitAsync();
            return Results.Created($"/api/courses/{course.Id}", new { course.Id, course.Name });
        }).RequireAuthorization("AdminOnly");
        courses.MapPut("/{id:int}", async (int id, CourseInput input, NotesDbContext db) =>
        {
            var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (course is null) return Results.NotFound();
            var name = input.Name?.Trim();
            if (string.IsNullOrWhiteSpace(name) || name.Length > 100) return Results.BadRequest(new { message = "Ders adı 1 ile 100 karakter arasında olmalı." });
            if (await db.Courses.AnyAsync(c => c.Id != id && c.Name == name)) return Results.Conflict(new { message = "Bu adda bir ders zaten var." });
            course.Name = name; await db.SaveChangesAsync(); return Results.NoContent();
        }).RequireAuthorization("AdminOnly");
        courses.MapDelete("/{id:int}", async (int id, NotesDbContext db) =>
        {
            var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (course is null) return Results.NotFound(); course.IsDeleted = true; await db.SaveChangesAsync(); return Results.NoContent();
        }).RequireAuthorization("AdminOnly");
        courses.MapPost("/{id:int}/files", async (int id, IFormFile file, NotesDbContext db, IConfiguration config, IWebHostEnvironment env) =>
        {
            if (!await db.Courses.AnyAsync(c => c.Id == id && !c.IsDeleted)) return Results.NotFound();
            var name = Path.GetFileName(file.FileName.Replace('\\', '/'));
            var extension = Path.GetExtension(name);
            if (string.IsNullOrWhiteSpace(name) || name.Length > 200 || name.Any(char.IsControl) || !Types.TryGetValue(extension, out var type)) return Results.BadRequest(new { message = "Bu dosya türü desteklenmiyor." });
            if (file.Length <= 0 || file.Length > MaxFileSize) return Results.BadRequest(new { message = "Dosya boş olamaz ve 100 MB sınırını aşamaz." });
            var root = Storage(config, env); Directory.CreateDirectory(root);
            var storageName = Guid.NewGuid().ToString("N"); var path = Path.Combine(root, storageName);
            try
            {
                await using (var output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None)) await file.CopyToAsync(output);
                var entry = new CourseFile { CourseId = id, Name = name, StorageName = storageName, ContentType = type, Size = file.Length };
                db.Files.Add(entry); await db.SaveChangesAsync(); return Results.Created($"/api/files/{entry.Id}", Describe(entry));
            }
            catch { if (File.Exists(path)) File.Delete(path); throw; }
        }).DisableAntiforgery().RequireAuthorization("AdminOnly");

        var filesApi = app.MapGroup("/api/files").RequireAuthorization();
        filesApi.MapGet("/{id:int}", async (int id, bool? preview, NotesDbContext db, IConfiguration config, IWebHostEnvironment env, HttpContext context) =>
        {
            var file = await db.Files.FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted && db.Courses.Any(c => c.Id == f.CourseId && !c.IsDeleted));
            if (file is null) return Results.NotFound();
            var path = Path.Combine(Storage(config, env), file.StorageName);
            if (!File.Exists(path)) return Results.NotFound();
            context.Response.Headers.XContentTypeOptions = "nosniff";
            context.Response.Headers.ContentSecurityPolicy = "sandbox; default-src 'none'";
            var inline = preview == true && (file.ContentType == "application/pdf" || file.ContentType == "text/plain" || file.ContentType.StartsWith("image/"));
            return Results.File(path, inline ? file.ContentType : "application/octet-stream", inline ? null : file.Name, enableRangeProcessing: true);
        });
        filesApi.MapDelete("/{id:int}", async (int id, NotesDbContext db) =>
        {
            var file = await db.Files.FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted && db.Courses.Any(c => c.Id == f.CourseId && !c.IsDeleted));
            if (file is null) return Results.NotFound(); file.IsDeleted = true; await db.SaveChangesAsync(); return Results.NoContent();
        }).RequireAuthorization("AdminOnly");
        filesApi.MapPut("/{id:int}/text", async (int id, TextInput input, NotesDbContext db, IConfiguration config, IWebHostEnvironment env) =>
        {
            var item = await db.Files.FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted && f.ContentType == "text/plain" && db.Courses.Any(c => c.Id == f.CourseId && !c.IsDeleted));
            if (item is null) return Results.NotFound();
            var bytes = System.Text.Encoding.UTF8.GetBytes(input.Text ?? "");
            if (bytes.Length == 0 || bytes.Length > 1024 * 1024) return Results.BadRequest(new { message = "Not boş olamaz veya 1 MB sınırını aşamaz." });
            var root = Storage(config, env); var oldPath = Path.Combine(root, item.StorageName);
            if (!File.Exists(oldPath)) return Results.NotFound();
            var newName = Guid.NewGuid().ToString("N"); var newPath = Path.Combine(root, newName);
            try { await File.WriteAllBytesAsync(newPath, bytes); item.StorageName = newName; item.Size = bytes.Length; await db.SaveChangesAsync(); }
            catch { if (File.Exists(newPath)) File.Delete(newPath); throw; }
            try { File.Delete(oldPath); } catch (IOException) { /* A leftover copy is safer than losing the saved note. */ }
            return Results.NoContent();
        }).RequireAuthorization("AdminOnly");

        var trash = app.MapGroup("/api/trash").RequireAuthorization("AdminOnly");
        trash.MapGet("/", async (NotesDbContext db) => Results.Ok(new {
            courses = await db.Courses.Where(c => c.IsDeleted).OrderBy(c => c.Name).Select(c => new { c.Id, c.Name }).ToListAsync(),
            files = await (from f in db.Files join c in db.Courses on f.CourseId equals c.Id where f.IsDeleted && !c.IsDeleted select new { f.Id, f.Name, courseName = c.Name }).ToListAsync()
        }));
        trash.MapPost("/courses/{id:int}/restore", async (int id, NotesDbContext db) => { var item = await db.Courses.FirstOrDefaultAsync(c => c.Id == id && c.IsDeleted); if (item is null) return Results.NotFound(); item.IsDeleted = false; await db.SaveChangesAsync(); return Results.NoContent(); });
        trash.MapPost("/files/{id:int}/restore", async (int id, NotesDbContext db) => { var item = await db.Files.FirstOrDefaultAsync(f => f.Id == id && f.IsDeleted && db.Courses.Any(c => c.Id == f.CourseId && !c.IsDeleted)); if (item is null) return Results.NotFound(); item.IsDeleted = false; await db.SaveChangesAsync(); return Results.NoContent(); });
        trash.MapDelete("/files/{id:int}", async (int id, NotesDbContext db, IConfiguration config, IWebHostEnvironment env) =>
        {
            var item = await db.Files.FirstOrDefaultAsync(f => f.Id == id && f.IsDeleted && db.Courses.Any(c => c.Id == f.CourseId && !c.IsDeleted));
            if (item is null) return Results.NotFound();
            var path = Path.Combine(Storage(config, env), item.StorageName);
            db.Files.Remove(item); await db.SaveChangesAsync();
            try { if (File.Exists(path)) File.Delete(path); } catch (IOException) { /* Clean up orphaned blobs separately. */ }
            return Results.NoContent();
        });
        trash.MapDelete("/courses/{id:int}", async (int id, NotesDbContext db, IConfiguration config, IWebHostEnvironment env) =>
        {
            var item = await db.Courses.FirstOrDefaultAsync(c => c.Id == id && c.IsDeleted); if (item is null) return Results.NotFound();
            var paths = await db.Files.Where(f => f.CourseId == id).Select(f => f.StorageName).ToListAsync();
            db.Courses.Remove(item); await db.SaveChangesAsync();
            foreach (var name in paths) { var path = Path.Combine(Storage(config, env), name); try { if (File.Exists(path)) File.Delete(path); } catch (IOException) { /* Clean up orphaned blobs separately. */ } }
            return Results.NoContent();
        });
    }
    private record CourseInput(string? Name);
    private record TextInput(string? Text);
}
