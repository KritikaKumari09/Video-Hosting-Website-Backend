import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
// whenever we create middleware like below we also use next 
export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    // in mobile applicaiton token not there in that case we will get token using  authorization header . writtn above code to get token either through cookie or header 
        if(!token){
            // if still no token got then throw an error
            throw new ApiError(401, "Unauthorized request")
        }
        const decodedToken=jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
        if(!user){
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user=user;// here I have access to req . now i have added object named 'user' to req using 'req.user' and have given it access to 'user' object we created in abovel lines thorugh req.user =user-> user at rhs is the object we created upstairs     
        next()// snce middleware injected before method this next() means move to the next middleware(if more mdidlewares there)  or to the next method
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})