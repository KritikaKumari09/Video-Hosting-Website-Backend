class ApiResponse{
    constructor(statusCode,data,message="Success"){
        this.statusCode=statusCode// we fill statuscode vale with value we obtain. this is not overwritng.
        this.data=data
        this.message=message
        this.success=statusCode<400
    }
}
export {ApiResponse}