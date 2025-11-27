using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace backend_app.Models
{
    [BsonIgnoreExtraElements]
    public class ProjectDoc
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string ModuleName { get; set; }
        public string FileName { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string FileId { get; set; }

        public string FileHash { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }

        public int DownloadCount { get; set; } = 0;
        public List<ProjectDownloadLog> Downloads { get; set; } = new();
    }

public class ProjectDownloadLog
    {
        [BsonElement("UserFullName")]
        public string UserFullName { get; set; }
        public DateTime DownloadedAt { get; set; } = DateTime.UtcNow;
    }
}