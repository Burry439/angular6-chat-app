const express = require('express')
const router = express.Router()
const Post = require('../models/post')
const Comment = require('../models/comment')
const multer = require('multer')
var cloudinary = require('cloudinary');


////////////for storing files/////////////////////////
cloudinary.config({ 
    cloud_name: 'dude439', 
    api_key: '833245911756313', 
    api_secret: 'aBPLhs-F8eFrzo-1TVlN1o1b_ms' 
  });
////////////////////////////////////////////////////





const storage = multer.diskStorage({
    destination: (req,file,cb)=>{
        cb(null, './uploads/')
    },
    filename: (req,file,cb) =>{
        cb(null, file.originalname)
    }
});

const fileFilter = (req,file,cb)=>{
    if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg')
    {
        cb(null,true)
    }
    else
    {
        req.fileValidationError = 'goes wrong on the mimetype';
        return cb(null, false, new Error('goes wrong on the mimetype'));
    }
    
    
}

const upload = multer({
    storage: storage, 
    limits: {fieldSize: 1024 * 1024 * 5},
      fileFilter: fileFilter
})

router.post('/uploadImage', upload.single('Pic'),(req,res,next)=>
{
    let image = ''

    

    let postInfo = JSON.parse(req.body.from)


    if(req.fileValidationError) {
       return res.json("wrong");
  }
        
         cloudinary.uploader.upload(req.file.path, (result)=> { 



            let post;

          if(postInfo.to)
          {
            post = new Post(
                {
                    from:postInfo.from,
                    to:postInfo.to,
                    post:postInfo.post,
                    image: result.url,       
                    comments: [],
                    time:postInfo.time    
                })
          }
          else
          {
            post = new Post(
                {
                    from:postInfo.from,
                    post:postInfo.post,
                    image: result.url,       
                    comments: [],
                    time:postInfo.time    
                })
          }

      
        
        
        
        
            post.save((err,post)=>{

                ///mongoose will not let me populate after saving so i need to find the post again 

                Post.findById(post._id)
                .populate('from to','firstname lastname profilePic').exec((err,posts)=>{
                    res.json(posts)
             }); 
        
         })


})





})





router.get('/getposts',(req,res)=>{

    Post.find({}).populate('from to','firstname lastname profilePic').exec((err,posts)=>{
        posts.reverse()
        res.json(posts)
    })
        

 })




 router.get('/getmyposts', (req,res)=>{
     Post.find(     { $or: [ { from:req.headers.authorization} , { to: req.headers.authorization } ] }    ).populate('from to','firstname lastname profilePic').exec((err,posts)=>{
         posts.reverse()
        res.json(posts)
    })
 })

 router.get('/getotherposts', (req,res)=>{
    Post.find(  { $or: [ { from:req.headers.authorization} , { to: req.headers.authorization } ] }  ).populate('from to','firstname lastname profilePic').exec((err,posts)=>{
        posts.reverse()
       res.json(posts)
   })
})

 router.get('/getcomments',(req,res)=>{
    Comment.findById(req.headers.authorization).populate('from','firstname lastname profilePic').exec((err,comment)=>{
        res.json(comment)
    })
        

 })




 module.exports = router