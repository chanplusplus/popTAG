/*
 This example code I find it at :
 https://github.com/Blackmist/hdinsight-eventhub-example/blob/master/dashboard/server.js
*/

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;
var exec = require('exec');

//Serve up static files
app.use('/table', express.static(__dirname + '/public1'));
app.use('/chart', express.static(__dirname + '/public2'));
//app.use('/table', express.static('table'));

server.listen(port, function() {
  console.log('server listening at port %d', port)
});

//Handle Socket.io connections
var blankCnt = 0;
var pathToJAR = '../../java2/out/artifacts/TweetTopTagByLanguage_jar/';
var startcmd = 'spark-submit --class com.tweetapp.Main --master spark://ec2-13-250-52-53.ap-southeast-1.compute.amazonaws.com:7077 ../java/PopularTweetTag-3.0-SNAPSHOT-jar-with-dependencies.jar';
var sparkOn = false;
io.on('connection', function(socket) {
  socket.emit('server',{});
  socket.on('browser' ,function(data) {
     console.log('Visited while sparkOn='+sparkOn);
     if(sparkOn) return;
     sparkOn = true;
     exec('find /tmp -name "blockmgr*" | xargs rm -r', function(err,out,code){});
     exec(startcmd, function(err, out, code) {
       if (err instanceof Error) throw err;
       process.stderr.write(err);
       //process.stdout.write(out);
       //process.exit(code);
     })
  });

  socket.on('topTags', function(data) {
  	console.log('Get blank input ' + blankCnt + ' times');
  	//var rnd = Math.random()*10 
  	//console.log('Random value = ' + rnd);
  	if(blankCnt > 3) {
            console.log('Shutdown');
  	        socket.emit('shutdown', {});
            blankCnt = 0;
            sparkOn = false;
            socket.broadcast.emit('server',{});
            return;
  	}
  	else if(!data.length) blankCnt++;

    //console.log('topTags N=' + data.length );
    socket.broadcast.emit('topTags', data);

  });

  socket.on('topTagByLangs', function(data) {
    //console.log('got topLangsByTag' );
    socket.broadcast.emit('topTagByLangs', data);
  });

});
