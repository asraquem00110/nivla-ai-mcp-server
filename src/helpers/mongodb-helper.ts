export class MongoDBHelper {
  static generateURI = () => {
    const database = process.env.MONGODB_DB;
    const uri = "mongodb://localhost:27017?directConnection=true";

    return {
      uri,
      database,
    };
  };
}
