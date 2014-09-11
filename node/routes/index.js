var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	res.render('index', { title: 'Express' });
});

/**
Room 1
**/
router.get('/helloworld', function(req, res) {
	//res.render('helloworld', { title: 'Hello, World!' })
	//io.emit('phone1ir', "sadas");	
console.log("weqwrqwe");
    res.writeHead(200);
  res.end("hello 2222\n");

});



module.exports = router;