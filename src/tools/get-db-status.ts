import { MongoDBHelper } from "@/helpers/mongodb-helper";
import { MongoClient } from "mongodb";

interface GetDbStatusArgs {
  deposit: string;
}

export const getDbStatus = async ({ deposit }: GetDbStatusArgs) => {
  const { uri, database } = MongoDBHelper.generateURI();
  let client = null;

  try {
    client = new MongoClient(uri);
    await client.connect();
    const db = client.db(database);
    const depositRecordCollection = db.collection("deposit_records");
    console.log(deposit);
    const depositRecord = await depositRecordCollection.findOne({
      deposit_id: deposit,
    });

    console.log("DEPOSIT RECORD is:", depositRecord);
    return depositRecord;
  } catch (error) {
  } finally {
    if (client) {
      await client.close();
      console.log("Disconnected from MongoDB");
    }
  }
};
