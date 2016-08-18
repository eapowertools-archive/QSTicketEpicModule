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
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

logger.info('Firing up the QS ticket Epic Module',{module:'server'});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cookieParser());

logger.info('Setting port',{module:'server'});

var port = config.serverPort || 3001;

logger.info('Setting route',{module:'server'});

var epicRoutes = require('./routes/routes');



//Register routes
//all routes will be prefixed with api
app.use('/epic',epicRoutes);

//Start the server

//COMMENT OUT ONE OF THE FOLLOWING SECTIONS//
/*************************************/
//If using the Qlik Sense generated certs for server authentication from browsers, 
//use this section.
var httpsOptions = {
    cert: fs.readFileSync(config.certificates.server),
    key: fs.readFileSync(config.certificates.server_key)
};
/*************************************/

/*************************************/
//If using a third party certificate from a trusted certificate authority,
//use this section to point to a server certificate
/*
var httpsOptions = {
//    cert: fs.readFileSync(%PATH TO SERVER CERT IN PEM FORMAT%),
//    key: fs.readFileSync(%PATH TO SERVER CERT PRIVATE KEY IN PEM FORMAT%)
// OR IF USING PFX //
//    pfx: fs.readFileSync(%PATH TO SERVER CERT IN PFX FORMAT WITH PRIVATE KEY%),
//    passphrase: '%STRING representing password for pfx file%'
};
*/
/*************************************/

var server = https.createServer(httpsOptions, app);
server.listen(port, function()
{
    logger.info('qsticketepicmodule started',{module:'server'});
});
