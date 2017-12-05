/**
 * Created by liaosiqun on 2017/12/4.
 */
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var fs = require('fs');

// 创建 application/x-www-form-urlencoded 编码解析
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var tools = require('./js/tools');//使用工具方法

/*允许跨域*/
app.all('*', function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
    res.header("Access-Control-Allow-Headers", "X-Requested-With");
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

//写入文件
var writerStream = fs.createWriteStream('./files/record');

/*模块系统*/
app.get('/toLower',function (req,res) {
    var lower = tools.toLower('Hello');
    res.send(lower);
})
app.get('/toUpper',function (req,res) {
    var upper = tools.toUpper('Hello');
    res.send(upper);
})

/*读取文件*/
app.get('/login_get',function (req,res) {
    res.sendFile( __dirname + "/views/" + "get.html" );
})
app.get('/login_post',function (req,res) {
    res.sendFile( __dirname + "/views/" + "post.html" );
})
app.get('/websocket',function (req,res) {
    res.sendFile( __dirname + "/views/" + "websocket.html" );
})
app.get('/chat',function (req,res) {
    res.sendFile( __dirname + "/views/" + "chat.html" );
})


/*get请求*/
app.get('/login', function (req, res) {
    var response = {
        "username":req.query.username,
        "email":req.query.email
    };
    console.log(response);
    res.end(JSON.stringify(response));
})

/*post请求*/
app.post('/login_post',urlencodedParser, function (req, res) {
    var response = {
        "username":req.body.username,
        "email":req.body.email
    };
    console.log(response);
    res.end(JSON.stringify(response));
})

/*
* req.params.xxxxx 从path中的变量
 req.query.xxxxx 从get中的?xxxx=中
 req.body.xxxxx 从post中的变量,需引用中间件
 */

/*聊天室*/
var clientCount = 0;//在线人数

io.on('connection', function (socket) {
    var addedUser = false;

    socket.on('new message', function (data) {//监听-新消息
        var msg = {
            username: socket.username,
            message: data
        }
        socket.broadcast.emit('new message', msg);
        writerStream.write(JSON.stringify(msg),'UTF8');
    });


    socket.on('add user', function (username) {//监听-增加用户
        if (addedUser){//已存在用户
            return;
        }
        socket.username = username;
        clientCount++;
        addedUser = true;
        socket.emit('login', {//监听-登陆
            clientCount: clientCount
        });

        socket.broadcast.emit('user joined', {//有新用户上线时-广播
            username: socket.username,
            clientCount: clientCount
        });
    });


    socket.on('disconnect', function () {//监听-下线
        if (addedUser) {
            --clientCount;

            socket.broadcast.emit('user left', {
                username: socket.username,
                clientCount: clientCount
            });
        }
    });
});

server.listen(8000, function () {
    console.log('Server listening at port 8000');
});