const mongoose = require('mongoose');
require('dotenv').config();
const connectDb = require('./src/config/db');
const userModel = require('./src/models/user.model');

connectDb().then(async () => {
    const users = await userModel.find();
    for (let u of users) {
        let r = Number(u.rating) || 800;
        let w = Number(u.winCount) || 0;
        await userModel.updateOne({ _id: u._id }, { $set: { rating: r, winCount: w } });
        console.log(`Updated ${u.username} with rating ${r} and winCount ${w}`);
    }
    console.log('Fixed DB types!');
    process.exit(0);
}).catch(console.error);