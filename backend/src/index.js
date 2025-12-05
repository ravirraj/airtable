import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectToDb } from "./db/index.js";

dotenv.config({path: "./.env"});

const app = express();


app.get('/', (req,res)=>{
    return res.json("Home")
})

connectToDb()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is running on port ${process.env.PORT} `);
    });
  })
  .catch((err) => console.log(err));
