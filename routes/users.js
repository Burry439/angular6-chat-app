const express = require('express')
const router = express.Router()
const User = require('../models/user')
const passport = require('passport')
const jwt = require("jsonwebtoken")
const config = require("../config/database")
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

router.put('/profilephoto', upload.single('profilePic'), (req,res,next)=>
{   

    if(req.fileValidationError) {
        console.log("yo")
       return res.json("wrong");
  }


    const id = JSON.parse(req.headers.authorization)
    cloudinary.uploader.upload(req.file.path, function(result) { 
        console.log("resrult : " + result.url) 

        User.findById(id.id, (err,user)=>{
            user.profilePic = result.secure_url
            user.save((err,updatedObject)=>{
                res.json(updatedObject)
            })  
        })
    });  
})

router.put('/wallphoto', upload.single('wallPic'), (req,res,next)=>
{   

    if(req.fileValidationError) {
        console.log("yo")
       return res.json("wrong");
  }


    const id = JSON.parse(req.headers.authorization)
    cloudinary.uploader.upload(req.file.path, function(result) { 
        console.log("resrult : " + result.url) 

        User.findById(id.id, (err,user)=>{
            user.wallPic = result.secure_url
            user.save((err,updatedObject)=>{
                res.json(updatedObject)
            })  
        })
    });  
})







router.post('/register',(req,res,next)=>{
    console.log(req.body)
    console.log(req.file)
    let newUser = new User({
        firstname: req.body.firstname,
        email: req.body.email,
        lastname: req.body.lastname,
        password: req.body.password,       
        online: false,
        profilePic: 'http://res.cloudinary.com/dude439/image/upload/v1530090215/samples/cloudinary-logo-vector.svg',
        wallPic:'http://res.cloudinary.com/dude439/image/upload/v1530090227/samples/landscapes/architecture-signs.jpg'

        
    })
    User.findOne({email:req.body.email},(err,user)=>{
        if(user)    
        {     
            console.log("Already created an account with this email")
            return res.json({success: 'false', msg: 'Already created an account with this email'})
        }
        else
        {   
            User.addUser(newUser, (err,user)=>{
                if(err)
                {
                    res.json({success: 'false', msg: 'failed to registar user'})
                }
                else
                {
                    res.json({success:'true', msg: "user registared"})
                }
            })
        }
    })
  

})


router.post('/authenticate', (req,res,next)=>{
    const email = req.body.email
    const password = req.body.password

    User.getUserByEmail(email, (err,user)=>{
        if(err) throw err
        if(!user)
        {
          return  res.json({success: false, message: "user not found"})
        }

      
        User.comparePassword(password, user.password, (err, isMatch)=>{
            if(err) throw err
            if(isMatch &&  user.online == false)
            {   
                
                const token = jwt.sign({data:user}, config.secret, 
                {
                  expiresIn:7200000,
                })  
                res.json({
                success:true,
                token: "JWT " + token,
                user:
                {
                    id: user._id,
                    firstname: user.firstname,
                    email: user.email,
                    lastname: user.lastname,
                }
                })
            }
            else if(isMatch && user.online == true)
            {
                return res.json({success: false , loggedIn: true, message: "Some one has already logged into this account"})
            }
            else
            {
                return  res.json({success: false, message: "wrong password"})
            }
     

        })
    })
})

router.get('/profile', passport.authenticate('jwt', {session: false}), (req,res)=>{                                                                         
    User.findById(req.user._id,(err,user)=>{
                console.log(user.attending)
                res.json(user)     
    })
})



module.exports = router