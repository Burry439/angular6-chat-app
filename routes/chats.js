const express = require('express')
const router = express.Router()
const Chat = require('../models/chat')

router.post('/getchat',(req,res)=>{

      ////depending on if your starting a conversation or replying your info comes out difffrent hence the check

        let you = ''

        if(req.body.you._id != undefined)
        {
            you = req.body.you._id
        }
        else
        {
            you = req.body.you.id
        }
        /////////////////////////////////////////////////////

    Chat.find({$or:[ {users:[req.body.me, you]  } , {users:[you,  req.body.me]}   ]} ,(err,chat)=>{

        //  console.log(chat)

        if(chat.length)
        {   
            console.log("found ")
            res.send(chat)
        }
        else
        {   
            let chat = new Chat({
                users:[req.body.me, you],
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