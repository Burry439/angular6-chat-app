const express = require('express')
const router = express.Router()
const User = require('../models/user')
const passport = require('passport')
const jwt = require("jsonwebtoken")
const config = require("../config/database")

router.post('/register',(req,res,next)=>{
    console.log(req.body)
    console.log(req.file)
    let newUser = new User({
        firstname: req.body.firstname,
        email: req.body.email,
        lastname: req.body.lastname,
        password: req.body.password,       
        online: false,
        
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
                  expiresIn:6000000,
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



module.exports = router