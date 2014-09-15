var socket = io();
$(document).ready(function() {
	
	$('button').click(function(){
		console.log(1)
		socket.emit('promptScreen',$("textarea").val());
		$("textarea").val('');
	});

});

