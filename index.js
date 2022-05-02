// Place your server entry point code here
const express = require('express')
const app = express()
const morgan = require('morgan')
const fs = require('fs')
const minimist = require('minimist')
const args = minimist(process.argv.slice(2))

const db = require(".src/services/database.js")

app.use(express.urlencoded({ extended: true }))
app.use(express.json())

app.use(express.static('./public'))

args["port"]
const port = args.port || process.env.PORT || 5000

const help = (`
server.js [options]
--port, -p	Set the port number for the server to listen on. Must be an integer
            between 1 and 65535.
--debug, -d If set to true, creates endlpoints /app/log/access/ which returns
            a JSON access log from the database and /app/error which throws 
            an error with the message "Error test successful." Defaults to 
            false.
--log		If set to false, no log files are written. Defaults to true.
            Logs are always written to database.
--help, -h	Return this message and exit.
`)

if (args.help || args.h) {
    console.log(help)
    process.exit(0)
}

if (args.log == 'false') {
    console.log("NOTICE: not creating file access.log")
} else {
    const logdir = './log/';

    if (!fs.existsSync(logdir)){
        fs.mkdirSync(logdir);
    }
    const accessLog = fs.createWriteStream( logdir+'access.log', { flags: 'a' })
    app.use(morgan('combined', { stream: accessLog }))
}

app.use((req, res, next) => {
    let logdata = {
        remoteaddr: req.ip,
        remoteuser: req.user,
        time: Date.now(),
        method: req.method,
        url: req.url,
        protocol: req.protocol,
        httpversion: req.httpVersion,
        status: res.statusCode,
        referrer: req.headers['referer'],
        useragent: req.headers['user-agent']
    };
    const stmt = logdb.prepare('INSERT INTO accesslog (remoteaddr, remoteuser, time, method, url, protocol, httpversion, status, referrer, useragent) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
    const info = stmt.run(logdata.remoteaddr, logdata.remoteuser, logdata.time, logdata.method, logdata.url, logdata.protocol, logdata.httpversion, logdata.status, logdata.referrer, logdata.useragent)
    next();
})

app.get("/app/", (req, res, next) => {
    res.json({"message":"Your API works! (200)"});
	res.status(200);
});

app.get('/app/flip', (req, res) => {
    var flip = coinFlip()
    res.type('text/plain')
    res.status(200).json({ 'flip' : flip })
  })
  
  app.get('/app/flip/call/heads', (req, res) => {
    var heads = flipACoin('heads')
    res.type('text/plain')
    res.status(200).json({ 'call' : heads.call, 'flip' : heads.flip, 'result' : heads.result })
  })
  
  app.get('/app/flip/call/tails', (req, res) => {
    var tails = flipACoin('tails')
    res.type('text/plain')
    res.status(200).json({ 'call' : tails.call, 'flip' : tails.flip, 'result' : tails.result })
  })
  
  app.get('/app/flips/:number', (req, res) => {
    var coinFlipsResult = coinFlips(req.params.number)
    var countFlipsResult = countFlips(coinFlips)
    res.type('text/plain')
    res.status(200).json({ 'raw' : coinFlipsResult, 'summary' : countFlipsResult })
  })
  
  //Default response for any other request (default endpoint)
  app.use(function(req, res){
      res.json({"message":"Endpoint not found. (404)"});
    res.status(404);
  })
  
  process.on('SIGTERM', () => {
    server.close(() => {
        console.log('Server stopped')
    })
  })
  
  //Functions used for flipping the coin
  function coinFlip() {
    return Math.random() > .5 ? ("heads") : ("tails");
  }
  
  function coinFlips(flips) {
    const results = [];
    for (let i = 0; i < flips; i++) {
      results[i] = coinFlip();
    }
    return results;
  }
  
  function countFlips(array) {
    let results = {heads: 0, tails: 0};
    for (let i = 0; i < array.length; i++) {
      if (array[i] == "heads") {
        results.heads = results.heads + 1;
      }
      if (array[i] == "tails") {
        results.tails = results.tails + 1;
      }
    }
    return results;
  }
  
  function flipACoin(call) {
    let flip = coinFlip();
    let result = "lose";
    if (call == flip) {
      result = "win";
    }
    return {call: call, flip: flip, result: result};
  }

if (args.debug || args.d) {
    app.get('/app/log/access/', (req, res, next) => {
        const stmt = logdb.prepare("SELECT * FROM accesslog").all();
	    res.status(200).json(stmt);
    })

    app.get('/app/error/', (req, res, next) => {
        throw new Error('Error test works.')
    })
}

const server = app.listen(port, () => {
    console.log(`App is running on port ${port}`)
})

process.on('SIGINT', () => {
    server.close(() => {
		console.log('\nApp stopped.');
	});
});