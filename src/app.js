import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"
const app= express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials:true
}))
// app.use(cors(...)):

// This line is using the cors middleware in an Express application.
//  The cors middleware is responsible for enabling CORS, which allows your application to accept requests from different origins.

app.use(express.json({limit:"16kb"}))// accept data in json and form
app.use(express.urlencoded({extended:true, limit:"16kb"}))// accept url  
app.use(express.static("public"))// used to save some images, favicon if needed in public folder
app.use(cookieParser())
// Cookie parser middleware is a software component that parses cookies from incoming HTTP requests and makes them easily accessible in server-side applications. 
// It reads the Cookie header of the request, parses the cookie string into a more convenient format (such as a JavaScript object), and attaches it to the request object for further use by the application.



// routes import 
// since router export was default we changed its name to userRouter from its original name router  
import userRouter from "./routes/user.routes.js"


//routes declaration
app.use("/api/v1/users",userRouter)// here we are not using app.get()
// the final route will be after activating userRouter
// http://localhost:8000/api/v1/users/register
export {app}