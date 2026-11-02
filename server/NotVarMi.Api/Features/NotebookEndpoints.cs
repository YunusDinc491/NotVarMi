using Microsoft.EntityFrameworkCore;
using NotVarMi.Api.Data;

namespace NotVarMi.Api.Features;

public static class NotebookEndpoints
{
    public static void MapNotebookEndpoints(this WebApplication app)
    {
        var courseBooks = app.MapGroup("/api/courses/{courseId:int}/notebooks").RequireAuthorization();
        courseBooks.MapGet("/", async (int courseId, NotesDbContext db) =>
        {
            var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == courseId && !c.IsDeleted);
            if (course is null) return Results.NotFound();
            var result = new List<object>();
            var legacy = await db.Notebooks.AsNoTracking().FirstOrDefaultAsync(n => n.CourseId == courseId);
            if (legacy is not null) result.Add(new { id = 0, name = "Defterim", legacy.Html, legacy.Css, legacy.Javascript, legacy.Version });
            var pages = await db.CourseNotebooks.AsNoTracking().Where(n => n.CourseId == courseId).OrderBy(n => n.Id)
                .Select(n => new { id = n.Id, name = n.Name, n.Html, n.Css, n.Javascript, n.Version }).ToListAsync();
            result.AddRange(pages);
            return Results.Ok(result);
        });
        courseBooks.MapPost("/", async (int courseId, CourseNotebookInput input, NotesDbContext db) =>
        {
            var name = input.Name?.Trim();
            if (string.IsNullOrWhiteSpace(name) || name.Length > 150) return Results.BadRequest(new { message = "Defter adı 1 ile 150 karakter arasında olmalı." });
            if (!await db.Courses.AnyAsync(c => c.Id == courseId && !c.IsDeleted)) return Results.NotFound();
            var notebook = new CourseNotebook { CourseId = courseId, Name = name };
            db.CourseNotebooks.Add(notebook); await db.SaveChangesAsync();
            return Results.Created($"/api/courses/{courseId}/notebooks/{notebook.Id}", new { id = notebook.Id, name = notebook.Name, notebook.Html, notebook.Css, notebook.Javascript, notebook.Version });
        }).RequireAuthorization("AdminOnly");
        courseBooks.MapGet("/{notebookId:int}", async (int courseId, int notebookId, NotesDbContext db) =>
        {
            var notebook = await db.CourseNotebooks.AsNoTracking().FirstOrDefaultAsync(n => n.Id == notebookId && n.CourseId == courseId);
            return notebook is null ? Results.NotFound() : Results.Ok(new { id = notebook.Id, name = notebook.Name, notebook.Html, notebook.Css, notebook.Javascript, notebook.Version });
        });
        courseBooks.MapPut("/{notebookId:int}", async (int courseId, int notebookId, NotebookInput input, NotesDbContext db) =>
        {
            var notebook = await db.CourseNotebooks.FirstOrDefaultAsync(n => n.Id == notebookId && n.CourseId == courseId);
            if (notebook is null) return Results.NotFound();
            if (!Valid(input)) return Results.BadRequest(new { message = "Her içerik alanı en fazla 1.000.000 karakter olabilir." });
            if (notebook.Version != input.Version) return Results.Conflict(new { message = "Bu defter başka bir yerde değişti. Son sürümü açıp tekrar dene." });
            notebook.Html = input.Html!; notebook.Css = input.Css!; notebook.Javascript = input.Javascript!; notebook.Version++;
            try { await db.SaveChangesAsync(); } catch (DbUpdateConcurrencyException) { return Results.Conflict(new { message = "Bu defter başka bir yerde değişti. Son sürümü açıp tekrar dene." }); }
            return Results.Ok(new { notebook.Version });
        }).RequireAuthorization("AdminOnly");
        courseBooks.MapDelete("/{notebookId:int}", async (int courseId, int notebookId, NotesDbContext db) =>
        {
            if (notebookId == 0)
            {
                var legacy = await db.Notebooks.FirstOrDefaultAsync(n => n.CourseId == courseId && db.Courses.Any(c => c.Id == courseId && !c.IsDeleted));
                if (legacy is null) return Results.NotFound();
                db.Notebooks.Remove(legacy); await db.SaveChangesAsync(); return Results.NoContent();
            }
            var notebook = await db.CourseNotebooks.FirstOrDefaultAsync(n => n.Id == notebookId && n.CourseId == courseId);
            if (notebook is null) return Results.NotFound();
            if (!await db.NotebookSeedSuppressions.AnyAsync(n => n.CourseId == courseId && n.Name == notebook.Name))
                db.NotebookSeedSuppressions.Add(new NotebookSeedSuppression { CourseId = courseId, Name = notebook.Name });
            db.CourseNotebooks.Remove(notebook); await db.SaveChangesAsync(); return Results.NoContent();
        }).RequireAuthorization("AdminOnly");

        var endpoints = app.MapGroup("/api/courses/{courseId:int}/notebook").RequireAuthorization();
        endpoints.MapGet("/", async (int courseId, NotesDbContext db) =>
        {
            var course = await db.Courses.FirstOrDefaultAsync(c => c.Id == courseId && !c.IsDeleted);
            if (course is null) return Results.NotFound();
            var notebook = await db.Notebooks.AsNoTracking().FirstOrDefaultAsync(n => n.CourseId == courseId) ?? NotebookExamples.ForCourse(course);
            return Results.Ok(new { notebook.Html, notebook.Css, notebook.Javascript, notebook.Version });
        });
        endpoints.MapPut("/", async (int courseId, NotebookInput input, NotesDbContext db) =>
        {
            if (!await db.Courses.AnyAsync(c => c.Id == courseId && !c.IsDeleted)) return Results.NotFound();
            if (!Valid(input))
                return Results.BadRequest(new { message = "Her içerik alanı en fazla 1.000.000 karakter olabilir." });
            var notebook = await db.Notebooks.FirstOrDefaultAsync(n => n.CourseId == courseId);
            if ((notebook?.Version ?? 0) != input.Version) return Results.Conflict(new { message = "Bu defter başka bir yerde değişti. Son sürümü açıp tekrar dene." });
            if (notebook is null) { notebook = new Notebook { CourseId = courseId }; db.Notebooks.Add(notebook); }
            notebook.Html = input.Html!; notebook.Css = input.Css!; notebook.Javascript = input.Javascript!; notebook.Version++;
            try { await db.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException) { return Results.Conflict(new { message = "Bu defter başka bir yerde değişti. Son sürümü açıp tekrar dene." }); }
            catch (DbUpdateException e) when (e.InnerException is Microsoft.Data.Sqlite.SqliteException { SqliteErrorCode: 19 }) { return Results.Conflict(new { message = "Bu defter başka bir yerde değişti. Son sürümü açıp tekrar dene." }); }
            return Results.Ok(new { notebook.Version });
        }).RequireAuthorization("AdminOnly");
    }
    private static bool Valid(NotebookInput input) => input.Html is not null && input.Css is not null && input.Javascript is not null && input.Html.Length <= 1_000_000 && input.Css.Length <= 1_000_000 && input.Javascript.Length <= 1_000_000;
    private record NotebookInput(string? Html, string? Css, string? Javascript, int Version);
    private record CourseNotebookInput(string? Name);
}
