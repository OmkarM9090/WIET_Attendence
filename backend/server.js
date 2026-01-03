import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./src/app.js";

dotenv.config();
try{
  mongoose.connect(process.env.MONGO_URI).then(() =>
  console.log("MongoDB Connected")
);
}
catch(err){
  console.log("MongoDB connection error:", err);
}

app.listen(5000, () => console.log("Server running on port 5000"));
