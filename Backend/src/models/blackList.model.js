const mongoose=require("mongoose");

const blackListSchema = new mongoose.Schema({
token:{
    type:String,
    required:true,
    unique:true
}
},{
    timestamps:true
});

blackListSchema.index({cretedAt:1},{expireAfterSeconds:60*60*24*3}); // expire after 3 days

const blackListModel=mongoose.model("blacklist",blackListSchema);

module.exports=blackListModel;