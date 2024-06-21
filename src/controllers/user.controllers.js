import {asyncHandler} from "../utils/asyncHandler.js"; // writing extension also because if not written then it shows  an error
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

// creating this method which will be used to create refresh and access token while registering the user 
const generateAccessAndRefreshTokens= async(userId)=>{
    try{
        const user=await User.findById(userId)
        const accessToken=user.generateAccessToken()
        const refreshToken=user.generateRefreshToken()
        user.refreshToken=refreshToken// we save refreshToken that we generated in above step in database i.e. through user.refreshToken. here user = object
        await user.save({validateBeforeSave:false})///this line saves the refreshToekn in database
        // await because here saving info in db may take time
        //validateBeforeSave:false --> we used it because we are just saving one field here i.e. 
        // refreshToken and not other field but here password should also be there therefore we done validation 
        // at this point :false
// The user object, with the new refresh token, is saved back to the database.
// { validateBeforeSave: false } is an option that disables validation checks before saving. 
// This can be useful if you only want to update a single field and don't need to revalidate the entire user object.



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
return res.status(201)  
// res.status(201): Sets the HTTP status code of the response to 201.
// 201 Created is the standard response for successful creation of a resource (e.g., a new user).
.json(
   new ApiResponse(200, createdUser, "User registered successfully") // we created new api resonspse object
//    status code =200  , data =createdUser and message ="User...successfully"
)
// .json(): This method sends a JSON response. The argument to json() is the data that will be sent as the
//  response body.

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
//  .cookie(): This method is provided by the Express.js response object (res). It sets a cookie in the HTTP 
// response header that will be sent to the client.
//  Parameters:
//  "accessToken" and "refreshToken": These are the names of the cookies being set. Each represents a token used 
// for authentication or authorization purposes.
//  accessToken and refreshToken: These are the actual values of the tokens generated by the server and passed 
// to the client.
//  options: This parameter is an object containing various options for the cookie, such as maxAge, expires, 
// secure, httpOnly, etc. These options control attributes of the cookie like its expiration time, security 
// settings, and accessibility.

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
    // 2)reset the refresh token i.e. remove it
    // we will use authentication middleware in user.routes.js for logout route we have used verifyJWT route
   
//    code for 2)
    await User.findByIdAndUpdate(req.user._id, { // finds user by parameter provided and updates 2nd parameter
        // $set:{refreshToken: undefined} // $set is mongodb operator which updates key with value provided
        // using above line sometimes it was running , sometimes it was not therefor we are using its better alternate at below
        $unset:{
            refreshToken:1 // this removes the field from document
            // whatever you want to remove pass the flag 1
        }
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
    if(!incomingRefreshToken){
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
        .cookie("refreshToken", newrefreshToken,options)
        .json(
            new ApiResponse(
                200, {accessToken,refreshToken:newrefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token" )
    }

})

// to change current password
const changeCurrentPassword =asyncHandler(async(req,res)=>{
    const {oldPassword , newPassword }=req.body

    const user = await User.findById(req.user?._id)
   const isPasswordCorrect=await user.isPasswordCorrect(oldPassword) // since we used async while declaring this method in user.models.js this means 
//    it will take some time therefore need to use await here
// isPasswordCorrect this is custom schema mehtod declared in uer.models.js
   if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid old password")
       }
       user.password = newPassword// this sets old password to new passwprd
       await user.save({validateBeforeSave:false})
       
       return res.status(200).json(new ApiResponse(200, {}, "Password changed successfully"))

})

const getCurrentUser= asyncHandler(async(req,res)=>{
    return res.status(200)
    .json(new ApiResponse(200 , req.user , "Current user fetched successfully"))
})

// for updating files we create different func and dont use this 
const updateAccountDetails= asyncHandler(async(req,res)=>{
    const {fullName, email}= req.body
    if(!fullName || !email){
        throw new ApiError(400 , "All fields are required")
    }
    const user = await User.findByIdAndUpdate(// whenever db is called await is important
        req.user?._id, 
        {
            $set :{ // set operator
                fullName:fullName,
                // sets the fullName in db[lhs] from fullName received from request(req.body) [rhs]   
                email:email
                // or
                //  fullName ,
                // email
                // there must be consistency
             } 
        } , 
        {new :true}
        // above means save the new changed data
        // { new: true } ensures that Mongoose returns the updated document rather than the original one.
        ).select("-password")
        // excludes the password field from the returned document for security reasons.


        return res
        .status(200)
        .json(new ApiResponse(200, user , "Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path // earlier while uplooadin we used files because we were allowing multiople files upload but here only file since no need of more than 1 file here
    if(!avatarLocalPath){
        throw new ApiError(400 , "Avatar file is missing")
    }


    // todo : delete old image - assignment-> create utility func and use it after image is avatar is updated to delete old image
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    if(!avatar.url){
        throw new ApiError(400 , "Error while uploading on avatar")

    }
 const user = await User.findByIdAndUpdate(
    req.user?._id, 
    {
        $set:{
            avatar:avatar.url
            // sets the avatar in db[lhs] from avater.url recieved from req.body[rhs]
        }
    }, {new:true}
 ).select("-password")

 return res
 .status(200)
 .json(
    new ApiResponse(200, user , "avatar updated successfully")
 )
})

const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path // earlier while uplooadin we used files because we were allowing multiople files upload but here only file since no need of more than 1 file here
    if(!coverImageLocalPath){
        throw new ApiError(400 , "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url){
        throw new ApiError(400 , "Error while uploading coverImage")

    }
 const user=await User.findByIdAndUpdate(
    req.user?._id, 
    {
        $set:{
            coverImage:coverImage.url
        }
    }, {new:true}
 ).select("-password")

 return res
 .status(200)
 .json(
    new ApiResponse(200, user , "cover image updated successfully")
 )
})



// aggregation pipeline used for below 2 methods

const getUserChannelProfile = asyncHandler(async(req,res)=>{
const {username}= req.params // we get username through req.paranm and not req.body 
// used destructuring in above
if(!username?.trim()){

// username?.trim() means:
// If username is not null or undefined, call the trim() method on it. This will return the trimmed version of the string.
// If username is null or undefined, the expression evaluates to undefined without throwing an error.
    throw new ApiError(400, "username is missing")
}
// aggregation pipeline used to calculate no. of subscribers for which we count no. of channel. note written in copy
// we have used total 5 pipelines here
const channel =await User.aggregate([
    // through below one document is filtered according to username(it given in lhs) as per username given in  rhs
    {
        $match:{
            username:username?.toLowerCase() // although if we are here means we have username but still  optional chaining '?.' can be done for safety purpose
        }
    },
    {
$lookup:{ // here $lookup looks for or search for specific document in a given model with given foreign field and compare it from local field of the model we are currently in  
    from: "subscriptions", // search from this model , presently we are at users model  .we brought this name from subscription.model.js . in db the name of model is changed to lowercase + plural form
    localField:"_id",// we are presently at users model and here we compare the field name id with foreign field name in subscriptios model
    foreignField:"channel",// in subscriptions model the id value of users model is saved in channel field 
    as:"subscribers" // we bring it as subscribers i.e. we will use this name to refer it 
}
    },
    {
        $lookup : {
            from:"subscriptions",
            localField:"_id",
            foreignField:"subscriber",
            as:"subscribedTo"
        }
    },
   {
    $addFields:{ // thorugh this we added 3 fields to origninal user object
     subscribersCount:{
        $size:"$subscribers" // it counts number of thtat documents which is returned as name  'subscribers' using $lookup operator in above line of codes
     },   
     channelsSubscribedToCount:{
        $size:"$subscribedTo" // it counts number of thtat documents which is returned as name  'subscriberedTo' using $lookup operator in above line of codes
     },
     isSubscribed:{
        $cond: { // this condition operator has 3 parameters if() ,then :evaluated if condition true , else : if conditoin false
            // here we just need to check that the documnet 'subscribers' which we have received in that i am there or not
            if:{$in:[req.user?._id , "$subscribers.subscriber"]}, // heres $subscrbers means in the field subscbribers we are talking about subscriber object because in subscription named obj only we have saved it in subscription.model.js
            then:true,
            else:false
        }
     }
    }
   },
   {
    $project:{ 
        //this pipeline is used so whatever is demanding the data i will not allow all data to pass because it will increase data traffic
        // but only the selected data to pass.
        // whatever data we want to pass in front of it we keep 1 
        fullName:1,
        username:1,
        subscribersCount:1,
        channelsSubscribedToCount:1,
        isSubscribed:1,
        avatar:1,
        coverImage:1,
        email:1


    }
   }
])
if(!channel?.length){
    throw new ApiError(404 , "channel does not exist")
}

return res
.status(200)
.json(
    new ApiResponse(200, channel[0], "User channel fetched successfully")
)
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)// this converts string id returned by req.user._id to ObjectId('String id') as stored in mongo db. here we need to explicitly convert in that way using mongoose
               
            }
        
    },
{
    // for understanding these clearly once refer this project model in eraser.io as shared in this proj gitHub link
    // we are inside users i.e. users is local and videos is foreign
    $lookup:{
        from:"videos", // we are searching the document from Video model but it is saveds as videos in mongo db
        localField:"watchHistory",// in our current user object i.e. user model name of field is "watchHistory" as saved in user model is user.models.js
        foreignField:"_id",// user model watchHistory data field should be equal to _id of video model  
        as:"watchHistory" ,// return this document wiht name watchHistory. we will access this document with this name only 
        // nested $lookup
        pipeline:[
            {
                // at this time wr are inside watchHistory document i.e. videos model therefore users is foreign here and videos local
              
                $lookup: {
                    from : "users",
                    localField:"owner",
                    foreignField:"_id",
                    as:"owner", // save this document with name owner
                    // nested project operator
                    pipeline:[{
                        // at this time we are inside owners document i.e. user model
                       $project:{
                        fullName:1,
                        username:1,
                        avatar:1
                       } 
                    }]
                }
            },
            // below code written for making front end devlopers work easy i.e. in place of tackling array of objects they just need to handle an object
            {
                $addFields:{
                    owner:{ // we name it owner so existing owner field is over written
                        $first:"$owner" // this means first element of owner field which is an array of object i.e. it returns an object which is this array 1st element  
                        // $owner means owner field  
                    }
                }
            }
        ]

    }

}
])

return res
.status(200)
.json(
    new ApiResponse(
    200,
    user[0].watchHistory,
    "watch history fetched successfully "
))
})

export {
    registerUser,
     loginUser, 
     logoutUser ,
      refreshAccessToken,
    changeCurrentPassword,
getCurrentUser,
updateAccountDetails,
updateUserAvatar,
updateUserCoverImage,
getUserChannelProfile,
getWatchHistory
}