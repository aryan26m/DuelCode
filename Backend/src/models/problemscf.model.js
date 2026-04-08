const mongoose=require("mongoose");

const DIFFICULTY_LEVELS=["easy","medium","hard"];

const QuestionsCfSchema=new mongoose.Schema(
    {
        title:{
            type:String,
            required:[true,"Question title is required"],
            trim:true,
            minlength:[3,"Title must be at least 3 characters long"],
            maxlength:[200,"Title cannot exceed 200 characters"],
        },
        platform:{
            type:String,
            default:"CodeForces",
            enum:["CodeForces"],
            immutable:true,
        },
        link:{
            type:String,
            required:[true,"Question link is required"],
            trim:true,
            match:[/^https?:\/\/.+/i,"Please provide a valid URL"],
        },
        difficulty:{
            type:String,
            required:[true,"Difficulty is required"],
            lowercase:true,
            enum:{
                values:DIFFICULTY_LEVELS,
                message:"Difficulty must be easy, medium, or hard",
            },
        },
        cfContestId:{
            type:Number,
            required:[true,"Codeforces contest ID is required"],
            min:[1,"Contest ID must be a positive number"],
        },
        cfIndex:{
            type:String,
            required:[true,"Codeforces problem index is required"],
            trim:true,
            uppercase:true,
            match:[/^[A-Z]\d?$/,"Codeforces index must look like A, B, C1, etc."],
        },
    },
    {
        timestamps:true,
        versionKey:false,
    }
);

QuestionsCfSchema.index({platform:1,cfContestId:1,cfIndex:1},{unique:true});

const questionsCfModel=mongoose.model("QuestionCf",QuestionsCfSchema);

module.exports=questionsCfModel;
