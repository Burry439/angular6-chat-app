const express = require('express')
const router = express.Router()
const Chat = require('../models/chat')

router.post('/getchat',(req,res)=>{

        console.log(req.body)

    Chat.find({$or:[ {users:[req.body.me,req.body.you._id]  } , {users:[req.body.you._id,req.body.me]}   ]} ,(err,chat)=>{

         console.log(chat)

        if(chat.length)
        {   
            console.log("found " + chat)
            res.send(chat)
        }
        else
        {   
            let chat = new Chat({
                users:[req.body.me, req.body.you._id],
                messages:[]
            })
            chat.save(()=>{
                console.log("not found ")
                res.send(chat)
            })
            
        }
    })
 })

 module.exports = router