using Microsoft.EntityFrameworkCore;

namespace NotVarMi.Api.Data;

public static class PostgresBootstrap
{
    // EnsureCreated checks every schema in the database, including unrelated service tables.
    // Create only our own schema when none of our tables exist; never modify partial/existing tables.
    public static void Initialize(NotesDbContext db, bool seedExamples)
    {
        using var transaction = db.Database.BeginTransaction();
        db.Database.ExecuteSqlRaw("SELECT pg_advisory_xact_lock(718093546203)");
        var count = db.Database.SqlQueryRaw<int>("""
            SELECT COUNT(*)::int AS "Value"
            FROM pg_catalog.pg_class c
            JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
            WHERE n.nspname = 'notvarmi'
              AND c.relname IN ('Courses', 'Files', 'Notebooks', 'DataProtectionKeys')
              AND c.relkind IN ('r', 'p', 'v', 'm', 'f')
            """).Single();
        if (count == 0)
        {
            db.Database.ExecuteSqlRaw(db.Database.GenerateCreateScript());
            if (seedExamples)
            {
                db.Courses.AddRange(new Course { Name = "Heat Transfer" }, new Course { Name = "Fluid Mechanics" });
                db.SaveChanges();
            }
        }
        else if (count != 4)
        {
            throw new InvalidOperationException("NotVarMı veritabanı şeması eksik. Mevcut verileri korumak için otomatik değişiklik yapılmadı.");
        }
        transaction.Commit();
    }
}
