import {asyncHandler} from "../utils/asyncHandler.js"; // writing extension also because if not written then it shows  an error
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser= asyncHandler(async (req , res) => {
  // below is the algorithm for registering user 

 //1)  get user details from frontend
//2)   validation- not empty
//3)  check if user already exist: can check using username,email
//4)  check for images, check for avatar
//5)  upload them to cloudinary
//6)  create user object- create entry in db
//7)  remove password and refresh token field from response
//8)  check for user creation
//9)  return response

// below code for  1)
const {fullName, email, username, password}=req.body;// destructuring of object returned by req.body
console.log("email:", email);


// below code for 2)
// below code is just for 1 data fullname to check if its empty or not
// we need to repeat this code n times to check for n datas.
// if(fullName===""){
//     throw new ApiError(400,"fullname is required")
// }
// better code for above to check for n data whether they are empty or not using 1 code
if([fullName,email,username,password].some((field)=> field?.trim()==="")){
    throw new ApiError(400, "All fields are required")

    // information about some functin
//     The some() method checks if any array elements pass a test (provided as a callback function).
// The some() method executes the callback function once for each array element.
// The some() method returns true (and stops) if the function returns true for one of the array elements.
// The some() method returns false if the function returns false for all of the array elements.
// The some() method does not execute the function for empty array elements.
// The some() method does not change the original array.

// information about trim method
// The trim() method removes whitespace from both sides of a string.
// The trim() method does not change the original string.

// When you use field?.trim(), you are saying:
// If field is not null or undefined, call the trim() method on it.
// If field is null or undefined, return undefined without attempting to call trim() (which would otherwise cause an error).
// Optional Chaining (?.):
// The optional chaining operator (?.) allows you to safely access properties and methods of an object that might be null or undefined.
// If the value before the ?. operator (field in this case) is null or undefined, the entire expression evaluates to undefined without causing an error.
} 

// below code for 3)
// User imported from user.models has direct access to database bracuse it wss created using mongoose.model(). It provides many func for use one of them being findOne 
const existedUser=User.findOne({
    $or: [{username}, {email}] // this line means check either username or email whether it existed before or not 
})
if(existedUser){
    throw new ApiError(409, "User with email or username already exists")
}

// below code for 4)
//express gives access to req.body and multer gives access to req.files
 const avatarLocalPath=req.files?.avatar[0]?.path;
 const coverImageLocalPath=req.files?.coverImage[0]?.path;
if(!avatarLocalPath){
    throw new ApiError(400 , "Avatar file is required")
}   

// below code for 5)
// since uploading to cloudinary takes timer therefore await used
// although we have async handler here still we used await because we intentionally want to stop execution of code until both files are not uplloaded to cloudinary 
const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage= await uploadOnCloudinary(coverImageLocalPath)

//since avatar is compulsory therefore below code
if (!avatar) {
    throw new ApiError(400, "Avatar file is required")
}

// below code for 6
//since database in different continent it takes time to send data to it and we may also get error.for error we have asyncHandler which will catch the error. but for time it will take we use await 
const user =User.create({
    fullName,
    avatar:avatar.url,
    coverImage: coverImage?.url || "",//in above code no problem since we will have avatar.url or else we have thrown an error up since avatar is compulsory
    // but coverImage is not compulsory therefore its possible that its url not there therfore above code using optional chaining . if url there then ok or else assign ""(emptu string)
    email,
    password,
    username:username.toLowerCase()// since we want to save username in lowercase in db 

})

// code for 7 & 8
const createdUser=await User.findById(user._id).select("-password -refreshToken")// it takes time therefore await.
// here first search by id and if its exist then remove password and refreshtoken for that user here in select() we use '-' with these names because by default all are selected hence - means we want to remove these  2 data
 if(!createdUser){
    throw new ApiError(500, "Something went wrong while registering the user")
 }

// below code for 9 we dont wantany random response to go but rather proper Api response to go therefore we use ApiResponse.js file in utils folder by importing {ApiResponse } 
// here we send json response
return res.status(201).json(
   new ApiResponse(200, createdUser, "User registered successfully") // we created new api resonspse object
//    status code =200  , data =createdUser and message ="User...successfully"
)

})
export {registerUser}