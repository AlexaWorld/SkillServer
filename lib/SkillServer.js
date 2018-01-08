// Copyright 2015, Peter Ullrich. dotup IT solutions
var https = require('https');
var express = require('express');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');

var Ssl = {
	path: 'certs',
	privateKey: '',
	certificate: '',
	chain: '',
}

function readFile(file, filePath) {
	var full = path.join(filePath, file);
	return fs.readFileSync(full, 'utf8');
}

function getCredentials(skillServer) {
	var certPath = path.join(skillServer.RootPath, skillServer.Ssl.path);

	var key = readFile(skillServer.Ssl.privateKey, certPath);
	var cert = readFile(skillServer.Ssl.certificate, certPath);
	var ca = readFile(skillServer.Ssl.chain, certPath);

	return {
		key: key,
		cert: cert,
		ca: ca
	};
}

function getRouter() {
	var router = express.Router();
	return router;
}

function loadSkills(server) {
	for (const key in server.skills) {
		if (server.skills.hasOwnProperty(key)) {
			const item = server.skills[key];
			var skill = require(path.join(server.RootPath, item.path, item.name));
			server.router.use("/" + item.name, bodyParser.json());
			server.router.post("/" + item.name, async function (req, res, callback) {
				//var json = req.body;
				try {
					var response = await skill.RequestHandler(req.body, res);
					if (typeof response !== "string")
						response = response.Build();
					res.json(response).send();
				} catch (error) {
					res.status = 500;
					callback(error);
				}
			});
		}
	}
}

class SkillServer {
	constructor(port) {
		this.port = port || 443;
		this.ssl = Ssl;
		this.rootPath = __dirname;
		this.skills = {};
	}

	set Port(value) {
		this.port = value;
	}
	get Port() {
		return this.port;
	}

	set Ssl(value) {
		this.ssl = value;
	}
	get Ssl() {
		return this.ssl;
	}

	set RootPath(value) {
		this.rootPath = value;
	}
	get RootPath() {
		return this.rootPath;
	}

	addSkill(skill) {
		this.skills[skill.name] = skill;
	}

	start() {
		this.express = express();
		var httpsServer = https.createServer(getCredentials(this), this.express);
		//this.server = httpsServer.listen(this.Port, this.Host);
		this.server = httpsServer.listen(this.Port);
		this.router = getRouter(this);
		this.express.use("/alexa", this.router);
		loadSkills(this);
	}
}

module.exports = SkillServer;