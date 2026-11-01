using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;

namespace NotVarMi.Api.Storage;

public interface IFileStore
{
    Task PutAsync(string name, Stream input, CancellationToken cancellationToken);
    Task<Stream?> OpenAsync(string name, CancellationToken cancellationToken);
    Task DeleteAsync(string name, CancellationToken cancellationToken);
}

public sealed class LocalFileStore(IConfiguration config, IWebHostEnvironment env) : IFileStore
{
    private string Root => config["FileStorage:Path"] ?? Path.Combine(env.ContentRootPath, ".uploads");
    public async Task PutAsync(string name, Stream input, CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(Root);
        var path = Path.Combine(Root, name);
        try { await using var output = new FileStream(path, FileMode.CreateNew, FileAccess.Write, FileShare.None); await input.CopyToAsync(output, cancellationToken); }
        catch { if (File.Exists(path)) File.Delete(path); throw; }
    }
    public Task<Stream?> OpenAsync(string name, CancellationToken cancellationToken)
    {
        var path = Path.Combine(Root, name);
        return Task.FromResult<Stream?>(File.Exists(path) ? File.OpenRead(path) : null);
    }
    public Task DeleteAsync(string name, CancellationToken cancellationToken)
    {
        File.Delete(Path.Combine(Root, name));
        return Task.CompletedTask;
    }
}

public sealed class R2FileStore : IFileStore, IDisposable
{
    private readonly IAmazonS3 client;
    private readonly string bucket;
    public R2FileStore(IConfiguration config)
    {
        var endpoint = config["R2:Endpoint"] ?? throw new InvalidOperationException("R2 endpoint gerekli.");
        var access = config["R2:AccessKeyId"] ?? throw new InvalidOperationException("R2 erişim anahtarı gerekli.");
        var secret = config["R2:SecretAccessKey"] ?? throw new InvalidOperationException("R2 gizli anahtarı gerekli.");
        bucket = config["R2:Bucket"] ?? throw new InvalidOperationException("R2 bucket adı gerekli.");
        if (!Uri.TryCreate(endpoint, UriKind.Absolute, out var uri) || uri.Scheme != Uri.UriSchemeHttps || !uri.Host.EndsWith(".r2.cloudflarestorage.com", StringComparison.OrdinalIgnoreCase))
            throw new InvalidOperationException("Geçerli bir HTTPS Cloudflare R2 endpoint gerekli.");
        client = new AmazonS3Client(new BasicAWSCredentials(access, secret), new AmazonS3Config { ServiceURL = endpoint, ForcePathStyle = true, AuthenticationRegion = "auto", RequestChecksumCalculation = RequestChecksumCalculation.WHEN_REQUIRED });
    }
    public async Task PutAsync(string name, Stream input, CancellationToken cancellationToken)
    {
        await client.PutObjectAsync(new PutObjectRequest { BucketName = bucket, Key = name, InputStream = input, AutoCloseStream = false, ContentType = "application/octet-stream", DisablePayloadSigning = true, DisableDefaultChecksumValidation = true }, cancellationToken);
    }
    public async Task<Stream?> OpenAsync(string name, CancellationToken cancellationToken)
    {
        try { var response = await client.GetObjectAsync(bucket, name, cancellationToken); return new ResponseStream(response); }
        catch (AmazonS3Exception e) when (e.StatusCode == System.Net.HttpStatusCode.NotFound) { return null; }
    }
    public async Task DeleteAsync(string name, CancellationToken cancellationToken) => await client.DeleteObjectAsync(bucket, name, cancellationToken);
    public void Dispose() => client.Dispose();
}

file sealed class ResponseStream(GetObjectResponse response) : Stream
{
    private Stream Inner => response.ResponseStream;
    public override bool CanRead => Inner.CanRead;
    public override bool CanSeek => Inner.CanSeek;
    public override bool CanWrite => false;
    public override long Length => Inner.Length;
    public override long Position { get => Inner.Position; set => Inner.Position = value; }
    public override int Read(byte[] buffer, int offset, int count) => Inner.Read(buffer, offset, count);
    public override ValueTask<int> ReadAsync(Memory<byte> buffer, CancellationToken cancellationToken = default) => Inner.ReadAsync(buffer, cancellationToken);
    public override Task<int> ReadAsync(byte[] buffer, int offset, int count, CancellationToken cancellationToken) => Inner.ReadAsync(buffer, offset, count, cancellationToken);
    public override long Seek(long offset, SeekOrigin origin) => Inner.Seek(offset, origin);
    public override void Flush() => Inner.Flush();
    public override void SetLength(long value) => throw new NotSupportedException();
    public override void Write(byte[] buffer, int offset, int count) => throw new NotSupportedException();
    protected override void Dispose(bool disposing) { if (disposing) response.Dispose(); base.Dispose(disposing); }
    public override ValueTask DisposeAsync() { response.Dispose(); GC.SuppressFinalize(this); return ValueTask.CompletedTask; }
}
