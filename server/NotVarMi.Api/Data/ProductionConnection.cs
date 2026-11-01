using Npgsql;

namespace NotVarMi.Api.Data;

public static class ProductionConnection
{
    public static string Normalize(string value)
    {
        NpgsqlConnectionStringBuilder builder;
        if (Uri.TryCreate(value, UriKind.Absolute, out var uri) && (uri.Scheme == "postgres" || uri.Scheme == "postgresql"))
        {
            var parts = uri.UserInfo.Split(':', 2);
            if (parts.Length != 2 || string.IsNullOrWhiteSpace(uri.Host) || uri.AbsolutePath.Length < 2)
                throw new InvalidOperationException("PostgreSQL bağlantı adresi geçersiz.");
            builder = new NpgsqlConnectionStringBuilder
            {
                Host = uri.Host,
                Port = uri.IsDefaultPort ? 5432 : uri.Port,
                Username = Uri.UnescapeDataString(parts[0]),
                Password = Uri.UnescapeDataString(parts[1]),
                Database = Uri.UnescapeDataString(uri.AbsolutePath.TrimStart('/'))
            };
        }
        else builder = new NpgsqlConnectionStringBuilder(value);
        // A public database connection must verify the server certificate.
        builder.SslMode = SslMode.VerifyFull;
        return builder.ConnectionString;
    }
}
