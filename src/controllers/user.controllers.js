import {asyncHandler} from "../utils/asyncHandler.js"; // writing extension also because if not written then it shows  an error
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

// creating this method which will be used to create refresh and access token while registering the user 
const generateAccessAndRefreshTokens= async(userId)=>{
    try{
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken// we save refreshToken that we generated in above step in database i.e. through user.refreshToken. here user = object
        await user.save({validateBeforeSave:false})///this line saves the refreshToekn in database
        // await because here saving info in db may take time
        //validateBeforeSave:false --> we used it because we are just saving one field here i.e. refreshToken and not other field but here password should also be there therefore we done validation at this point :false

        return {accessToken,refreshToken}
    }
    catch(error){
        throw new ApiError(500, "Something went wrong while generating refresh and access token")
    }
}


// registring the user
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
const existedUser=await User.findOne({ // since connecting with database takes time therefore await used
    $or: [{username}, {email}] // this line means check either username or email whether it existed before or not 
})
if(existedUser){
    throw new ApiError(409, "User with email or username already exists")
}

// below code for 4)
//express gives access to req.body and multer gives access to req.files
 const avatarLocalPath=req.files?.avatar[0]?.path;
//  const coverImageLocalPath=req.files?.coverImage[0]?.path;
let coverImageLocalPath;
if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
    //the above line of code means if req.files which is an object is there and req.files.coverImage is array and its length>0.
    // The Array.isArray() static method determines whether the passed value is an Array.
    coverImageLocalPath = req.files.coverImage[0].path;
} 
console.log(req.files)
// just to check what req.files returns
// req.files returns an object with avatar and coverImage being as key and their value an array comprising of some data
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
const user =await User.create({ // since connecting with database takes time therefore await used
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

// logging in user
const loginUser= asyncHandler(async(req,res)=>{
    // below is the algorithm for registering user :
    // 1) get data from req.body
    // 2) login the user either thorugh email or username
    // 3) find the user
    // 4)password check
    // 5) if password right then generate access and refresh token 
    // 6) then send these tokens through secure cookie

    // code for 1
    const {email,username,password}=req.body;// destructuring email , username and password key from req.body object
    if(!(username || email)){
        throw new ApiError(400, "username or email required")
    }

    // code for 2 and 3
    // finding user just through email
    // User.findOne({email})
    // finding user through both email or username depending on whatever is available
    const user= await User.findOne({ // since connecting with database takes time therefore await
        $or:[{username}, {email}] // $or is mongo db operator through we can check user either through email or username 
    })
    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    // code for 4
   const isPasswordValid =await user.isPasswordCorrect(password)
//    with isPasswordCorrect is used with user and not User because User is mongosse object therfore it has access to all func that are provided by mongoose like findOne() etc 
// on the otherhand the methods which we created like generateAccessToken,isPasswordCorrect etc are valid with our present user who is trying to log in whosw access we have via 'user' object which is receiving instance from db
//    password = user entered password whihc we got using destructuring from req.body object
   if(!isPasswordValid){
    throw new ApiError(401 ,"Invalid user credentials" )
   }

//    code for 5
const {accessToken,refreshToken}=await generateAccessAndRefreshTokens(user._id)// since it may take time since we are saving info in db in this method 
// we took the values using destructuring

//    code for 6
const loggedInUser= await User.findById(user._id).select("-password -refreshToken") // we created this new loggedInUser object because the user object we initially created had empty access and refresh token because we called generateAccessAndRefreshTokesn inabove line and user object was assigned both tokens in above line and not before.
// therefore the above createdo object has both tokens. by default every data field of object is selected therefore we -password and -refreshToken sinve we dont want thtis 
 
// while sending cookies we need to design some options which are basically an object
const options={
    httpOnly:true,
    secure:true
 } // this code means that cookie cannot be edited via front end but only thorugh server side

//  we are now returing a response
// since we have cookie parser middleware we can set as many cookies as we want using cookie()
 return res
 .status(200)
 .cookie("accessToken", accessToken,options)
 .cookie("refreshToken",refreshToken,options)
 .json(
    new ApiResponse(
        200, 
        {user:loggedInUser,accessToken,refreshToken},
        "User logged In Successfully"
    )
 )
})

//logging out user
const logoutUser= asyncHandler(async(req,res)=>{
    // we need to do mainly 2 things :
    // 1) clear the cookie 
    // 2)reset the refresh token
    // we will use authentication middleware
   
//    code for 2)
    await User.findByIdAndUpdate(req.user._id, { // finds user by parameter provided and updates 2nd parameter
        $set:{refreshToken: undefined} // $set is mongodb operator which updates key with value provided
    },
    {new : true} // beacuse of this in return the response which you will get will have new updated valeu of refreshToken i.e. undefined and if  not used it then we will get old value means it will get old value of refreshtoekn
)


// code for 1)
// copied options for cookie from login user. // why options used see in above loginUser code
const options={
    httpOnly:true,
    secure:true
 } 
//  because of cookie parser middleware installed we can directly use clearCookie()  
return res.status(200)
.clearCookie("accessToken", options)
.clearCookie("refreshToken",options)
.json(new ApiResponse(200, {}, "User logged out"))

})

// below code to refresh access token once it expires using refresh token which is saved in db
const refreshAccessToken= asyncHandler(async(req,res)=>{
    // below is the encoded refreshToken which is saved in incomingRefreshToken 
    const incomingRefreshToken= req.cookies.refreshToken || req.body.refreshToken
    // above code to access refreshToken  using cookies and if cookies not available(e.g. in mobile application ) then through req.body 
    if(incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request")
    }
    // it will be better if for below part you have try-catch statement
    try {
        const decodedToken= jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
        // verify funct takes parameter which is to be decoded as 1st argument and its secret key as 2nd argument
    
    
        // since while creating refresh token we used only user._id therfore we can use decoded refresh token to get user id and then get its info using User.findById()  
        const user=await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401 , "Refresh token is expired or used")
        }
        const options={
            httpOnly:true,
            secure:true
        }
        const {accessToken, newrefreshToken}=await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accesToken",accessToken,options)
        .cookie("refreshToken", refreshToken,options)
        .json(
            new ApiResponse(
                200, {accessToken,refreshToken:newrefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,errpr?.message || "Invalid refresh token" )
    }

})

export {registerUser , loginUser, logoutUser , refreshAccessToken}