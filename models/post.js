const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
   
    from:
    {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        require: true
    },
    post:
    {
        type:String,
        require:true
    },
    image:
    {
        type:String,
        require:false
    },
    comments: [{
         type: mongoose.Schema.Types.ObjectId, ref: 'Comment',
         require: true
     }]

})

const Post = module.exports = mongoose.model("Post", postSchema)