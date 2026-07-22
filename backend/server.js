import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./src/app.js";

dotenv.config();
try {
  mongoose.connect(process.env.MONGO_URI).then(async () => {
    console.log("MongoDB Connected");
    
    // Automatically sync and drop any legacy indexes from older schemas
    // This prevents edge cases like the "Duplicate Assignment" error.
    const models = mongoose.modelNames();
    for (const modelName of models) {
      await mongoose.model(modelName).syncIndexes();
    }
    console.log("Database indexes synchronized.");
  });
}
catch(err){
  console.log("MongoDB connection error:", err);
}

app.listen(5000, () => console.log("Server running on port 5000"));
