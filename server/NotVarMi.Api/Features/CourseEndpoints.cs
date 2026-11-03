using Microsoft.EntityFrameworkCore;
using NotVarMi.Api.Data;
using NotVarMi.Api.Storage;

namespace NotVarMi.Api.Features;

public static class CourseEndpoints
{
    private const long MaxFileSize = 95L * 1024 * 1024;
    private static readonly Dictionary<string, string> Types = new(StringComparer.OrdinalIgnoreCase)
    {
        [".pdf"] = "application/pdf", [".png"] = "image/png", [".jpg"] = "image/jpeg", [".jpeg"] = "image/jpeg", [".webp"] = "image/webp",
        [".txt"] = "text/plain", [".doc"] = "application/msword", [".docx"] = "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        [".xls"] = "application/vnd.ms-excel", [".xlsx"] = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        [".ppt"] = "application/vnd.ms-powerpoint", [".pptx"] = "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    };
    private static object Describe(CourseFile file) => new { file.Id, file.CourseId, file.Name, file.Size, file.ContentType, file.CreatedAt, file.IsContent };
    public static void MapCourseEndpoints(this WebApplication app)
    {
        var courses = app.MapGroup("/api/courses").RequireAuthorization();
        courses.MapGet("/", async (NotesDbContext db) => Results.Ok(await db.Courses.Where(c => !c.IsDeleted).OrderBy(c => c.Name).Select(c => new { c.Id, c.Name }).ToListAsync()));
        courses.MapGet("/{id:int}", async (int id, NotesDbContext db) =>
        {
            var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == id && !c.IsDeleted);
            if (course is null) return Results.NotFound();
            var items = await db.Files.Where(f => f.CourseId == id && !f.IsDeleted).OrderByDescending(f => f.CreatedAt).ToListAsync();
            return Results.Ok(new { course.Id, course.Name, Files = items.Where(f => !f.IsContent).Select(Describe), Contents = items.Where(f => f.IsContent).Select(Describe) });
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
        courses.MapPost("/{id:int}/files", async (int id, IFormFile file, [Microsoft.AspNetCore.Mvc.FromForm] bool content, NotesDbContext db, IFileStore store, CancellationToken cancellation) =>
        {
            if (!await db.Courses.AnyAsync(c => c.Id == id && !c.IsDeleted)) return Results.NotFound();
            var name = Path.GetFileName(file.FileName.Replace('\\', '/'));
            var extension = Path.GetExtension(name);
            if (string.IsNullOrWhiteSpace(name) || name.Length > 200 || name.Any(char.IsControl) || !Types.TryGetValue(extension, out var type)) return Results.BadRequest(new { message = "Bu dosya türü desteklenmiyor." });
            if (content && type != "application/pdf") return Results.BadRequest(new { message = "Ders içeriği yalnızca PDF olabilir." });
            if (file.Length <= 0 || file.Length > MaxFileSize) return Results.BadRequest(new { message = "Dosya boş olamaz ve 95 MB sınırını aşamaz." });
            var storageName = Guid.NewGuid().ToString("N");
            try
            {
                await using (var input = file.OpenReadStream()) await store.PutAsync(storageName, input, cancellation);
                var entry = new CourseFile { CourseId = id, Name = name, StorageName = storageName, ContentType = type, Size = file.Length, IsContent = content };
                db.Files.Add(entry); await db.SaveChangesAsync(); return Results.Created($"/api/files/{entry.Id}", Describe(entry));
            }
            catch { await store.DeleteAsync(storageName, CancellationToken.None); throw; }
        }).DisableAntiforgery().RequireAuthorization("AdminOnly");

        var filesApi = app.MapGroup("/api/files").RequireAuthorization();
        filesApi.MapGet("/{id:int}", async (int id, bool? preview, NotesDbContext db, IFileStore store, HttpContext context, CancellationToken cancellation) =>
        {
            var file = await db.Files.FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted && db.Courses.Any(c => c.Id == f.CourseId && !c.IsDeleted));
            if (file is null) return Results.NotFound();
            var stream = await store.OpenAsync(file.StorageName, cancellation);
            if (stream is null) return Results.NotFound();
            context.Response.Headers.XContentTypeOptions = "nosniff";
            context.Response.Headers.ContentSecurityPolicy = "sandbox; default-src 'none'";
            var inline = preview == true && (file.ContentType == "application/pdf" || file.ContentType == "text/plain" || file.ContentType.StartsWith("image/"));
            return Results.Stream(stream, inline ? file.ContentType : "application/octet-stream", inline ? null : file.Name);
        });
        filesApi.MapDelete("/{id:int}", async (int id, NotesDbContext db) =>
        {
            var file = await db.Files.FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted && db.Courses.Any(c => c.Id == f.CourseId && !c.IsDeleted));
            if (file is null) return Results.NotFound(); file.IsDeleted = true; await db.SaveChangesAsync(); return Results.NoContent();
        }).RequireAuthorization("AdminOnly");
        filesApi.MapPut("/{id:int}/text", async (int id, TextInput input, NotesDbContext db, IFileStore store, CancellationToken cancellation) =>
        {
            var item = await db.Files.FirstOrDefaultAsync(f => f.Id == id && !f.IsDeleted && f.ContentType == "text/plain" && db.Courses.Any(c => c.Id == f.CourseId && !c.IsDeleted));
            if (item is null) return Results.NotFound();
            var bytes = System.Text.Encoding.UTF8.GetBytes(input.Text ?? "");
            if (bytes.Length == 0 || bytes.Length > 1024 * 1024) return Results.BadRequest(new { message = "Not boş olamaz veya 1 MB sınırını aşamaz." });
            var oldName = item.StorageName;
            await using (var old = await store.OpenAsync(oldName, cancellation)) { if (old is null) return Results.NotFound(); }
            var newName = Guid.NewGuid().ToString("N");
            try { await using var inputStream = new MemoryStream(bytes); await store.PutAsync(newName, inputStream, cancellation); item.StorageName = newName; item.Size = bytes.Length; await db.SaveChangesAsync(); }
            catch { await store.DeleteAsync(newName, CancellationToken.None); throw; }
            try { await store.DeleteAsync(oldName, CancellationToken.None); } catch (Exception) { /* Leave an orphan rather than lose the saved note. */ }
            return Results.NoContent();
        }).RequireAuthorization("AdminOnly");

