using System.IO.Compression;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using NotVarMi.Api.Data;
using NotVarMi.Api.Storage;

namespace NotVarMi.Api.Features;

public static class BackupEndpoints
{
    public static void MapBackupEndpoints(this WebApplication app)
    {
        app.MapGet("/api/backup", async (NotesDbContext db, IFileStore store, HttpContext context, CancellationToken cancellation) =>
        {
            var courses = await db.Courses.AsNoTracking().OrderBy(c => c.Id).ToListAsync(cancellation);
            var notebooks = await db.Notebooks.AsNoTracking().OrderBy(n => n.CourseId).ToListAsync(cancellation);
            var files = await db.Files.AsNoTracking().OrderBy(f => f.Id).ToListAsync(cancellation);
            foreach (var file in files)
            {
                await using var existing = await store.OpenAsync(file.StorageName, cancellation);
                if (existing is null) return Results.Problem($"Yedeklenemeyen dosya kimliği: {file.Id}", statusCode: 500);
            }
            context.Response.Headers.CacheControl = "no-store";
            return Results.Stream(async output =>
            {
                using var adapter = new AsyncResponseStream(output);
                using var zip = new ZipArchive(adapter, ZipArchiveMode.Create, leaveOpen: true);
                var metadata = zip.CreateEntry("notvarmi-veriler.json", CompressionLevel.Optimal);
                await using (var target = metadata.Open())
                    await JsonSerializer.SerializeAsync(target, new { format = "NotVarMi", version = 1, exportedAt = DateTime.UtcNow, courses, notebooks, files }, cancellationToken: cancellation);
                foreach (var file in files)
                {
                    await using var source = await store.OpenAsync(file.StorageName, cancellation)
                        ?? throw new IOException($"Yedeklenemeyen dosya kimliği: {file.Id}");
                    var entry = zip.CreateEntry($"dosyalar/{file.StorageName}", CompressionLevel.NoCompression);
                    await using var target = entry.Open();
                    await source.CopyToAsync(target, cancellation);
                }
            }, "application/zip", $"notvarmi-yedek-{DateTime.UtcNow:yyyy-MM-dd-HHmm}.zip");
        }).RequireAuthorization("AdminOnly");
    }
}

// ZipArchive writes its central directory synchronously; Kestrel response streams do not permit sync writes.
file sealed class AsyncResponseStream(Stream inner) : Stream
{
    public override bool CanRead => false;
    public override bool CanSeek => false;
    public override bool CanWrite => true;
    public override long Length => throw new NotSupportedException();
    public override long Position { get => throw new NotSupportedException(); set => throw new NotSupportedException(); }
    public override void Flush() => inner.FlushAsync().GetAwaiter().GetResult();
    public override Task FlushAsync(CancellationToken cancellationToken) => inner.FlushAsync(cancellationToken);
    public override void Write(byte[] buffer, int offset, int count) => inner.WriteAsync(buffer.AsMemory(offset, count)).AsTask().GetAwaiter().GetResult();
    public override void Write(ReadOnlySpan<byte> buffer) => Write(buffer.ToArray(), 0, buffer.Length);
    public override ValueTask WriteAsync(ReadOnlyMemory<byte> buffer, CancellationToken cancellationToken = default) => inner.WriteAsync(buffer, cancellationToken);
    public override Task WriteAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken) => inner.WriteAsync(buffer.AsMemory(offset, count), cancellationToken).AsTask();
    public override int Read(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    public override long Seek(long offset, SeekOrigin origin) => throw new NotSupportedException();
    public override void SetLength(long value) => throw new NotSupportedException();
}
