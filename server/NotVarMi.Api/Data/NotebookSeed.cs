namespace NotVarMi.Api.Data;

// Content/Notebooks altındaki hazır ders defterlerini ilgili derse ekler (her ders için tek, birleşik defter).
// Defter yönetici tarafından hiç düzenlenmediyse (Version == 0) dosyadaki yeni sürümle güncellenir;
// düzenlendiyse dokunulmaz, böylece arayüzden yapılan değişiklikler korunur.
public static class NotebookSeed
{
    private sealed record Item(string[] CourseNames, string Name, string File);

    private static readonly string[] HeatCourse = ["Heat Transfer", "Isı Transferi"];

    // Bir dersin tüm üniteleri tek defterde, sırayla birbirinin devamı olarak tutulur.
    private static readonly Item[] Items =
    [
        new(HeatCourse, "Isı Transferi Ders Notları", "heat-defter"),
    ];

    // Birleşik deftere taşınan eski ünite defterleri: hiç düzenlenmemişse (Version == 0) kaldırılır.
    private static readonly Item[] Retired =
    [
        new(HeatCourse, "Ünite 3 Ders Notu", ""),
        new(HeatCourse, "Ünite 4 Ders Notu", ""),
    ];

    public static void Apply(NotesDbContext db, string contentRoot)
    {
        var folder = Path.Combine(contentRoot, "Content", "Notebooks");
        foreach (var item in Items)
        {
            var paths = new[] { "html", "css", "js" }.Select(ext => Path.Combine(folder, $"{item.File}.{ext}")).ToArray();
            if (!paths.All(File.Exists)) continue;
            var course = db.Courses.FirstOrDefault(c => !c.IsDeleted && item.CourseNames.Contains(c.Name));
            if (course is null) continue;
            var (html, css, js) = (File.ReadAllText(paths[0]), File.ReadAllText(paths[1]), File.ReadAllText(paths[2]));
            var existing = db.CourseNotebooks.FirstOrDefault(n => n.CourseId == course.Id && n.Name == item.Name);
            if (existing is null)
                db.CourseNotebooks.Add(new CourseNotebook { CourseId = course.Id, Name = item.Name, Html = html, Css = css, Javascript = js });
            else if (existing.Version == 0 && (existing.Html != html || existing.Css != css || existing.Javascript != js))
            {
                existing.Html = html; existing.Css = css; existing.Javascript = js;
            }
        }
        foreach (var old in Retired)
        {
            var course = db.Courses.FirstOrDefault(c => !c.IsDeleted && old.CourseNames.Contains(c.Name));
            if (course is null) continue;
            var stale = db.CourseNotebooks.Where(n => n.CourseId == course.Id && n.Name == old.Name && n.Version == 0).ToList();
            db.CourseNotebooks.RemoveRange(stale);
        }
        db.SaveChanges();
    }
}
