const mongoose = require("mongoose");

const chatSchema = mongoose.Schema({
   
    users:[{
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        require: true
    }],
    messages:[{
        message:String,
        from:String,
        date:String,
        time:String,
        seen:false
    }],
})

const Chat = module.exports = mongoose.model("Chat", chatSchema)