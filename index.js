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
app.use('/users', users)

app.use(passport.initialize())

app.use(passport.session())

require('./config/passport')(passport)









////////////socket routes
io.on('connection', function(socket){

    socket.on("user-conneted",(user)=>{
        User.findById(user,(err,user)=>{
             user.online = true;
            user.save(()=>{
              User.find({},(err,user)=>{
                io.emit('updated-list',user)
              })
              
            })
        })
    })

    socket.on('disconnect', ()=>{
      setTimeout(()=>{
         User.find({},(err,user)=>{
          io.emit('updated-list',user)
         }) 
        }, 2000);

      console.log('user has disconnected');
      User.find({},(err,users)=>{
        console.log(users)
        for(i = 0; i < users.length; i++)
        {
          users[i].online = false
          users[i].save()
        }
        
      })
      io.emit('whos-still-here')
    });


    socket.on("user-still-online",(user)=>{
      User.findById(user,(err,user)=>{
        user.online = true;
        user.save()
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




   




    socket.on('message', (msg)=>{
      console.log(msg);
      io.emit('message', {type:'new-message', text: msg});    
    });

  });
  
////////////////////////////
  



http.listen(port, function(){
  console.log('listening on '  + port);
});