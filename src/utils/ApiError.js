class ApiError extends Error{
    constructor( // we are creating our own constructor to overwrite things
        statusCode,
        message="Something went wrong",
        error=[],
        statck=""// i dont know why but sir used statck instead of stack
    ){// here we overwrite 
        // here we can add properties or overwrite them 
        super(message)//overwrite message
        this.statusCode=statusCode// we have filled this.statuscode with the statuscode we have taken this is not over writing
        this.data=null
        this.message=message
        this.success=false
        this.errors=this.errors

        if(statck){
            this.stack=statck
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }

    }
}

export {ApiError}