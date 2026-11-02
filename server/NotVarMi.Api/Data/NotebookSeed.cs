namespace NotVarMi.Api.Data;

// Content/Notebooks altındaki hazır ders defterlerini ilgili derse ekler.
// Defter yönetici tarafından hiç düzenlenmediyse (Version == 0) dosyadaki yeni sürümle güncellenir;
// düzenlendiyse dokunulmaz, böylece arayüzden yapılan değişiklikler korunur.
public static class NotebookSeed
{
    private sealed record Item(string[] CourseNames, string Name, string File);

    private static readonly Item[] Items =
    [
        new(["Heat Transfer", "Isı Transferi"], "Ünite 3 Ders Notu", "heat-unite-3"),
        new(["Heat Transfer", "Isı Transferi"], "Ünite 4 Ders Notu", "heat-unite-4"),
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
        db.SaveChanges();
    }
}
