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

    
    console.log(req.file)

    let postInfo = JSON.parse(req.body.from)

// console.log("from::::::::::::::: " + postInfo.post)

    if(req.fileValidationError) {
        console.log("yo")
       return res.json("wrong");
  }
        
         cloudinary.uploader.upload(req.file.path, (result)=> { 

            console.log("Inside cloudinary function .........................")

          console.log("resrult : " + result.url) 


         let post = new Post(
            {
                from:postInfo.from,
                post:postInfo.post,
                image: result.url,       
                comments: [],
                time:postInfo.time    
            }
        )
        
        
        console.log("the post " + post)
        
            post.save((err,post)=>{

                Post.findById(post._id)
                .populate('from','firstname lastname profilePic').exec((err,posts)=>{
                    res.json(posts)
             }); 
        
         })


})





})





router.get('/getposts',(req,res)=>{

    Post.find({}).populate('from','firstname lastname profilePic').exec((err,posts)=>{
        posts.reverse()
        res.json(posts)
    })
        

 })




 router.get('/getmyposts', (req,res)=>{
     console.log(req.headers.authorization + " ffff ")
     Post.find({from:req.headers.authorization}).populate('from','firstname lastname profilePic').exec((err,posts)=>{
         console.log(posts)
         posts.reverse()
        res.json(posts)
    })
 })



 router.get('/getcomments',(req,res)=>{
    console.log( " yo  " + " " +req.headers.authorization)
    Comment.findById(req.headers.authorization).populate('from','firstname lastname profilePic').exec((err,comment)=>{
        res.json(comment)
    })
        

 })




 module.exports = router