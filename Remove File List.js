var trash = require("trash"),
	fs = require("fs"),
	path = require("path"),
	file = process.argv[2];
	
process.chdir(path.dirname(file));
	
var data = fs.readFileSync(file, "utf8");

trash(data.split("\n").filter(l => l)).catch(console.log);
