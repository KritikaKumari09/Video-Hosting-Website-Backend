import {asyncHandler} from "../utils/asyncHandler.js"; // writing extension also because if not written then it shows  an error

const registerUser= asyncHandler(async (req , res) => {
    res.status(200).json({
        message:"ok"
    })
})

export {registerUser}