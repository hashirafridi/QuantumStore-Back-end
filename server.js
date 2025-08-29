import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from "./index.js";

//// handling global uncaught exceptions
process.on("uncaughtException",err=>{
  console.log(err.name,err.message);
  console.log("UNCAUGHT EXCEPTION✨ Causing shuting down...");
    process.exit(1);
})
//// dotenv path for file
dotenv.config({ path: './config.env' });

//// connecting data base to our express
const DBLOCAL = process.env.DATABASE_LOCAL;
mongoose.connect(DBLOCAL).then(() => console.log('DB connection successful! FYP'));
//// listning 
const port = 8000;
const server = app.listen(port, () => {
    console.log(`listening ....   on ${port} `);
});
//// hnadling global unhandled ejected promises
process.on("unhandledRejection",err=>{
  console.log(err.name,err.message);
  console.log("UNHANDLED REJECTION ✨ Causing shuting down...");
  server.close(()=>{
    process.exit(1);
  });
})
  

  
