var fs = require('fs'),
    http = require('http'),
    https = require('https'),
    express = require('express'),
    morgan = require('morgan'),
    fs = require('fs'),
    SerialPort = require('serialport').SerialPort;
    

var port = 8080;

var options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

var app = express();

app.use(express.static(__dirname + '/public'));   // set the static files location /public/img will be /img for users
app.use(morgan('dev'));

var server = https.createServer(options, app).listen(port, function(){
    console.log("Express server listening on port " + port);
});


/*
#####################################
			SOCKET.IO
#####################################
*/

var io = require('socket.io')(server);

var SOCKET_CLIENT = null;


//	Get the socket client
io.on('connection', function (socket)	{
	console.log('Client connected');

    console.log('a user connected');
    io.emit('new user', "User Joined");
    socket.on('disconnect', function() {
        console.log('user disconnected');
    });
    socket.on('promptScreen', function(msg) {
        io.emit('promptScreen',msg);
        console.log('promptScreen: '+msg);
    });  

    socket.on('newVoiceData', function (data)	{
		//	get the json (string, timestamp, pitch, amplitude, font string)
		console.log(data);
		saveToFileSystem(data);
	});

	SOCKET_CLIENT = socket;

});

io.on('disconnect', function (socket)	{
	console.log('Client disconnected');
	if (socket == SOCKET_CLIENT)	{
		SOCKET_CLIENT = null;
	}
});

/*
#####################################
				O S C
#####################################
*/
var OSC_HOST = '0.0.0.0',
	OSC_PORT = 3333;
var osc = require('node-osc');
console.log('Starting OSC server on ' + OSC_HOST + ':' + OSC_PORT)
var oscServer = new osc.Server(OSC_PORT, OSC_HOST);


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



/*
#####################################
				SERIAL
#####################################
*/
var files = fs.readdirSync('/dev');
files.forEach(function (file)	{

	fs.lstat('/dev/' + file, function (err, stats)	{

		if (file.indexOf('tty.usbmodem') != -1 || file.indexOf('tty.usbserial') != -1)	{

			var port = '/dev/' + file;
			
			console.log('Got serial port: ', port);

			var serial = new SerialPort(port, {
				baudrate: 	9600
			});

			serial.open(function ()	{
				console.log('Opening ', port);
			});

			var lastTrackedButtonState = -1;
			var TERMINATOR = '%';
			var incomingStringBuffer = "";
			serial.on('data', function (data)	{
				var dataString = data.toString();
				incomingStringBuffer += dataString;
				if (dataString.indexOf(TERMINATOR) != -1)	{
					var incomingString = incomingStringBuffer.split(TERMINATOR)[0];
					incomingStringBuffer = "";
					var newButtonState = Number(incomingString);
					if (newButtonState != lastTrackedButtonState && SOCKET_CLIENT != null)	{
						SOCKET_CLIENT.emit('latestButtonState', {
							button: 	newButtonState == 1	
						});
						lastTrackedButtonState = newButtonState;
						console.log(newButtonState == 1);
					}
				}
			});
		}
	});
});


/*
#####################################
		SAVE TO FILE SYSTEM

Files will be saved individually and
also to a single master JSON file. 

#####################################
*/
var MASTER_JSON = [];
(function ()	{
	fs.readFile('./saved_json/master.json', 'utf8', function (err, data) {
		if (err)	 {
			MASTER_JSON = [];
			console.log('Error loading MASTER JSON 0x0');
		}	else 	{
			try 	{
				var t_json = JSON.parse(data);
				MASTER_JSON = t_json;
				console.log('Loaded MASTER JSON 0x1');
			}	
			catch (e) 	{
				MASTER_JSON = [];
				console.log('Error loading MASTER JSON 0x2');
			}
		}
	});
})();

function saveToFileSystem(data)	{
	var fileName = new Date().getTime();
	data.timestamp = fileName;

	var prettyJson = JSON.stringify(data, null, 4);
	
	var path = ('./saved_json/individual/' + fileName + '.json');

	fs.writeFile(path, prettyJson, function(err)	{
		if (err)	{
			console.log('Write failed...');
		}	else 	{
			console.log('JSON Saved');
		}
	});

	MASTER_JSON.push(data);
	var masterPath = './saved_json/master.json';
	fs.writeFile(masterPath, JSON.stringify(MASTER_JSON, null, 4), function (err)	{
		if (err)	{
			console.log('Write failed...');
		}	else 	{
			console.log('JSON Saved');
		}
	});
}