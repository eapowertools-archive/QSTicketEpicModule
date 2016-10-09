//require statements
process.env.NODE_PATH= __dirname;
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var winston = require('winston');
var config = require('./config/config');
var https = require('https');
var fs = require('fs');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logging.logFile})
    ]
});

logger.info('Firing up the QS ticket Epic Module',{module:'server'});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

logger.info('Setting port',{module:'server'});

var port = config.thisServer.port || 3001;

logger.info('Setting route',{module:'server'});

var epicRoutes = require('./routes/routes');



//Register routes
//all routes will be prefixed with api
app.use('/epic',epicRoutes);

var httpsOptions = {}

  if(config.thisServer.hasOwnProperty("certificates"))
  {
      if(config.thisServer.certificates.server !== undefined)
      {
        //pem files in use
        httpsOptions.cert = fs.readFileSync(config.thisServer.certificates.server);
        httpsOptions.key = fs.readFileSync(config.thisServer.certificates.server_key);
      }

      if(config.thisServer.certificates.pfx !== undefined)
      {
        httpsOptions.pfx = fs.readFileSync(config.thisServer.certificates.pfx);
        httpsOptions.passphrase = config.thisServer.certificates.passphrase;
      }
  }
  else
  {
    httpsOptions.cert = fs.readFileSync(config.certificates.server),
    httpsOptions.key = fs.readFileSync(config.certificates.server_key)
  }


//Start the server


var server = https.createServer(httpsOptions, app);
server.listen(port, function()
{
    logger.info('qsticketepicmodule started on port: ' + port,{module:'server'});
});
