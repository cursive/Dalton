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

var Analysis = function ()	{
	var self = this;
	self.PACKETS = [];
	self.SAMPLE_LENGTH = 100;
	self.AMP = 0;
	self.PITCH = 0;
	self.socket = io.connect('localhost:8080');

	self.socket.on('pitchAmpPacket', function(data)	{
		self.pushNewPacket(data);
		self.calculateAverages();
		self.printAverages();
	});

	self.$pitch = $('#pitch');
	self.$amp = $('#amp');
};

Analysis.prototype.pushNewPacket = function(packet) {
	this.PACKETS.push(packet);
	if (this.PACKETS.length > this.SAMPLE_LENGTH)	{
		this.PACKETS = this.PACKETS.slice(1, this.PACKETS.length - 1);
	}
};

Analysis.prototype.calculateAverages = function ()	{
	var t_pitch = 0;
	var t_amp = 0;
	var scaleValue = this.PACKETS.length > 0 ? this.PACKETS.length : 1;
	for (var i = 0; i < this.PACKETS.length; i++)	{
		t_pitch += this.PACKETS[i].pitch;
		t_amp += this.PACKETS[i].amp;
	}
	this.PITCH = Math.round(t_pitch / scaleValue);
	this.AMP = Math.round(t_amp / scaleValue);
};

Analysis.prototype.printAverages = function ()	{
	this.$pitch.text(this.PITCH);
	this.$amp.text(this.AMP);
	console.log(this.AMP);
	console.log(this.PITCH);
};


Analysis.prototype.newPhrase = function ()	{
	this.PACKETS = [];
};

var a = new Analysis();



// navigator.getUserMedia = navigator.webkitGetUserMedia 
// var audioCtx = new (window.webkitAudioContext)();
// var voiceSelect = document.getElementById("voice");
// var source;
// var stream;
// var analyser = audioCtx.createAnalyser();
// var gainNode = audioCtx.createGain();
// var drawVisual;
// var buflen = 2048;
// var buf = new Uint8Array( buflen );
// //main block for doing the audio recording
// function initAudioStream(){
// 	if (navigator.getUserMedia) {
// 		console.log('getUserMedia supported.');
// 		navigator.getUserMedia (
// 	  // constraints - only audio needed for this app
// 	  {
// 	  	audio: true
// 	  },

// 	  function(stream) {
// 	  	source = audioCtx.createMediaStreamSource(stream);
// 	  	source.connect(analyser);
// 	  	gainNode.connect(audioCtx.destination);
// 	  	visualize();

// 	  	var mediaStreamSource = audioContext.createMediaStreamSource(stream);

//     // Connect it to the destination.
//     analyser = audioContext.createAnalyser();
//     analyser.fftSize = 2048;
//     mediaStreamSource.connect( analyser );
//     updatePitch();


// 	  	// toggleLiveInput()
// 	  },
// 	  function(err) {
// 	  	console.log('The following gUM error occured: ' + err);
// 	  }
// 	  );
// 	} else {
// 		console.log('getUserMedia not supported on your browser!');
// 	}
// }




// function visualize() {
// 	analyser.fftSize = 256;
// 	var bufferLength = analyser.frequencyBinCount;
// 	console.log(bufferLength);
// 	var dataArray = new Uint8Array(bufferLength);
// 	function draw() {
// 		drawVisual = requestAnimationFrame(draw);
// 		analyser.getByteFrequencyData(dataArray);
// 		var average=0;
// 		for(var i = 0; i < bufferLength; i++) {
// 			average+=dataArray[i];
// 		}
// 		average=average/bufferLength;
// 		$(".volume").css({top:100-(average*1)})

// 	};
// 	draw();
// }



// /*
// Pitch Detection
// */


// var audioContext = new AudioContext();
// var isPlaying = false;
// var sourceNode = null;
// // var analyser = null;
// var theBuffer = null;
// var pitch=0;
// //
// var rafID = null;
// var buflen = 2048;
// var buf = new Uint8Array( buflen );
// var noteStrings = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];


