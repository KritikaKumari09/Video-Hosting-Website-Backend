// it is a higher order order function that accepts function as argument and returns functtion
const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{ // return statement important or elese it won't return func and therefor error while running
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=> next(err))
    }

}

export {asyncHandler}
// The provided code defines an asyncHandler function, which is a higher-order function designed to handle 
// asynchronous operations in an Express application. It ensures that any errors occurring in 
// the asynchronous route handlers are properly caught and passed to the next middleware in the stack, typically 
// an error-handling middleware.

// e primary purpose of asyncHandler is to streamline error handling in asynchronous route handlers.
//  Without it, you would need to wrap each async route handler in a try-catch block and manually call next(err) in 
//  case of an error. asyncHandler simplifies this by automatically catching any errors and forwarding them to the
//   next middleware.










// try catch way below for above operations
/* const asyncHandler=(fn)=> async(req,res,next)=>{
    try{
        await fn(req,res,next)
    } catch(error){
        res.status(err.code|| 500).json({
            success:false,
            message:err.message
        })
    }
} */

