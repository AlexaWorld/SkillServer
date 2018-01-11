var skillServer = require('../lib/SkillServer');

//var configFile = ;
//var config = require(`../skills/${appName}/config.json`);
var appName = 'test1';

var server = new skillServer(44303);

server.configure(config => {
	config.RootPath = __dirname + '/../../';
//	config.SkillPath = 'src/skills';
	config.SslPath = 'sslcert';
	config.SslPrivateKey = 'privkey1.pem';
	config.SslCertificate = 'cert1.pem';
	config.SslChain = 'chain1.pem';
});

server.start();
