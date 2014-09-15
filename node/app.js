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

var server = https.createServer(options, app).listen(port, function(){
    console.log("Express server listening on port " + port);
});

var io = require('socket.io')(server);


var OSC_HOST = '0.0.0.0',
	OSC_PORT = 3333;
var osc = require('node-osc');

var SOCKET_CLIENT = null;
console.log('Starting OSC server on ' + OSC_HOST + ':' + OSC_PORT)
var oscServer = new osc.Server(OSC_PORT, OSC_HOST);

//	Get the socket client
io.on('connection', function (socket)	{
	console.log('Client connected');
	SOCKET_CLIENT = socket;
});

io.on('disconnect', function (socker)	{
	console.log('Client disconnected');
	if (socket == SOCKET_CLIENT)	{
		SOCKET_CLIENT = null;
	}
});

//	Forward incoming OSC data
var LATEST_DB, LATEST_PITCH;
	LATEST_DB = LATEST_DB = 0;

oscServer.on('message', function (msg, rinfo){
	var packet_complete = false;

	//	handle any malformed messages
	if (msg.length <= 1)	{
		return;
	}

	if (msg[0] == 'db')	{
		LATEST_DB = msg[1];
		packet_complete = false;
	}	
	else if (msg[0] == 'pitch') 	{
		LATEST_PITCH = msg[1];
		packet_complete = true;
	}
	
	if (!packet_complete)	return;
	
	if (SOCKET_CLIENT != null)	{

		SOCKET_CLIENT.emit('pitchAmpPacket', {
			pitch: 	LATEST_PITCH,
			amp: 	LATEST_DB
		});
	}
});








app.get('/', function (req, res) {
    res.writeHead(200);
    res.end("hello world\n");
});


//	OSC
var OSC_HOST = '0.0.0.0',
	OSC_PORT = 3333;