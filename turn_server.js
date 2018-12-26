'use strict';

var express = require('express');
var crypto = require('crypto');
var app = express();

var hmac = function(key, content){
    var method = crypto.createHmac('sha1', key);
    method.setEncoding('base64');
    method.write(content);
    method.end();
    return method.read();
};

app.get('/turn', function(req, resp) {
    console.log('accept request');
    var query = req.query;
    var key = 't=u4d08021891333';
    if (!query['username']) {
	return resp.send({'error':'AppError', 'message':'Must provide username.'});
    } else {
	var time_to_live = 1200;
	var timestamp = Math.floor(Date.now() / 1000) + time_to_live;
	var turn_username = timestamp + ':' + query['username'];
	console.log(query['username'], hmac(key, query['username']));
	var password = hmac(key, turn_username);

	resp.setHeader("Access-Control-Allow-Origin", "*");
	resp.setHeader("Access-Control-Allow-Methods", "GET");

	return resp.send({
            username:turn_username,
            password:password,
            ttl:time_to_live,
            "uris": [
		"turn:120.25.60.70:3478?transport=udp",
		"turn:120.25.60.70:3478?transport=tcp",
		"turn:120.25.60.70:3479?transport=udp",
		"turn:120.25.60.70:3479?transport=tcp"
            ]
	});
    }

});

app.get('/timestamp', function(req, resp) {
    var time_to_live = 600;
    var timestamp = Math.floor(Date.now() / 1000) + time_to_live;
	console.log("timestamp_is_" + timestamp.toString());
    return resp.send("timestamp_is_" + timestamp.toString());
});
        
app.listen('3033', function(){
    console.log('server started');
});
