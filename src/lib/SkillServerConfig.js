
class SkillServerConfig {
	constructor(port) {
		this.port = port || 443;
		this.rootPath = __dirname;
		this.sslPath = 'certs';
		this.sslPrivateKey = '';
		this.sslCertificate = '';
		this.sslChain = '';
		this.skillPath = '';
	}

	set SkillPath(value) { this.skillPath = value; }
	get SkillPath() { return this.skillPath; }
	
	set RootPath(value) { this.rootPath = value; }
	get RootPath() { return this.rootPath; }

	set Port(value) { this.port = value; }
	get Port() { return this.port; }	

	set SslPath(value) { this.sslPath = value; }
	get SslPath() { return this.sslPath; }

	set SslPrivateKey(value) { this.sslPrivateKey = value; }
	get SslPrivateKey() { return this.sslPrivateKey; }

	set SslCertificate(value) { this.sslCertificate = value; }
	get SslCertificate() { return this.sslCertificate; }

	set SslChain(value) { this.sslChain = value; }
	get SslChain() { return this.sslChain; }
}

module.exports = SkillServerConfig;