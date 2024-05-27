import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middleware.js"
const router =Router()

//this upload which has come from multer gives us many options one of them being fields()  
// here we are accepting two files one avatar and other coverImage
// while making its frontend through react its name i.e. avatar and coverImage will aslo be same for connection between frontend and backend
router.route("/register").post(upload.fields([
    {name:"avatar", maxCount:1},
    {name:"coverImage", maxCount:1}
]),
    registerUser)// middlware comes just before the method:registerUser in this case is that method

export default router;