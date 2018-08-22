const mongoose = require("mongoose");

const postSchema = mongoose.Schema({
   
    from:
    {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        require: true
    },
    to:
    {
        type: mongoose.Schema.Types.ObjectId, ref: 'User',
        require: false
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
     }],
     time:
     {
         type:Object,
         require:true
     }

})

const Post = module.exports = mongoose.model("Post", postSchema)