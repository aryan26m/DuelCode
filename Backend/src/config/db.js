const mongoose=require("mongoose");
const dns=require("dns");

const connectDb=async ()=>{
    if(!process.env.MONGO_URI){
        throw new Error("MONGO_URI is missing in environment variables");
    }

    const customDnsServers=(process.env.DNS_SERVERS || "8.8.8.8,1.1.1.1")
        .split(",")
        .map((server)=>server.trim())
        .filter((server)=>server && server!=="0.0.0.0");

    dns.setServers(customDnsServers.length>0 ? customDnsServers : ["8.8.8.8","1.1.1.1"]);

    await mongoose.connect(process.env.MONGO_URI,{serverSelectionTimeoutMS:10000});
    console.log("Connected to MongoDB");
}

module.exports=connectDb;