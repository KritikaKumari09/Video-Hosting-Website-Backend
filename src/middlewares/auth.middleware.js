import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";
// whenever we create middleware like below we also use next 
export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    // in mobile applicaiton token not there in that case we will get token using  authorization header . writtn above code to get token either through cookie for website or header for mobile application
        if(!token){
            // if still no token got then throw an error
            throw new ApiError(401, "Unauthorized request")
        }
        const decodedToken=jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        // The extracted token is verified using the secret key (process.env.ACCESS_TOKEN_SECRET).
        //  The jwt.verify method decodes the token if it is valid.



        const user=await User.findById(decodedToken?._id).select("-password -refreshToken")
        // The user's ID (_id) from the decoded token is used to find the user in the database.
        // select("-password -refreshToken"): Excludes the password and refreshToken fields from the retrieved user object for security reasons.
        
        if(!user){
            throw new ApiError(401, "Invalid Access Token")
        }
        req.user=user;// here I have access to req . now i have added object named 'user' to req using 'req.user' and have given it access to 'user' object we created in abovel lines thorugh req.user =user-> user at rhs is the object we created upstairs     
        next()// snce middleware injected before method this next() means move to the next middleware(if more mdidlewares there)  or to the next method
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }
})