using Microsoft.EntityFrameworkCore;

namespace NotVarMi.Api.Data;

// Upgrade the original EnsureCreated SQLite schema without deleting existing course data.
public static class DatabaseBootstrap
{
    public static void Initialize(NotesDbContext db)
    {
        var connection = db.Database.GetDbConnection();
        connection.Open();
        using var tx = connection.BeginTransaction();
        object? Scalar(string sql) { using var command = connection.CreateCommand(); command.Transaction = tx; command.CommandText = sql; return command.ExecuteScalar(); }
        void Execute(string sql) { using var command = connection.CreateCommand(); command.Transaction = tx; command.CommandText = sql; command.ExecuteNonQuery(); }
        var exists = Convert.ToInt64(Scalar("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='Courses'")) > 0;
        if (!exists)
            Execute("CREATE TABLE Courses (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, Name TEXT NOT NULL, IsDeleted INTEGER NOT NULL DEFAULT 0)");
        else if (Convert.ToInt64(Scalar("SELECT COUNT(*) FROM pragma_table_info('Courses') WHERE name='IsDeleted'")) == 0)
            Execute("ALTER TABLE Courses ADD COLUMN IsDeleted INTEGER NOT NULL DEFAULT 0");
        Execute("CREATE UNIQUE INDEX IF NOT EXISTS IX_Courses_Name ON Courses(Name)");
        Execute("CREATE TABLE IF NOT EXISTS Files (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, CourseId INTEGER NOT NULL, Name TEXT NOT NULL, StorageName TEXT NOT NULL, ContentType TEXT NOT NULL, Size INTEGER NOT NULL, CreatedAt TEXT NOT NULL, IsDeleted INTEGER NOT NULL DEFAULT 0, IsContent INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (CourseId) REFERENCES Courses(Id) ON DELETE CASCADE)");
        if (Convert.ToInt64(Scalar("SELECT COUNT(*) FROM pragma_table_info('Files') WHERE name='IsContent'")) == 0)
            Execute("ALTER TABLE Files ADD COLUMN IsContent INTEGER NOT NULL DEFAULT 0");
        Execute("CREATE INDEX IF NOT EXISTS IX_Files_CourseId ON Files(CourseId)");
        Execute("CREATE TABLE IF NOT EXISTS Notebooks (CourseId INTEGER NOT NULL PRIMARY KEY, Html TEXT NOT NULL, Css TEXT NOT NULL, Javascript TEXT NOT NULL, Version INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (CourseId) REFERENCES Courses(Id) ON DELETE CASCADE)");
        Execute("CREATE TABLE IF NOT EXISTS CourseNotebooks (Id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, CourseId INTEGER NOT NULL, Name TEXT NOT NULL, Html TEXT NOT NULL, Css TEXT NOT NULL, Javascript TEXT NOT NULL, Version INTEGER NOT NULL DEFAULT 0, FOREIGN KEY (CourseId) REFERENCES Courses(Id) ON DELETE CASCADE)");
        Execute("CREATE INDEX IF NOT EXISTS IX_CourseNotebooks_CourseId ON CourseNotebooks(CourseId)");
        if (!exists) Execute("INSERT INTO Courses (Name, IsDeleted) VALUES ('Heat Transfer', 0), ('Fluid Mechanics', 0)");
        tx.Commit();
        connection.Close();
    }
}
