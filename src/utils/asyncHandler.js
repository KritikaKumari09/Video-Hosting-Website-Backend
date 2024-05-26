// it is a higher order order function that accepts function as argument and returns functtion
const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{ // return statement important or elese it won't return func and therefor error while running
        Promise.resolve(requestHandler(req,res,next))
        .catch((err)=> next(err))
    }

}

export {asyncHandler}

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

