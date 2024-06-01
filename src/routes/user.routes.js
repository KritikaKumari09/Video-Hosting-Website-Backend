import { Router } from "express";
import { registerUser, loginUser, logoutUser, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controllers.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { refreshAccessToken } from "../controllers/user.controllers.js";
const router =Router()

//this upload which has come from multer gives us many options one of them being fields()  
// here we are accepting two files one avatar and other coverImage
// while making its frontend through react its name i.e. avatar and coverImage will aslo be same for connection between frontend and backend
router.route("/register").post(upload.fields([
    {name:"avatar", maxCount:1},
    {name:"coverImage", maxCount:1}
]),
    registerUser)// middlware comes just before the method:registerUser in this case is that method

    router.route("/login").post(loginUser) // post because we are taking the information
    // secured routes
    router.route("/logout").post(verifyJWT, logoutUser)
    router.route("/refresh-token").post(refreshAccessToken)
    router.route("/change-password").post(verifyJWT, changeCurrentPassword)
    // verifyJWT middleware used above. middleware used just before method
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/update-account").patch(verifyJWT, updateAccountDetails)
// in above we use patch and not post if post used then all details will be updated but we have to update only account details
router.route("/avatar").patch(verifyJWT, upload.single("avatar") , updateUserAvatar)
// above 2 middleware used one verifyJWT and other of multer upload.single()

router.route("/cover-image").patch(verifyJWT,upload.single("coverImage"), updateUserCoverImage)
router.route("/c/:username").get(verifyJWT,getUserChannelProfile)
// since in above we got info from and req.params and not req.body therefore used colon(:) and username its important to use colon
// we can name /channel/:username also but :username important
router.route("/c/:username").get(verifyJWT, getUserChannelProfile)
router.route("/history").get(verifyJWT, getWatchHistory)

export default router;