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
const Post = require('./models/post')
const Comment = require('./models/comment')


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
const posts = require('./routes/posts')

require('./config/passport')(passport)

app.use('/chats', chats)
app.use('/users', users)
app.use('/posts', posts)

app.use(passport.initialize())

app.use(passport.session())


app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});







////////////socket routes
io.on('connection', function(socket){


  ///////////////////////comment sockets///////////////////////////

  socket.on("add-new-comment",(commentInfo)=>{

    console.log(commentInfo)
    let comment = new Comment({
        post: commentInfo.postId,
        from: commentInfo.from,
        comment: commentInfo.comment,
    })
    comment.save((err,comment)=>{
        Post.findById(commentInfo.postId,(err,post)=>{
          post.comments.push(comment._id)
          post.save((err,post)=>{
            io.emit('new-comment',post, commentInfo.from, commentInfo.postId)
          })
        })
      })
    })


    socket.on("delete-comment",(commentId)=>{

      Comment.findByIdAndRemove(commentId,(err,comment)=>{
        console.log(comment)
        io.emit('deleted-comment',comment)
      })
    
    })

    socket.on("edit-comment",(commentInfo)=>{
      console.log("comment info " + commentInfo.comment)
      Comment.findById(commentInfo.id,(err,comment)=>{
        console.log(comment)
        comment.comment = commentInfo.comment
        comment.save((err,comment)=>{
          let channel = 'edited-comment' +comment._id
          console.log(channel)
          io.emit('edited-comment'   ,comment)
        })
      })
    
    })

/////////////////////////////////////////////////////////////////



////////////////////post sockets//////////////////////////////////
  socket.on("new-post",(postInfo)=>{

    console.log("post info  " +postInfo.from)

    let post = new Post({
        from: postInfo.from,
        post: postInfo.post,
        image:postInfo.image || ''
    })
    post.save((err,post)=>{
        Post.findById(post._id).populate('from','firstname lastname profilePic').exec((err,posts)=>{
          io.emit('new-post',posts)
      })
    })
})

socket.on("delete-post",(postId)=>{

  console.log("post info  " +postId)

  Post.findByIdAndRemove(postId,(err,post)=>{
    console.log(post)
    io.emit('deleted-post',post)
  })

})


socket.on("edit-post",(postInfo)=>{

  console.log("post info  " + postInfo._id)

  Post.findById(postInfo._id,(err,post)=>{
    console.log(post.post)

    post.post = postInfo.post
    console.log(post.post)
    post.save((err,post)=>{
      io.emit('edited-post',post)
    })
  })

})
///////////////////////////////////////////


//////////////////user sockets/////////////////////////
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


/////////////////////////////////////////////


////////////chat sockets/////////////////////////

    socket.on('join-room',(roomId)=>{
      console.log("joined " + roomId)
      socket.join(roomId)
    })



    socket.on('left-room',(roomId)=>{
      console.log("left " + roomId)
      socket.leave(roomId)
    })




    socket.on('message', (chatInfo)=>{

      ////depending on if your starting a conversation or replying your info comes out difffrent hence the check
      let you = ''
      if(chatInfo.you._id != undefined)
      {
          you = chatInfo.you._id
      }
      else
      {
          you = chatInfo.you.id
      }
      console.log("chat info " + you + ":::::::::::")

      //////////////////////////////////////////////////////////////



      Chat.find({$or:[ {users:[chatInfo.me.id, you]  } , {users:[you,chatInfo.me.id]}   ]},(err,chat)=>{

        let theChat;

      
          console.log("yes array " + chat)
          theChat = chat[0]
          chatInfo.chatId = chat[0]._id

        theChat.messages.push({message:chatInfo.msg,from:chatInfo.me.id, date:chatInfo.date, time:chatInfo.time })
        theChat.save(()=>{

                usersInRoom = io.sockets.adapter.rooms[theChat._id]
                 console.log("users in this room " +usersInRoom)

                User.findById(you,(err,user)=>{
                    // if(!usersInRoom.sockets.hasOwnProperty(user.socketId))
                    // {
                        // console.log("add to room")
                        // console.log("your socket id  "+chatInfo.me)
                        // let me = {_id:chatInfo.me.id}
                        io.to(user.socketId).emit('got-message', chatInfo.me);    
                    // }
                    // else
                    // {
                       console.log("already in room")
                    // }
                  }) 
          io.to(theChat._id).emit('message', {type:'new-message', chat: {roomId:theChat._id ,msg:chatInfo.msg,from:chatInfo.me.id, date:chatInfo.date, time:chatInfo.time} });
        })
      })
    });




  });
  
////////////////////////////
  



http.listen(port, function(){
  console.log('listening on '  + port);
});