const mongoose=require("mongoose");

const userSchema=new mongoose.Schema({
    username:{
        type:String,
        required:[true,"Username is required"],
        unique:true,
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:true
    },
    password:{
        type:String,
        required:[true,"Password is required"],
        select:false,
    },
    cfHandle:{
        type:String,
        required:[true,"Codeforces handle is required"],
        unique:true,
    },
    winCount:{
        type:Number,
        default:0
    },
    rating:{
        type:Number,
        default:800
    },
    currentStreak: {
        type: Number,
        default: 0
    },
    longestStreak: {
        type: Number,
        default: 0
    },
    lastStreakDate: {
        type: Date,
        default: null
    }
})

const userModel=mongoose.model("user",userSchema);

module.exports=userModel;