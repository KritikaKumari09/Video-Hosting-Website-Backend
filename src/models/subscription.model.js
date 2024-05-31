import mongoose , {Schema} from "mongoose";

const subscriptionSchema= new Schema ({
    subscriber:{
        //as a good practice type is always followed by ref
        type:Schema.Types.ObjectId, // one who is subscribing
        ref:"User"
    },
    channel:{
        type:Schema.Types.ObjectId, // one to whom 'subscriber' is subscribibg
        ref:"User"
    }
}, {timestamps:true})

export const Subscription = mongoose.model("Subscription", subscriptionSchema)