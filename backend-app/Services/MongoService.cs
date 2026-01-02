using backend_app.Models;
using MongoDB.Driver;
using MongoDB.Driver.GridFS;

namespace backend_app.Services
{
    public class MongoService
    {
        private readonly IMongoDatabase _db;
        private readonly GridFSBucket _bucket;

        public IMongoCollection<ProjectDoc> Projects => _db.GetCollection<ProjectDoc>("projects");
        public IMongoCollection<ProjectDoc> CutProjects => _db.GetCollection<ProjectDoc>("cut_projects");
        public IMongoCollection<MongoUser> MongoUsers => _db.GetCollection<MongoUser>("users");
        public MongoService(IConfiguration cfg)
        {
            var conn = cfg["MongoSettings:ConnectionString"] ?? "mongodb://localhost:27017";
            var dbName = cfg["MongoSettings:DatabaseName"] ?? "Project3DMachines";
            var client = new MongoClient(conn);
            _db = client.GetDatabase(dbName);
            _bucket = new GridFSBucket(_db);
        }

        public async Task<(string fileId, string fileName)> UploadFileAsync(Stream stream, string fileName, bool isCutting = false)
        {
            var printAllowed = new[] { ".stl", ".obj", ".vrml", ".wrl", ".3mf" };
            var cutAllowed = new[] { ".dxf", ".svg", ".ai", ".pdf" };
            
            var extension = Path.GetExtension(fileName).ToLowerInvariant();
            var allowed = isCutting ? cutAllowed : printAllowed;

            if (!allowed.Contains(extension))
                throw new Exception($"Invalid file type for {(isCutting ? "cutting" : "printing")}");

            var fileId = await _bucket.UploadFromStreamAsync(fileName, stream);
            return (fileId.ToString(), fileName);
        }

        public async Task<(Stream stream, string fileName)> DownloadProjectFileAsync(string fileId)
        {
            var oid = MongoDB.Bson.ObjectId.Parse(fileId);
            var stream = await _bucket.OpenDownloadStreamAsync(oid);
            return (stream, stream.FileInfo.Filename);
        }

        public async Task DeleteFileAsync(string fileId)
        {
            if (string.IsNullOrEmpty(fileId)) return;
            try
            {
                var oid = MongoDB.Bson.ObjectId.Parse(fileId);
                await _bucket.DeleteAsync(oid);
            }
            catch
            {
                // nuk hedh error nëse file nuk ekziston
            }
        }

        public async Task DeleteProjectAsync(string id, bool isCutting = false)
        {
            var collection = isCutting ? CutProjects : Projects;
            var project = await collection.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (project == null) return;

            await DeleteFileAsync(project.FileId);
            await collection.DeleteOneAsync(x => x.Id == id);
        }
    }
}