const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const config = require("../config/database")

const userSchema = mongoose.Schema({
   
    firstname:
    {
        type:String,
        require:true
    },
    email: 
    {
       type:String,
       require: true 
    },
    lastname: 
    {       
       type:String,
       require: true 
    },
    password: 
    {       
       type:String,
       require: true 
    },
    profilePic: 
    {
        type:String,
        require: false
    },
    online:
    {
        type:Boolean,
        require:true
    },
    socketId:
    {
        type:String,
        require:false
    }
})

const User = module.exports = mongoose.model("User", userSchema)

module.exports.getUserById = function(id,callback){
    User.findById(id,callback)
}

module.exports.getUserByEmail = function(email,callback){
    const query = {email:email}
    User.findOne(query,callback)
}

module.exports.addUser = function(newUser, callback){
    bcrypt.genSalt(10, (err,salt) =>{
        bcrypt.hash(newUser.password, salt, (err,hash)=>{
            if(err)
            {
                throw err
            }
            newUser.password = hash
            newUser.save(callback)
        })
    })
}

module.exports.comparePassword = function(candidatePassword,hash,callback)
{
    bcrypt.compare(candidatePassword, hash,(err,isMatch)=>{
        if(err) throw err;
        callback(null,isMatch)
    })
}