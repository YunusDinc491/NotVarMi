using System.IO.Compression;
using System.Text.Json;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using NotVarMi.Api.Data;
using NotVarMi.Api.Storage;

namespace NotVarMi.Api.Features;

// Offline, non-destructive import into a dedicated empty database. Stop the web service first.
public static partial class BackupRestore
{
    private const long MaxFileSize = 95L * 1024 * 1024;
    [GeneratedRegex("^[a-f0-9]{32}$")]
    private static partial Regex StorageKey();
    private static readonly HashSet<string> AllowedTypes = new(StringComparer.Ordinal) { "application/pdf", "image/png", "image/jpeg", "image/webp", "text/plain", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation" };
    private sealed record Manifest(string? Format, int Version, List<Course>? Courses, List<Notebook>? Notebooks, List<CourseFile>? Files);

    public static async Task RunAsync(string path, NotesDbContext db, IFileStore store, CancellationToken cancellation = default)
    {
        using var archive = ZipFile.OpenRead(path);
        var meta = archive.Entries.Where(e => e.FullName == "notvarmi-veriler.json").ToList();
        if (meta.Count != 1 || meta[0].Length > 20 * 1024 * 1024) throw new InvalidDataException("Yedek verisi eksik veya çok büyük.");
        Manifest? manifest;
        await using (var input = meta[0].Open()) manifest = await JsonSerializer.DeserializeAsync<Manifest>(input, new JsonSerializerOptions(JsonSerializerDefaults.Web), cancellation);
        if (manifest?.Format != "NotVarMi" || manifest.Version != 1 || manifest.Courses is null || manifest.Notebooks is null || manifest.Files is null)
            throw new InvalidDataException("Yedek biçimi desteklenmiyor.");
        if (manifest.Courses.Count > 10000 || manifest.Files.Count > 10000 || manifest.Notebooks.Count > 10000) throw new InvalidDataException("Yedekte çok fazla kayıt var.");
        var ids = new HashSet<int>(); var names = new HashSet<string>(StringComparer.Ordinal);
        foreach (var course in manifest.Courses)
            if (!ids.Add(course.Id) || string.IsNullOrWhiteSpace(course.Name) || course.Name.Length > 100 || !names.Add(course.Name) || (course.Instructor?.Length ?? 0) > 100 || (course.Instructor?.Any(char.IsControl) ?? false)) throw new InvalidDataException("Ders bilgileri geçersiz veya yineleniyor.");
        var notebookIds = new HashSet<int>();
        foreach (var notebook in manifest.Notebooks)
            if (!ids.Contains(notebook.CourseId) || !notebookIds.Add(notebook.CourseId) || notebook.Html is null || notebook.Css is null || notebook.Javascript is null || notebook.Html.Length > 200000 || notebook.Css.Length > 200000 || notebook.Javascript.Length > 200000 || notebook.Version < 0) throw new InvalidDataException("Defter bilgileri geçersiz.");
        var fileIds = new HashSet<int>(); var fileKeys = new HashSet<string>(StringComparer.Ordinal);
        foreach (var file in manifest.Files)
        {
            if (!ids.Contains(file.CourseId) || !fileIds.Add(file.Id) || file.StorageName is null || !StorageKey().IsMatch(file.StorageName) || !fileKeys.Add(file.StorageName) || string.IsNullOrWhiteSpace(file.Name) || file.Name.Length > 200 || file.Name.Any(c => char.IsControl(c) || c is '/' or '\\') || file.ContentType is null || !AllowedTypes.Contains(file.ContentType) || file.Size <= 0 || file.Size > MaxFileSize) throw new InvalidDataException("Dosya bilgileri geçersiz.");
            var entries = archive.Entries.Where(e => e.FullName == $"dosyalar/{file.StorageName}").ToList();
            if (entries.Count != 1 || entries[0].Length != file.Size) throw new InvalidDataException("Yedekte bir dosya eksik veya boyutu uyuşmuyor.");
        }
        if (db.Database.IsNpgsql()) PostgresBootstrap.Initialize(db, seedExamples: false);
        else await db.Database.EnsureCreatedAsync(cancellation);
        await using var transaction = await db.Database.BeginTransactionAsync(cancellation);
        if (await db.Courses.AnyAsync(cancellation) || await db.Files.AnyAsync(cancellation) || await db.Notebooks.AnyAsync(cancellation))
            throw new InvalidOperationException("Hedef veritabanı boş değil; hiçbir veri değiştirilmedi.");
        var map = new Dictionary<int, int>();
        foreach (var source in manifest.Courses)
        {
            var target = new Course { Name = source.Name, Instructor = source.Instructor ?? "", IsDeleted = source.IsDeleted };
            db.Courses.Add(target); await db.SaveChangesAsync(cancellation); map.Add(source.Id, target.Id);
        }
        foreach (var source in manifest.Notebooks)
            db.Notebooks.Add(new Notebook { CourseId = map[source.CourseId], Html = source.Html, Css = source.Css, Javascript = source.Javascript, Version = source.Version });
        foreach (var source in manifest.Files)
        {
            var targetKey = Guid.NewGuid().ToString("N");
            // S3 requires a seekable stream for a single-object upload; temporary data is removed in finally.
            var temporary = Path.GetTempFileName();
            try
            {
                await using (var from = archive.GetEntry($"dosyalar/{source.StorageName}")!.Open())
                await using (var to = new FileStream(temporary, FileMode.Create, FileAccess.Write, FileShare.None))
                {
                    var buffer = new byte[81920]; long total = 0; int read;
                    while ((read = await from.ReadAsync(buffer, cancellation)) != 0)
                    {
                        total += read;
                        if (total > source.Size) throw new InvalidDataException("Dosya boyutu yedek bilgisiyle uyuşmuyor.");
                        await to.WriteAsync(buffer.AsMemory(0, read), cancellation);
                    }
                    if (total != source.Size) throw new InvalidDataException("Dosya boyutu yedek bilgisiyle uyuşmuyor.");
                }
                await using (var from = File.OpenRead(temporary)) await store.PutAsync(targetKey, from, cancellation);
            }
            finally { File.Delete(temporary); }
            db.Files.Add(new CourseFile { CourseId = map[source.CourseId], Name = source.Name, StorageName = targetKey, ContentType = source.ContentType, Size = source.Size, CreatedAt = DateTime.SpecifyKind(source.CreatedAt, DateTimeKind.Utc), IsDeleted = source.IsDeleted, IsContent = source.IsContent });
        }
        await db.SaveChangesAsync(cancellation);
        // A lost connection during commit has an unknown outcome; never delete uploaded objects here.
        await transaction.CommitAsync(cancellation);
    }
}
