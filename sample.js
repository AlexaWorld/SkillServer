var skillServer = require('./lib/SkillServer');

//var configFile = ;
//var config = require(`../skills/${appName}/config.json`);
var appName = 'test1';

var server = new skillServer(44303);
server.RootPath = __dirname;

server.Ssl = {
	path:'sslcert',
	privateKey: 'privkey1.pem',
	certificate: 'cert1.pem',
	chain: 'chain1.pem',
};


server.start();
