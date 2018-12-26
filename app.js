//https类
var https = require('https');
//文件操作类
var fs = require('fs');
//读取密钥和签名证书
var options = {
  key: fs.readFileSync('keys/server.key'),
  cert: fs.readFileSync('keys/server.crt')
}
//socket.io类
var socketIO = require('socket.io');

//构建http服务器
var apps = https.createServer(options);
//监听端口
var SSL_PORT = 8443;
apps.listen(SSL_PORT);

//所有登陆的用户
var users = {};

//构建Sock.io服务器
var io = socketIO.listen(apps);
//Socket连接监听
io.sockets.on('connection', function (socket) {
  //socket关闭
  socket.on('disconnect', function(reason){
   //如果
    var socketId = socket.id;
    console.log('disconnect: ' + socketId + ' reason:' + reason +' name '+socket.name);
    var message = {};
    message.from = socketId;
    message.room = '';
    message.name=socket.name;
    socket.broadcast.emit('exit', message);
   });
  /** client->server 信令集*/
  //【createAndJoinRoom】  创建并加入Room中 [room]
  socket.on('createAndJoinRoom', function (message) {
    var room = message.room;
    console.log('Received createAndJoinRoom：' + room);
    //判断room是否存在
    var clientsInRoom = io.sockets.adapter.rooms[room];
    var numClients = clientsInRoom ? Object.keys(clientsInRoom.sockets).length : 0;
    console.log('Room ' + room + ' now has ' + numClients + ' client(s)');
    if (clientsInRoom) {
      console.log(Object.keys(clientsInRoom.sockets));
    }
    if (numClients === 0) {
      /** room 不存在 不存在则创建（socket.join）*/
      //加入并创建房间
      socket.join(room);
      console.log('Client ID ' + socket.id + ' created room ' + room);

      //发送【created】消息至客户端 [id,room,peers]
      var data = {};
      //socket id
      data.id = socket.id;
      //room id
      data.room = room;
      //其他连接 为空
      data.peers = [];
      //发送
      socket.emit('created', data);
    } else {
      /** room 存在 */
      //发送【joined】消息至该room其他客户端 [id,room]
      var data = {};
      //socket id
      data.id = socket.id;
      //room id
      data.room = room;
      //发送房间内其他客户端
      io.sockets.in(room).emit('joined', data);


      //发送【created】消息至客户端 [id,room,peers]
      var data = {};
      //socket id
      data.id = socket.id;
      //room id
      data.room = room;
      //其他连接
      var peers = new Array();
      var otherSocketIds = Object.keys(clientsInRoom.sockets);
      console.log('Socket length ' + otherSocketIds.length);
      for (var i = 0; i < otherSocketIds.length; i++) {
        var peer = {};
        peer.id = otherSocketIds[i];
        peers.push(peer);
      }
      data.peers = peers;
      //发送
      socket.emit('created', data);

      //加入房间中
      socket.join(room);
      console.log('Client ID ' + socket.id + ' joined room ' + room);
    }

  });

  // 用户登陆
  socket.on('login', function (message) {
    console.log('login: ' + message.name);
    delete users[message.name];
      //save user connection on the server 
      users[message.name] = socket; 
      socket.name = message.name; 
  });

  //make call
  socket.on('makeCall', function (message) {
    console.log('makeCall: ' + 'name: ' +message.name+ ' form: ' + message.from);
    if(users[message.from]) { 
      //存在该用户泽拨打电话
      socket.emit("makeCall",message);
      users[message.from].emit('makeResult',message);
  } else { 
      message.from='';
      socket.emit("makeCall",message);
  }

  });

  //离开房间
  socket.on('leaveRoom', function (message) {
    console.log('leaveRoom: ' + 'name: ' +message.name+ ' form: ' + message.from);
    if(users[message.from]) { 
      //存在该用户泽拨打电话
      users[message.from].emit('leaveRoom',message);
  } 

  });

   //心跳
   socket.on('fxack', function (message) {
    console.log('fxack: ' + 'name: ' +message.name);
  });

     //挂电话
  socket.on('turnDown', function (message) {
    console.log('turnDown: ' + 'name: ' +message.name+ ' form: ' + message.from);
    if(users[message.name]) { 
      //存在该用户泽拨打电话
      users[message.name].emit('turnDown',message);
  } 

  });

     //接电话
     socket.on('consentCall', function (message) {
      console.log('consentCall: ' + 'name: ' +message.name+ ' form: ' + message.from);
      if(users[message.name]) { 
        //存在该用户泽拨打电话
        users[message.name].emit('consentCall',message);
    } 
  
    });

       //接电话
       socket.on('removeName', function (message) {
        console.log('removeName: ' + 'name: ' +message.name);
        delete users[message.name];
      });


       //占线
       socket.on('busyRoom', function (message) {
        console.log('busyRoom: ' + 'name: ' +message.name+ ' form: ' + message.from);
        if(users[message.name]) { 
          //存在该用户泽拨打电话
          users[message.name].emit('busyRoom',message);
      } 
    
      });
  

  //【offer】转发offer消息至room其他客户端 [from,to,room,sdp]
  socket.on('offer', function (message) {
    var room = Object.keys(socket.rooms)[1];
    console.log('Received offer: ' + message.from + ' room:' + room + ' message: ' + JSON.stringify(message) );
    //转发【offer】消息至其他客户端
    //根据id找到对应连接
    var otherClient = io.sockets.connected[message.to];
    if (!otherClient) {
      return;
    }
    otherClient.emit('offer', message);

  });

  //【answer】转发answer消息至room其他客户端 [from,to,room,sdp]
  socket.on('answer', function (message) {
    var room = Object.keys(socket.rooms)[1];
    console.log('Received answer: ' + message.from + ' room:' + room + ' message: ' + JSON.stringify(message));
    //转发【answer】消息至其他客户端
    //根据id找到对应连接
    var otherClient = io.sockets.connected[message.to];
    if (!otherClient) {
      return;
    }
    otherClient.emit('answer', message);
  });

  //【candidate】转发candidate消息至room其他客户端 [from,to,room,candidate[sdpMid,sdpMLineIndex,sdp]]
  socket.on('candidate', function (message) {
    console.log('Received candidate: ' + message.from + ' message: ' + JSON.stringify(message));
    //转发【candidate】消息至其他客户端
    //根据id找到对应连接
    var otherClient = io.sockets.connected[message.to];
    if (!otherClient) {
      return;
    }
    otherClient.emit('candidate', message);
  });

  //【exit】关闭连接转发exit消息至room其他客户端 [from,room]
  socket.on('exit', function (message) {
    console.log('Received exit: ' + message.from + ' message: ' + JSON.stringify(message));
    var room = message.room;
    //关闭该连接
    socket.leave(room);
    //获取room
    var clientsInRoom = io.sockets.adapter.rooms[room];
    if (clientsInRoom) {
      var otherSocketIds = Object.keys(clientsInRoom.sockets);
      for (var i = 0; i < otherSocketIds.length; i++) {
        //转发【exit】消息至其他客户端
        var otherSocket = io.sockets.connected[otherSocketIds[i]];
        otherSocket.emit('exit', message);
      }
    }
  });

});



/** 构建html页 */
var express = require("express");
var htmlApp = express();
htmlApp.use(express.static("htmlTest"))
var httpsServer = https.createServer(options,htmlApp);
httpsServer.listen(8441);

// //http 静态路由
// htmlApp.use(express.static("htmlTest")).listen(8080);
