var socket = io();
var recognition;
var interimResult = '';
var textArea = $('#speech-page-content');
var textAreaID = 'speech-page-content';
var keyIsDown=false;
$(document).ready(function() {
	initRecognition();
	initButtons();
	// initAudioStream();

	window.addEventListener("keypress", kd, false);
	window.addEventListener("keyup", ku, false);
	$("textarea").blur();

});

GLOBAL_SOCKET = io.connect('localhost:8080');


/**
New from Dan
**/

socket.on('promptScreen', function(msg){
	console.log("Prompt: "+msg);
	$("#speech-page-content").val(msg)
	newMessage();
});


/**
End new from Dan
**/
function ku(){

	
	if(keyIsDown){
		console.log("ku")
		recognition.stop();
		keyIsDown=false;
	}
}

function kd(){
	if(!keyIsDown){
		console.log("kd")
		keyIsDown=true;
		startRecognition();
	}
}

// for(var i=0;i<17;i++){
// console.log(".f"+i+" {font-family: 'f"+i+"';}");
// }

function initRecognition(){
	try {
		recognition = new webkitSpeechRecognition();
	} catch(e) {
		recognition = Object;
	}
	recognition.continuous = true;
	recognition.interimResults = true;
	recognition.onresult = function (event) {
		console.log("onresult")
		var pos = textArea.getCursorPosition() - interimResult.length;
		textArea.val(textArea.val().replace(interimResult, ''));
		interimResult = '';
		textArea.setCursorPosition(pos);
		for (var i = event.resultIndex; i < event.results.length; ++i) {
			if (event.results[i].isFinal) {
				insertAtCaret(textAreaID, event.results[i][0].transcript);
			} else {
				isFinished = false;
				insertAtCaret(textAreaID, event.results[i][0].transcript + '\u200B');
				interimResult += event.results[i][0].transcript + '\u200B';
			}
		}
	};
	recognition.onend = function() {
		
		console.log($("#speech-page-content").val())
		newMessage();
		// $("textarea").value()
		console.log("onend")
	};
}

function initButtons(){
	$('.start').click(function(){
		startRecognition();
	});

	$('.end').click(function(){
		console.log("stop")
		recognition.stop();
		// newMessage();
	});
}

function startRecognition () {
	console.log("start")
	textArea.focus();
	recognition.start();
};

function newMessage(){
	console.log($("textarea").text())
	$(".message").removeClass("active");
	var r=Math.floor(Math.random()*16)
	console.log("f"+r)
	var msg=$("#speech-page-content").val()
	msg =msg.substr(1, msg.length)
	$(".messages").append('<div class="message active f'+r+'">'+msg+'</div>');
	$("#speech-page-content").val("")
	if($(".messages").height()>1000){
		TweenMax.to(".messages",0.5,{top:"-=100"})
	}
}


function saveLatest(text, pitch, amplitude, font)	{
	socket.emit('newVoiceData', {
		text: 			'test',
		pitch: 			10,
		amplitude: 		10,
		font: 			'Test Font'
	});
}


/*
	BUTTON MANAGER
*/
var ButtonManager = function ()	{
	var self = this;
	self.socket = GLOBAL_SOCKET;
	self.socket.on('latestButtonState', function (data)	{
		console.log('received button state:', data.button);
	});
};
var b = ButtonManager();

/*
	RECEIVE PITCH ANALYSIS
*/
var Analysis = function ()	{
	var self = this;
	self.packets = [];
	self.sampleLength = 100;
	self.amp = 0;
	self.pitch = 0;
	self.socket = GLOBAL_SOCKET;

	self.pitchRange = {
		low: 	0,
		high: 	127
	};

	self.ampRange = {
		low: 	40,
		high: 	90
	};

	self.socket.on('pitchAmpPacket', function(data)	{
		self.pushNewPacket(data);
		self.calculateAverages();
		self.printAverages();
	});

	self.$pitch = $('#pitch');
	self.$amp = $('#amp');
};

Analysis.prototype.boundWithBounds = function (value, bounds)	{
	value = value > bounds.high ? bounds.high : value;
	value = value < bounds.low ? bounds.low : value;
	return value;
}

Analysis.prototype.boundPacket = function (packet)	{
	packet.amp = this.boundWithBounds(packet.amp, this.ampRange);
	packet.pitch = this.boundWithBounds(packet.pitch, this.pitchRange);
	return packet;
};

Analysis.prototype.pushNewPacket = function(packet) {
	this.packets.push(this.boundPacket(packet));
	if (this.packets.length > this.sampleLength)	{
		this.packets = this.packets.slice(1, this.packets.length - 1);
	}
};

Analysis.prototype.calculateAverages = function ()	{
	var t_pitch = 0;
	var t_amp = 0;
	var scaleValue = this.packets.length > 0 ? this.packets.length : 1;
	for (var i = 0; i < this.packets.length; i++)	{
		t_pitch += this.packets[i].pitch;
		t_amp += this.packets[i].amp;
	}
	this.pitch = Math.round(t_pitch / scaleValue);
	this.amp = Math.round(t_amp / scaleValue);
};

//	give this a {pitch, amp} object, get a mapped one back
Analysis.prototype.mapValues = function (input)	{
	return {
	 	pitch: 	Math.round((input.pitch / this.pitchRange.high) * 5),
	 	amp: 	Math.round((input.amp / this.ampRange.high) * 5)
	}
};

Analysis.prototype.printAverages = function ()	{
	this.$pitch.text(this.pitch);
	this.$amp.text(this.amp);
	console.log(this.amp);
	console.log(this.pitch);
};

Analysis.prototype.newPhrase = function ()	{
	this.packets = [];
};

var a = new Analysis();

