// Copyright 2017, Peter Ullrich. dotup IT solutions
var https = require('https');
var express = require('express');
var fs = require('alexaworld-nodejs-common').filesystem;
var bodyParser = require('body-parser');
var SkillServerConfig = require('./SkillServerConfig');
const isTypeOf = require('alexaworld-nodejs-common').isTypeOf;

function getCredentials(skillServer) {
	var certPath = fs.join(skillServer.config.RootPath, skillServer.config.SslPath);

	var key = fs.readFile(skillServer.config.SslPrivateKey, certPath);
	var cert = fs.readFile(skillServer.config.SslCertificate, certPath);
	var ca = fs.readFile(skillServer.config.SslChain, certPath);

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

function getSkillFromPackage(server, skillPath) {
	var folder = fs.join(server.config.RootPath, skillPath);
	if (!fs.pathExists(folder))
		throw new Error(`Path <${folder}> not found`);

	var package = fs.readJsonFile("package.json", folder); // fs.readFileSync(path.join(folder, ));

	let appId = package.AlexaWorld && package.AlexaWorld.APP_ID ? package.AlexaWorld.APP_ID : null;

	var skill = {
		appId: appId,
		description: package.description,
		version: package.version,
		name: package.name,
		file: package.main,
		path: folder
	}
	return skill;
}

function loadSkills(server) {
	for (const key in server.skills) {
		if (server.skills.hasOwnProperty(key)) {
			const item = server.skills[key];
			var skill = require(fs.join(item.path, item.file));
			if (isTypeOf(skill, "NodeSkill") && item.appId)
				skill.AppId = item.appId;
			server.router.use("/" + item.name, bodyParser.json());
			server.router.post("/" + item.name, async function (req, res, callback) {
				//var json = req.body;
				try {
					let log = req.body.request.type;
					if (req.body.request.intent)
						log += ` (${req.body.request.intent.name})`;
					console.log(log);
					// skill.handler(req.body, res);
					var response = await skill.HttpRequestHandler(req.body, res);
					res.json(response).send();
				} catch (error) {
					res.status = 500;
					callback(error);
				}
			});
			console.log(`Skill: ${item.name} | Description: ${item.description} | Version: ${item.version} mapped to "/alexa/${item.name}"`);
		}
	}
}

class SkillServer {
	constructor(port) {
		this.config = new SkillServerConfig();
		this.config.Port = port;
		this.skills = {};
	}

	configure(configurator) {
		configurator(this.config);
	}

	addSkill(skillName, skillPath) {
		if (!skillPath)
			skillPath = '';

		const folder = fs.join(this.config.RootPath, skillPath, skillName);

		// let files = [
		// 	`${skillName}.js`,
		// 	"index.js"
		// ];

		//var file = fs.getFirstExistingFile(files, folders);

		if (!fs.pathExists(folder))
			throw new Error(`Path <${folder}> not found`);

		if (!fs.fileExists(file, folder))
			throw new Error(`Skill <${skillName}> file (${file}) not found.`);

		var skill = {
			name: skillName,
			file: file,
			path: folder
		}

		this.skills[skill.name] = skill;
	}

	addSkillFromPackage(skillName, skillPath) {
		if (!skillPath)
			skillPath = '';

		var skill = getSkillFromPackage(this, skillPath);
		this.skills[skill.name] = skill;
	}

	start() {
		this.express = express();
		var httpsServer = https.createServer(getCredentials(this), this.express);
		//this.server = httpsServer.listen(this.Port, this.Host);
		this.server = httpsServer.listen(this.config.Port);
		this.router = getRouter(this);
		this.express.use("/alexa", this.router);
		loadSkills(this);
	}
}

module.exports = SkillServer;