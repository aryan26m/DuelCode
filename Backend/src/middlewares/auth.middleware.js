const blackListModel=require('../models/blackList.model');
const jwt=require('jsonwebtoken');
const authMiddleware= async(req,res,next)=>{
    const token=req.cookies?.token || req.headers.authorization?.split(' ')[1];
    if(!token){
        return res.status(401).json({message:'Unauthorized'});
    }
    const isBlackListed=await blackListModel.findOne({token});
    if(isBlackListed){
        return res.status(401).json({message:'Unauthorized'});
    }
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        req.user=decoded;
        next();
    }
    catch(err){
        console.error('JWT verify failed:', err.message);
        return res.status(401).json({message:'Unauthorized'});
    }
}


module.exports={authMiddleware};