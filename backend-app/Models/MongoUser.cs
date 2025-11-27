using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace backend_app.Models
{
    public class MongoUser
    {
        [BsonId]
        [BsonRepresentation(BsonType.Int32)]
        public int Id { get; set; }

        public string FullName { get; set; }
    }
}