const mongoose = require("mongoose");


function connectToDB () {
    mongoose.connect(process.env.MONGO_URI).then(() =>{
        console.log("database connected successfully.");
    }).catch(err =>{
        console.log("error connecting to DB");
        process.exit(1); 
    })
}

module.exports = connectToDB;