using Microsoft.EntityFrameworkCore;

namespace NotVarMi.Api.Data;

public sealed class NotesDbContext(DbContextOptions<NotesDbContext> options) : DbContext(options)
{
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CourseFile> Files => Set<CourseFile>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Course>().Property(c => c.Name).HasMaxLength(100).IsRequired();
        modelBuilder.Entity<Course>().HasIndex(c => c.Name).IsUnique();
        modelBuilder.Entity<CourseFile>().HasOne<Course>().WithMany().HasForeignKey(f => f.CourseId).OnDelete(DeleteBehavior.Cascade);
    }
}

public sealed class Course
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
    public bool IsDeleted { get; set; }
}

public sealed class CourseFile
{
    public int Id { get; set; }
    public int CourseId { get; set; }
    public string Name { get; set; } = "";
    public string StorageName { get; set; } = "";
    public string ContentType { get; set; } = "application/octet-stream";
    public long Size { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsDeleted { get; set; }
}
