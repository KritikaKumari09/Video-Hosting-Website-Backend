import { v2 as cloudinary } from "cloudinary";
import fs from "fs";
         
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// just like database , upload task is also complicated there can be some error
// therefore we use try and catch to handle errors.
// since its time consuming therefore we use async and uploader.upload() of cloudinary 
// also takes time therefore await
const uploadOnCloudinary= async(localFilePath)=>{
  try{
    if(!localFilePath) return null //if file path not found or did not exist return null
    // upload the file on cloudinary
    const response= await cloudinary.uploader.upload(localFilePath, {
      resource_type:"auto" // this means detect automatically whether it is image,video,audio etc
    })
    // in above resource_type is one of the properties , more properties can come , check the documentation 
    // file has been uploaded successfully
    // console.log("file is uploaded on cloudinary", response.url);
    fs.unlinkSync(localFilePath)// remove the locally saved temporary file as the
    // upload operation is now successful
    return response;
  }
  catch(error){
    fs.unlinkSync(localFilePath)// remove the locally saved temporary file as the
    // upload operation got failed
    return null;
  }
}

export {uploadOnCloudinary}