import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDb } from "./db/index.js";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth.routes.js";
dotenv.config({path: "./.env"});

const app = express();



app.use(cors({
  origin: "*",
}))

app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/auth', authRoutes);



app.get('/', (req,res)=>{
  res.send("Airtable OAuth Backend is running")
})

connectToDb()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT} `);
    });
  })
  .catch((err) => console.log(err));
