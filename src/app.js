import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app= express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(express.json({limit:"16kb"}))// accept data in json and form
app.use(express.urlencoded({extended:true, limit:"16kb"}))// accept url  
app.use(express.static("public"))// used to save some images, favicon if needed in public folder
app.use(cookieParser())



// routes import 
import userRouter from "./routes/user.routes.js"


//routes declaration
app.use("/api/v1/users",userRouter)// here we are not using app.get()
// the final route will be after activating userRouter
// http://localhost:8000/api/v1/users/register
export {app}