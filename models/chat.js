const mongoose = require("mongoose");

const chatSchema = mongoose.Schema({
   
    users:[{
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        require: true
    }],
    messages:[{
        type:String,
        require:true
    }]
})

const Chat = module.exports = mongoose.model("Chat", chatSchema)