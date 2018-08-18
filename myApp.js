
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

server.listen(8080);
app.use(express.static( __dirname + '/public'));
const socket = require('socket.io-client')('https://ws-api.iextrading.com/1.0/tops')

// Listen to the channel's messages
socket.on('message', message => { console.log(message);io.emit('Stock',message);})

// Connect to the channel
socket.on('connect', () => {

  // Subscribe to topics (i.e. appl,fb,aig+)
  socket.emit('subscribe', 'msft')

  // Unsubscribe from topics (i.e. aig+)
  socket.emit('unsubscribe', 'aig+')
})

// Disconnect from the channel
socket.on('disconnect', () => console.log('Disconnected.'))

app.get('/', function(req,res){
  return res.sendFile(__dirname + '/views/index.html');
});
//---------- DO NOT EDIT BELOW THIS LINE --------------------

 module.exports = app;
