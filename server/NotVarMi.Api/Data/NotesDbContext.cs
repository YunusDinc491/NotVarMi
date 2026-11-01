using Microsoft.EntityFrameworkCore;

namespace NotVarMi.Api.Data;

public sealed class NotesDbContext(DbContextOptions<NotesDbContext> options) : DbContext(options)
{
    public DbSet<Course> Courses => Set<Course>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Course>().Property(c => c.Name).HasMaxLength(100).IsRequired();
        modelBuilder.Entity<Course>().HasIndex(c => c.Name).IsUnique();
    }
}

public sealed class Course
{
    public int Id { get; set; }
    public string Name { get; set; } = "";
}