        var trash = app.MapGroup("/api/trash").RequireAuthorization("AdminOnly");
        trash.MapGet("/", async (NotesDbContext db) => Results.Ok(new {
            courses = await db.Courses.Where(c => c.IsDeleted).OrderBy(c => c.Name).Select(c => new { c.Id, c.Name }).ToListAsync(),
            files = await (from f in db.Files join c in db.Courses on f.CourseId equals c.Id where f.IsDeleted && !c.IsDeleted select new { f.Id, f.Name, courseName = c.Name }).ToListAsync()
        }));
        trash.MapPost("/courses/{id:int}/restore", async (int id, NotesDbContext db) => { var item = await db.Courses.FirstOrDefaultAsync(c => c.Id == id && c.IsDeleted); if (item is null) return Results.NotFound(); item.IsDeleted = false; await db.SaveChangesAsync(); return Results.NoContent(); });
        trash.MapPost("/files/{id:int}/restore", async (int id, NotesDbContext db) => { var item = await db.Files.FirstOrDefaultAsync(f => f.Id == id && f.IsDeleted && db.Courses.Any(c => c.Id == f.CourseId && !c.IsDeleted)); if (item is null) return Results.NotFound(); item.IsDeleted = false; await db.SaveChangesAsync(); return Results.NoContent(); });
        trash.MapDelete("/files/{id:int}", async (int id, NotesDbContext db, IFileStore store) =>
        {
            var item = await db.Files.FirstOrDefaultAsync(f => f.Id == id && f.IsDeleted && db.Courses.Any(c => c.Id == f.CourseId && !c.IsDeleted));
            if (item is null) return Results.NotFound();
            db.Files.Remove(item); await db.SaveChangesAsync();
            try { await store.DeleteAsync(item.StorageName, CancellationToken.None); } catch (Exception) { /* Clean up orphaned blobs separately. */ }
            return Results.NoContent();
        });
        trash.MapDelete("/courses/{id:int}", async (int id, NotesDbContext db, IFileStore store) =>
        {
            var item = await db.Courses.FirstOrDefaultAsync(c => c.Id == id && c.IsDeleted); if (item is null) return Results.NotFound();
            var paths = await db.Files.Where(f => f.CourseId == id).Select(f => f.StorageName).ToListAsync();
            db.Courses.Remove(item); await db.SaveChangesAsync();
            foreach (var name in paths) { try { await store.DeleteAsync(name, CancellationToken.None); } catch (Exception) { /* Clean up orphaned blobs separately. */ } }
            return Results.NoContent();
        });
    }
    private record CourseInput(string? Name);
    private record TextInput(string? Text);
}
