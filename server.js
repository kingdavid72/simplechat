const path = require('path');
const http = require('http');
const express = require('express');
// To use concurrent messaging
const socketio = require('socket.io');
const formatMessage = require('./utils/messages');
const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers
  } = require('./utils/users');

// Express can creat server
const app = express();
const server = http.createServer(app);
const io = socketio(server);

const botName = 'Calici Bot';
// Set static folder
app.use(express.static(path.join(__dirname, 'public')));
const PORT = 3001 || process.env.PORT;

// Run when client connects
io.on('connection', socket => {
    // console.log('New WebSocket Connection ...');
    
    socket.on('joinRoom', ({ username, room }) => {
        const user = userJoin(socket.id, username, room);
        socket.join(user.room);

    // Welcome current user
    socket.emit('message', formatMessage(botName,'Welcome to Calici'));
    // Broadcast when a user connects
    socket.broadcast
    .to(user.room)
    .emit(
        'message',
         formatMessage(botName, `${user.username} has join the chat`)
    );
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
          });
    });

    //Listen for chatMessage
    socket.on('chatMessage', msg => {
        //console.log(msg);
        const user = getCurrentUser(socket.id);
        // Now emit to the client
        io.to(user.room).emit('message', formatMessage(user.username, msg));          
    });

    // This runs when user disconnect
    socket.on('disconnect', () =>{
        const user = userLeave(socket.id);

        if (user) {
        io.to(user.room).emit('message', formatMessage(botName, `${user.username} has has left the chat`));
        
        // Send users and room info
        io.to(user.room).emit('roomUsers', {
        room: user.room,
        users: getRoomUsers(user.room)
        });
        }
    });
});


// instead of using app.listen now use server.listen
server.listen(PORT, () => console.log(
    `Server running on port ${PORT}`
));
