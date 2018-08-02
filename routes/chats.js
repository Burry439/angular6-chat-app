const express = require('express')
const router = express.Router()
const Chat = require('../models/chat')

router.post('/getchat',(req,res)=>{
    Chat.find({$or:[ {users:[req.body.me.id,req.body.you._id]  } , {users:[req.body.you._id,req.body.me.id]}   ]} ,(err,chat)=>{
        if(chat.length)
        {   
            console.log("found")
            res.send(chat)
        }
        else
        {   
            console.log("not found")
            let chat = new Chat({
                users:[req.body.me.id, req.body.you._id],
                messages:[]
            })
            chat.save(()=>{
                res.send(chat)
            })
            
        }
    })
 })

 module.exports = router