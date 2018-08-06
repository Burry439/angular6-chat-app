require("dotenv").config();
const app = require('express')();
const express = require("express");
const http = require('http').Server(app);
const io = require('socket.io')(http);
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require('path');
const mongoose = require("mongoose");
const config = require('./config/database')
const passport = require('passport')
const User = require('./models/user')
const Chat = require('./models/chat')
mongoose.connect(config.database)

mongoose.connection.on('connected', ()=>{
    console.log("connected to db " + config.database)
})

mongoose.connection.on('error', (err)=>{
    console.log("database error " + err)
})


app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
 app.use(express.static(path.join(__dirname, 'public')));
const port = process.env.PORT || 8080;



const users = require('./routes/users')
const chats = require('./routes/chats')

require('./config/passport')(passport)

app.use('/chats', chats)
app.use('/users', users)

app.use(passport.initialize())

app.use(passport.session())


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});







////////////socket routes
io.on('connection', function(socket){





    socket.on("user-conneted",(user)=>{
        User.findById(user,(err,user)=>{
          user.online = true;
          user.socketId = socket.id
           console.log(socket.id + " has connected")
         user.save(()=>{
             User.find({},(err,user)=>{
               io.emit('updated-list',user)
             })
             
         })
     })
    })



    socket.on('disconnect', ()=>{
      User.find({socketId:socket.id},(err,user)=>{
             if(user[0] != undefined)
             {
              user[0].online = false
              console.log("the query " + user + ": ")
              user[0].save(()=>{
  
                  User.find({},(err,user)=>{
                    io.emit("updated-list",user)
                  })
              })
             }
             else
             {
               console.log("to slow")
             }
          
      })
    })


    socket.on('log-off', (user)=>{
      User.findById(user.id,(err,user)=>{
          user.online = false
          user.save(()=>{
            User.find({},(err,user)=>{
              io.emit('updated-list',user)
            })
            
          })
      })
    });




    socket.on('join-room',(roomId)=>{
      console.log("joined " + roomId)
      socket.join(roomId)
    })



    socket.on('left-room',(roomId)=>{
      console.log("left " + roomId)
      socket.leave(roomId)
    })




    socket.on('message', (chatInfo)=>{



      Chat.find({$or:[ {users:[chatInfo.me,chatInfo.you]  } , {users:[chatInfo.you,chatInfo.me]}   ]},(err,chat)=>{


         console.log("chat " +  chat  + " chat ")
        chat[0].messages.push(chatInfo.msg)
        chat[0].save(()=>{

                usersInRoom = io.sockets.adapter.rooms[chat[0]._id]
                // console.log(usersInRoom)

                User.findById(chatInfo.you,(err,user)=>{
                    if(!usersInRoom.sockets.hasOwnProperty(user.socketId))
                    {
                        console.log("add to room")
                        console.log("your socket id  "+chatInfo.me)
                        let me = {_id:chatInfo.me}
                        io.to(user.socketId).emit('got-message', me);    
                    }
                    else
                    {
                       console.log("already in room")
                    }
                  }) 
          io.to(chat[0]._id).emit('message', {type:'new-message', chat: chatInfo});
        })
      })
    });










  });
  
////////////////////////////
  



http.listen(port, function(){
  console.log('listening on '  + port);
});