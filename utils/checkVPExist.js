process.env.NODE_PATH= __dirname;
var qrsInteract = require('../lib/qrsinteractions');
var config = require('../config/config');
var winston = require('winston');
var Promise = require('bluebird');
var fs = require('fs');

//set up logging
var logger = new (winston.Logger)({
	level: config.logLevel,
	transports: [
      new (winston.transports.Console)(),
      new (winston.transports.File)({ filename: config.logFile})
    ]
});

process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
});

logger.info('Checking for existence of virtual proxy prefix ' + process.argv[4] + ' on ' + process.argv[2] + ' on port ' + process.argv[3], {module: 'checkVPExist.js'});

var path = "https://" + process.argv[2] + ":" + process.argv[3] + "/qrs/virtualProxyConfig/full";
    path +=  "?xrfkey=ABCDEFG123456789&filter=prefix eq '" + process.argv[4] + "'";

qrsInteract.get(path)
.then(function(result)
{
    if(JSON.stringify(result)=='[]')
    {
        //the virtual proxy doesn't exist.
        logger.info('The virtual proxy: ' + process.argv[4] + ' does not exist.', {module: 'checkVPExist'});
    }
    else
    {
        fs.writeFileSync(config.utilsPath + '/checkVPExist.txt', 'true');    
    }
})
.catch(function(error)
{
    //do nothing
});