var fs = require('fs');
var https = require('https');
var socketIO = require('socket.io');

// 读取密钥和签名证书
var options = {
  key: fs.readFileSync('keys/server.key'),
  cert: fs.readFileSync('keys/server.crt')
}

// 构建https服务器
var apps = https.createServer(options);
// 监听端口
var SSL_PORT = 8443;
apps.listen(SSL_PORT);
// 构建Sock.io服务器
var io = socketIO.listen(apps);

var roomInfo = {};

// Socket连接监听
io.sockets.on('connection', function (socket) {

  // 创建 room
  socket.on('createAndJoinRoom', function (message) {
    var room = message.room;
    roomInfo[socket.id] = room;
    socket.join(room);
    console.log('createAndJoinRoom ' + socket.id + ' joined room ' + room);
    var data = {};
    data.id = socket.id;
    data.room = room;
    socket.emit('created', data);//返回创建信息
    console.log(io.sockets.adapter.rooms)
  });

  // 接听
  socket.on('makeCall', function (message) {
    
    var room = roomInfo[socket.id];
    if (room) {
      socket.to(room).emit('makeCall', message);
    }
    console.log('Client ID ' + socket.id + ' makeCall ' + room);
  });

   // 接听反馈
   socket.on('makeCallResult', function (message) {
    
    var room = roomInfo[socket.id];
    if (room) {
      socket.to(room).emit('makeCallResult', message);
    }
    console.log('Client ID ' + socket.id + ' makeCall ' + room);
  });

  // 挂断
  socket.on('hangup', function (message) {
    var room = roomInfo[socket.id];
    if (room) {
      socket.to(room).emit('hangups', message);
      socket.leave(room);
    }
    console.log('Client ID ' + socket.id + ' hangup ' + room);
  });
  
  // offer
  socket.on('offer', function (message) {
    var room = roomInfo[socket.id];
    if (room) {
      socket.to(room).emit('offer', message);
    }
    console.log('Client ID ' + socket.id + ' offer ' + room);
  });

  // answer
  socket.on('answer', function (message) {
    var room = roomInfo[socket.id];
    if (room) {
      socket.to(room).emit('answer', message);
    }
    console.log('Client ID ' + socket.id + ' answer ' + room);
  });

  // candidate
  socket.on('candidate', function (message) {
    var room = roomInfo[socket.id];
    if (room) {
      socket.to(room).emit('candidate', message);
    }
    console.log('Client ID ' + socket.id + ' candidate ' + room);
  });

  // exit
  socket.on('exit', function (message) {
    var room = roomInfo[socket.id];
    if (room) {
      socket.to(room).emit('exit', message);
      socket.leave(room);
    }
    console.log('Client ID ' + socket.id + ' exit ' + room);
  });

  // socket关闭
  socket.on('disconnect', function(reason){
    var room = roomInfo[socket.id];
    if (room) {
      socket.to(room).emit('exit', reason);
    }
    console.log('Client ID ' + socket.id + ' disconnect: ',  reason)
    console.log(io.sockets.adapter.rooms);
  });
});
