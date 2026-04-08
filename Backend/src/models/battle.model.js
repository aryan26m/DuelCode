const mongoose=require("mongoose");

const battleSchema=new mongoose.Schema({
    inviteCode:{
        type:String,
        required:[true,"Invite code is required"],
        unique:true
    },
    player1:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:[true,"Player 1 is required"]
    },
    player2:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        default:null
    },
    problemId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"QuestionCf",
        required:[true,"Problem ID is required"]
    },
    status: { 
        type: String, 
        enum: ['waiting', 'active', 'completed'], 
        default: 'waiting' 
    },
    startTime: { 
        type: Date, 
        default: null 
    },
    winner: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User',
        default: null 
    }
},
{ 
    timestamps:true
});

const battleModel=mongoose.model("battle",battleSchema);

module.exports=battleModel;