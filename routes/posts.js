const express = require('express')
const router = express.Router()
const Post = require('../models/post')
const Comment = require('../models/comment')

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