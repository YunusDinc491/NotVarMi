using Microsoft.EntityFrameworkCore;

namespace NotVarMi.Api.Data;

public sealed class NotesDbContext(DbContextOptions<NotesDbContext> options) : DbContext(options)
{
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CourseFile> Files => Set<CourseFile>();
    public DbSet<Notebook> Notebooks => Set<Notebook>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Course>().Property(c => c.Name).HasMaxLength(100).IsRequired();
        modelBuilder.Entity<Course>().HasIndex(c => c.Name).IsUnique();
        modelBuilder.Entity<CourseFile>().HasOne<Course>().WithMany().HasForeignKey(f => f.CourseId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Notebook>().HasKey(n => n.CourseId);
        modelBuilder.Entity<Notebook>().HasOne<Course>().WithOne().HasForeignKey<Notebook>(n => n.CourseId).OnDelete(DeleteBehavior.Cascade);
        modelBuilder.Entity<Notebook>().Property(n => n.Version).IsConcurrencyToken();
    }
}

public sealed class Notebook
{
    public int CourseId { get; set; }
    public string Html { get; set; } = "";
    public string Css { get; set; } = "";
    public string Javascript { get; set; } = "";
    public int Version { get; set; }
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
