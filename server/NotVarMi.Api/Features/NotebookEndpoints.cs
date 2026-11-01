using Microsoft.EntityFrameworkCore;
using NotVarMi.Api.Data;

namespace NotVarMi.Api.Features;

public static class NotebookEndpoints
{
    public static void MapNotebookEndpoints(this WebApplication app)
    {
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
            if (input.Html is null || input.Css is null || input.Javascript is null || input.Html.Length > 200_000 || input.Css.Length > 200_000 || input.Javascript.Length > 200_000)
                return Results.BadRequest(new { message = "Her içerik alanı en fazla 200.000 karakter olabilir." });
            var notebook = await db.Notebooks.FirstOrDefaultAsync(n => n.CourseId == courseId);
            if ((notebook?.Version ?? 0) != input.Version) return Results.Conflict(new { message = "Bu defter başka bir yerde değişti. Son sürümü açıp tekrar dene." });
            if (notebook is null) { notebook = new Notebook { CourseId = courseId }; db.Notebooks.Add(notebook); }
            notebook.Html = input.Html; notebook.Css = input.Css; notebook.Javascript = input.Javascript; notebook.Version++;
            try { await db.SaveChangesAsync(); }
            catch (DbUpdateConcurrencyException) { return Results.Conflict(new { message = "Bu defter başka bir yerde değişti. Son sürümü açıp tekrar dene." }); }
            catch (DbUpdateException e) when (e.InnerException is Microsoft.Data.Sqlite.SqliteException { SqliteErrorCode: 19 }) { return Results.Conflict(new { message = "Bu defter başka bir yerde değişti. Son sürümü açıp tekrar dene." }); }
            return Results.Ok(new { notebook.Version });
        }).RequireAuthorization("AdminOnly");
    }
    private record NotebookInput(string? Html, string? Css, string? Javascript, int Version);
}
