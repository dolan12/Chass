const mongoose = require("mongoose")

const UserSchema = new mongoose.Schema({
    Username: {
        type: String, 
        required: true
    },
    Password: {
        type: String, 
        require: true
    },
    DisplayName:{
        type: String,
        require: true
    },
    Games: [{
        type: String,
        require: false
    }],
    Wins:{
        type: Number,
        require: false
    },
    Losses:{
        type: Number,
        require: false
    },
    Rating:{//Everyone start with base rating of 1200
        type: Number,
        require: true
    },
    Draws:{
        type: Number,
        require: false
    }

    
})

const UserModel = mongoose.model("users", UserSchema)
module.exports = UserModel