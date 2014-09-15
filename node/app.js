var fs = require('fs'),
    http = require('http'),
    https = require('https'),
    express = require('express'),
    morgan = require('morgan');
    

var port = 8080;

var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

var app = express();

app.use(express.static(__dirname + '/public'));   // set the static files location /public/img will be /img for users
app.use(morgan('dev'));           //







var server=https.createServer(options, app).listen(port, function(){
    console.log("Express server listening on port " + port);
});


io = require('socket.io')(server);
io.on('connection', function(socket) {
    console.log('a user connected');
    io.emit('new user', "User Joined");
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
    socket.on('promptScreen', function(msg) {
        io.emit('promptScreen',msg);
        console.log('promptScreen: '+msg);
    });   
});


app.get('/', function (req, res) {
    res.writeHead(200);
    res.end("hello world\n");
});