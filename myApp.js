
var express = require('express');
var app = express();
var mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI);
var server = require('http').createServer(app);
var io = require('socket.io')(server);

const symbol = mongoose.model('Symbol',{name : String});
server.listen(8080);
if (process.env.NODE_ENV === 'production') {
  console.log('prod');
  app.use(express.static( __dirname + '/dist/charting-stock'));
}
else{
  console.log('not prod');
  console.log(__dirname);
  app.use(express.static( __dirname + '/public'));
}
const socket = require('socket.io-client')('https://ws-api.iextrading.com/1.0/tops')

// Listen to the channel's messages
socket.on('message', message => { 
  console.log(message);
  console.log(process.env.NODE_ENV);
  io.on('connection', function (socket) {
    symbol.find({},function(err,Symbols){
      if(Symbols){
        socket.emit('activeSymbols',{active:Symbols});
      }
    });
    socket.emit('Stock', message);
    
    socket.on('AddSymbol',function(data){
      console.log("Adding Symbol");
      symbol.findOne({'name':data.symbol},function(err,Symbol){
        if(err){
          console.log(err);
        }
        if(Symbol){
          socket.emit('RecieveSymbol',{error:"Symbol Already exists"});
        }
        else{
          const newsymbol = new symbol({name:data.symbol});
          newsymbol.save().then(() => {
            symbol.find({},function(err,Symbols){
            if(Symbols){
              console.log('Broadcasting');
              io.sockets.emit('activeSymbols',{active:Symbols});
            }
        });
          });
          //socket.emit('RecieveSymbol',data);
        }
      });   
    });
    socket.on('deleteElement',function(data){
      symbol.deleteOne({name:data.symbol},function(err){
        if(!err) {
          console.log('Deleted '+data);
          symbol.find({},function(err,Symbols){
            if(Symbols){
              console.log('Broadcasting');
              socket.broadcast.emit('renderDelete',{data:data.symbol});
            }
        });
        }
      });
    });
    
  });
  //io.emit('Stock',message);
})

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
  if (process.env.NODE_ENV === 'production') {
    return res.sendFile(__dirname + '/dist/charting-stock/index.html');
  }
  else{
    return res.sendFile(__dirname + '/views/index.html');
  }
});
//---------- DO NOT EDIT BELOW THIS LINE --------------------

 module.exports = app;
