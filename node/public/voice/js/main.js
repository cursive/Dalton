var socket = io();
var recognition;
var interimResult = '';
var scrollBoundary=600;
var textArea = $('#speech-page-content');
var textAreaID = 'speech-page-content';
var keyIsDown=false;
var r1=Math.ceil(Math.random()*5)
var r2=Math.ceil(Math.random()*5)
$(document).ready(function() {
	initRecognition();
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
	r1=Math.ceil(Math.random()*5)
	r2=Math.ceil(Math.random()*5)
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
		console.log("onend")
	};
}



function startRecognition () {
	console.log("start")
	textArea.focus();
	recognition.start();
};

function newMessage(){
	console.log($("textarea").text())
	$(".message").removeClass("active");
	console.log("f"+r1+""+r2)
	var msg=$("#speech-page-content").val()
	$(".messages").append('<div class="message active f'+r1+''+r2+'">'+msg+'</div>');
	$(".messageSmall").text(msg);
	$("#speech-page-content").val("")
	if($(".messages").height()>scrollBoundary){
		var h=$(".messageSmall").height();
		console.log("height: "+$(".message:last-child").height())
		TweenMax.to(".messages",0.5,{top:"-="+h})
	}

	var finalPitchAmp = a.getFinalPitchAmp();
	saveLatest(msg, finalPitchAmp.pitch, finalPitchAmp.amp);
}


function saveLatest(text, pitch, amplitude)	{
	socket.emit('newVoiceData', {
		text: 			text,
		pitch: 			pitch,
		amplitude: 		amplitude
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
			if (!keyIsDown)	{
				return;
			}
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

Analysis.prototype.getFinalPitchAmp = function ()	{
	var retVal = this.mapValues({
		amp: 	this.amp,
		pitch: 	this.pitch
	});
	this.newPhrase()
	return retVal;
};

Analysis.prototype.printAverages = function ()	{
	this.$pitch.text(this.pitch);
	this.$amp.text(this.amp);
	console.log(this.amp);
	console.log(this.pitch);
};

Analysis.prototype.newPhrase = function ()	{
	this.packets = [];
	this.pitch = this.amp = 0;
};

var a = new Analysis();

/*
Dan stuff
*/

function t(){
	r1=Math.ceil(Math.random()*5)
	r2=Math.ceil(Math.random()*5)
	$("#speech-page-content").val(phrases[Math.ceil(phrases.length*Math.random())])
	newMessage();
}


var phrases=["Don't cry because it's over, smile because it happened",
"Be yourself; everyone else is already taken",
"Be who you are and say what you feel, because those who mind don't matter, and those who matter don't mind",
"Two things are infinite: the universe and human stupidity; and I'm not sure about the universe",
"You know you're in love when you can't fall asleep because reality is finally better than your dreams",
"So many books, so little time",
"You only live once, but if you do it right, once is enough",
"A room without books is like a body without a soul",
"Be the change that you wish to see in the world",
"In three words I can sum up everything I've learned about life: it goes on",
"No one can make you feel inferior without your consent."];



