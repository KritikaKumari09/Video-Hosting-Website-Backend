import multer from "multer";

// here not much error therefore try and catch not required 
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp") // we change 2nd argument from the original code cop;ied from GithHub doc
    //   in its 2nd argu. we have to write folder name in which our files will be uploaded. we have created public/temp folder for this purpose only
    // therefore its name written there 
    },
    filename: function (req, file, cb) {
    //   here we deleted one more line from the original code because it was about changind the name of file using some math functions which can be done later in some other project
      cb(null, file.originalname)// here in its 2nd argumetn with file we have many properties associated. we r using originalname property
    //   here 2nd argument is the name with which file will saved locally
    // not good practice to use original name since if 5 files of same name uploaded then. still can be used since as soon it will uploaded we will upload it in cloudinary
    }
  })
  
  export const upload = multer({ storage, })