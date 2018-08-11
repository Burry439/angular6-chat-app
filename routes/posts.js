const express = require('express')
const router = express.Router()
const Post = require('../models/post')

router.get('/getposts',(req,res)=>{

    Post.find({}).populate('from','firstname lastname profilePic').exec((err,posts)=>{
        res.json(posts)
    })
        

 })


 router.get('/getmyposts', (req,res)=>{
     console.log(req.headers.authorization + " ffff ")
     Post.find({from:req.headers.authorization}).populate('from','firstname lastname profilePic').exec((err,posts)=>{
        res.json(posts)
    })
 })

 module.exports = router