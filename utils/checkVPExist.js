process.env.NODE_PATH= __dirname;
var qrsInteract = require('qrs-interact');
var config = require('../config/config');
var winston = require('winston');
var Promise = require('bluebird');
var fs = require('fs');

//set up logging
var logger = new (winston.Logger)({
	level: config.logging.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logging.logFile})
    ]
});

var qrsConfig = {
    hostname: config.qrs.hostname,
    localCertPath: config.certificates.certPath
};

var qrs = new qrsInteract(qrsConfig);

process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});

logger.info('Checking for existence of virtual proxy prefix ' + process.argv[4] + ' on ' + process.argv[2] + ' on port ' + process.argv[3], {module: 'checkVPExist.js'});

var path = "virtualProxyConfig/full";
    path +=  "?xrfkey=ABCDEFG123456789&filter=prefix eq '" + process.argv[4] + "'";

qrs.Get(path)
.then(function(result)
{
    if(JSON.stringify(result)=='[]')
    {
        //the virtual proxy doesn't exist.
        logger.info('The virtual proxy: ' + process.argv[4] + ' does not exist.', {module: 'checkVPExist'});
    }
    else
    {
        fs.writeFileSync(config.thisServer.utilsPath + '/checkVPExist.txt', 'true');    
    }
})
.catch(function(error)
{
    //do nothing
});