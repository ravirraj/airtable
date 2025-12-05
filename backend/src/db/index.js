import mongoose from "mongoose";

export async function connectToDb() {
  try {
    const connectionDb = await mongoose.connect(
      `${process.env.MONGO_URI}/airbaseIntergration`
    );

    console.log(`connected to backend at ${connectionDb.connection.host}`);
  } catch (error) {
    console.log("error while connection to db", error);
    process.exit(1);
  }
}
