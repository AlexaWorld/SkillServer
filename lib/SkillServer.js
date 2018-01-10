// Copyright 2017, Peter Ullrich. dotup IT solutions
var https = require('https');
var express = require('express');
var fs = require('fs');
var path = require('path');
var bodyParser = require('body-parser');
var SkillServerConfig = require('./SkillServerConfig');

function readFile(file, filePath) {
	var full = path.join(filePath, file);
	return fs.readFileSync(full, 'utf8');
}

function isValidPath(...args) {
	var folder = path.join.apply(null, args);
	try {
		return fs.statSync(folder).isDirectory();
	} catch (error) {
		return false;
	}
}

function isValidFile(file, folder) {
	if (folder)
		file = path.join(folder, file);
	try {
		return fs.statSync(file).isFile();
	} catch (error) {
		return false;
	}
}

function getCredentials(skillServer) {
	var certPath = path.join(skillServer.config.RootPath, skillServer.config.SslPath);

	var key = readFile(skillServer.config.SslPrivateKey, certPath);
	var cert = readFile(skillServer.config.SslCertificate, certPath);
	var ca = readFile(skillServer.config.SslChain, certPath);

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

function getSkillFromPackage(server, skillName) {
	var folder = path.join(server.config.RootPath, server.config.SkillPath, skillName);
	if (!isValidPath(folder))
		throw new Error(`Path <${fodler}> not found`);

	var package = JSON.parse(readFile("package.json", folder)); // fs.readFileSync(path.join(folder, ));

	var skill = {
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
			var skill = require(path.join(item.path, item.file));
			server.router.use("/" + item.name, bodyParser.json());
			server.router.post("/" + item.name, async function (req, res, callback) {
				//var json = req.body;
				try {
					var response = await skill.HttpRequestHandler(req.body, res);
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

		let folder = path.join(this.config.RootPath, skillPath, skillName);

		if (!isValidPath(folder))
			folder = path.join(this.config.RootPath, this.config.SkillPath, skillName);

		if (!isValidPath(folder))
			folder = path.join(this.config.RootPath, this.config.SkillPath, skillPath, skillName);

		let fileName = `${skillName}.js`;
		if (!isValidFile(path.join(folder, fileName)))
			fileName = "index.js";

		if (!isValidFile(path.join(folder, fileName)))
			throw new Error(`Skill <${skillName}> not found in <${skillPath}>`);

		var skill = {
			name: skillName,
			file: fileName,
			path: folder
		}

		this.skills[skill.name] = skill;
	}

	addSkillFromPackage(skillName) {
		var skill = getSkillFromPackage(this, skillName);
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