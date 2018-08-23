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
app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
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

    let comment = new Comment({
        post: commentInfo.postId,
        from: commentInfo.from,
        comment: commentInfo.comment,
        time: commentInfo.time
    })
    comment.save((err,comment)=>{
        Post.findById(commentInfo.postId,(err,post)=>{
          post.comments.push(comment._id)
          post.save((err,post)=>{
            io.emit('new-comment',post, commentInfo.comment,commentInfo.from, commentInfo.postId, commentInfo.firstname,commentInfo.lastname)
          })
        })
      })
    })


    socket.on("delete-comment",(commentId)=>{

      Comment.findByIdAndRemove(commentId,(err,comment)=>{
        io.emit('deleted-comment',comment)
      })
    
    })

    socket.on("edit-comment",(commentInfo)=>{
      Comment.findById(commentInfo.id,(err,comment)=>{
        comment.comment = commentInfo.comment
        comment.save((err,comment)=>{
          io.emit('edited-comment',comment)
        })
      })
    
    })

/////////////////////////////////////////////////////////////////



////////////////////post sockets//////////////////////////////////
  socket.on("new-post",(postInfo)=>{

    let post;
    if(postInfo.to)
    {
      post = new Post({
        from: postInfo.from,
        to: postInfo.to || '',
        post: postInfo.post,
        image:postInfo.image || '',
        time:postInfo.time
    })
    }
    else
    {
      post = new Post({
        from: postInfo.from,
        post: postInfo.post,
        image:postInfo.image || '',
        time:postInfo.time
    })
    }


    post.save((err,post)=>{
        Post.findById(post._id).populate('from to','firstname lastname profilePic').exec((err,posts)=>{
          io.emit('new-post',posts)
      })
    })
})

socket.on("delete-post",(postId)=>{


  Post.findByIdAndRemove(postId,(err,post)=>{
    io.emit('deleted-post',post)
  })

})


socket.on("edit-post",(postInfo)=>{


  Post.findById(postInfo._id,(err,post)=>{

    post.post = postInfo.post
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
              user[0].save(()=>{
  
                  User.find({},(err,user)=>{
                    io.emit("updated-list",user)
                  })
              })
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
      socket.join(roomId)
    })



    socket.on('left-room',(roomId)=>{
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

      //////////////////////////////////////////////////////////////



      Chat.find({$or:[ {users:[chatInfo.me.id, you]  } , {users:[you,chatInfo.me.id]}   ]},(err,chat)=>{

        let theChat;

      
          theChat = chat[0]
          chatInfo.chatId = chat[0]._id

        theChat.messages.push({message:chatInfo.msg,from:chatInfo.me.id, date:chatInfo.date, time:chatInfo.time,seen:false})
        theChat.save(()=>{

                usersInRoom = io.sockets.adapter.rooms[theChat._id]

                User.findById(you,(err,user)=>{
              
                        io.to(user.socketId).emit('got-message', chatInfo.me);    
    
                  }) 
          io.to(theChat._id).emit('message', {type:'new-message', chat: {roomId:theChat._id ,msg:chatInfo.msg,from:chatInfo.me.id, date:chatInfo.date, time:chatInfo.time,seen:false} });
        })
      })
    });







      
    socket.on('seen-message',(chatInfo)=>{

      let you = ''
      if(chatInfo.you._id != undefined)
      {
          you = chatInfo.you._id
      }
      else
      {
          you = chatInfo.you.id
      }
      
      Chat.find({$or:[ {users:[chatInfo.me.id, you]  } , {users:[you,chatInfo.me.id]}]},(err,chat)=>{
          if(chat[0].messages[chat[0].messages.length - 1].seen != undefined)
          {
              chat[0].messages[chat[0].messages.length - 1].seen = true
              chat[0].save((err,chat)=>{
              io.to(chat._id).emit('saw-message', chat._id, chatInfo.me.id);
            })
          }     
       })
    })




     socket.on('typing',(chatInfo)=>{

      
      let you = ''
      if(chatInfo.you._id != undefined)
      {
          you = chatInfo.you._id
      }
      else
      {
          you = chatInfo.you.id
      }


      Chat.find({$or:[ {users:[chatInfo.me.id, you]  } , {users:[you,chatInfo.me.id]}]},(err,chat)=>{
        
        socket.to(chat[0]._id).emit('typing', chat[0]._id);
        })   
     })



     socket.on('image',(posts)=>{
      io.emit('new-post',posts)
     })




     socket.on('new-profilePic',(profilePic,id, firstname,lastname)=>{
      io.emit('new-profilePic',profilePic,id, firstname,lastname)
     })



     socket.on('new-wallPic',(wallPic,id, firstname,lastname)=>{
      io.emit('new-wallPic',wallPic,id, firstname,lastname)
     })

      //////////////////////end of connection function
  });




  
////////////////////////////
  



http.listen(port, function(){
  console.log('listening on '  + port);
});