// function gotStream(stream) {
//     // Create an AudioNode from the stream.
//     var mediaStreamSource = audioContext.createMediaStreamSource(stream);

//     // Connect it to the destination.
//     analyser = audioContext.createAnalyser();
//     analyser.fftSize = 2048;
//     mediaStreamSource.connect( analyser );
//     updatePitch();
// }



// function toggleLiveInput() {
// 	if (isPlaying) {
//         //stop playing and return
//         sourceNode.stop( now );
//         sourceNode = null;
//         analyser = null;
//         isPlaying = false;
//         if (!window.cancelAnimationFrame)
//         	window.cancelAnimationFrame = window.webkitCancelAnimationFrame;
//         window.cancelAnimationFrame( rafID );
//     }
//     getUserMedia({audio:true}, gotStream);
// }



// function noteFromPitch( frequency ) {
// 	var noteNum = 12 * (Math.log( frequency / 440 )/Math.log(2) );
// 	return Math.round( noteNum ) + 69;
// }

// function frequencyFromNoteNumber( note ) {
// 	return 440 * Math.pow(2,(note-69)/12);
// }

// function centsOffFromPitch( frequency, note ) {
// 	return Math.floor( 1200 * Math.log( frequency / frequencyFromNoteNumber( note ))/Math.log(2) );
// }



// function autoCorrelate( buf, sampleRate ) {
// 	var MIN_SAMPLES = 4;	// corresponds to an 11kHz signal
// 	var MAX_SAMPLES = 1000; // corresponds to a 44Hz signal
// 	var SIZE = 1000;
// 	var best_offset = -1;
// 	var best_correlation = 0;
// 	var rms = 0;
// 	var foundGoodCorrelation = false;

// 	if (buf.length < (SIZE + MAX_SAMPLES - MIN_SAMPLES))
// 		return -1;  // Not enough data

// 	for (var i=0;i<SIZE;i++) {
// 		var val = (buf[i] - 128)/128;
// 		rms += val*val;
// 	}
// 	rms = Math.sqrt(rms/SIZE);
// 	if (rms<0.01)
// 		return -1;

// 	var lastCorrelation=1;
// 	for (var offset = MIN_SAMPLES; offset <= MAX_SAMPLES; offset++) {
// 		var correlation = 0;

// 		for (var i=0; i<SIZE; i++) {
// 			correlation += Math.abs(((buf[i] - 128)/128)-((buf[i+offset] - 128)/128));
// 		}
// 		correlation = 1 - (correlation/SIZE);
// 		if ((correlation>0.9) && (correlation > lastCorrelation))
// 			foundGoodCorrelation = true;
// 		else if (foundGoodCorrelation) {
// 			// short-circuit - we found a good correlation, then a bad one, so we'd just be seeing copies from here.
// 			return sampleRate/best_offset;
// 		}
// 		lastCorrelation = correlation;
// 		if (correlation > best_correlation) {
// 			best_correlation = correlation;
// 			best_offset = offset;
// 		}
// 	}
// 	if (best_correlation > 0.01) {
// 		// console.log("f = " + sampleRate/best_offset + "Hz (rms: " + rms + " confidence: " + best_correlation + ")")
// 		return sampleRate/best_offset;
// 	}
// 	return -1;
// }

// function updatePitch( time ) {
// 	var cycles = new Array;
// 	analyser.getByteTimeDomainData( buf );
// 	var ac = autoCorrelate( buf, audioContext.sampleRate );
// 	if (ac == -1) {
// 		picth=0;
// 		// console.log("Vague")
// 	} else {
// 		pitch = ac;
// 		// console.log(pitch)
// 		$(".pitch").css({left:pitch/100})

// 	}
// 	$(".pitch").css({left:pitch/100})

// 	if (!window.requestAnimationFrame)
// 		window.requestAnimationFrame = window.webkitRequestAnimationFrame;
// 	rafID = window.requestAnimationFrame( updatePitch );
// }
