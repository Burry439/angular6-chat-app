const mongoose = require("mongoose");

const commentSchema = mongoose.Schema({
   post:
   {
    type: mongoose.Schema.Types.ObjectId, ref: 'Post',
    require: true
   },
    from:
    {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        require: true
    },
    comment:
    {
        type:String,
        require:true
    }


})

const Comment = module.exports = mongoose.model("Comment", commentSchema)