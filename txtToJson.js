var fs = require("fs");

var raw = fs.readFileSync(process.argv[2], 'utf-8');
var a = raw.split("\n");
console.log(a.length);
fs.writeFileSync(process.argv[2]+".json", JSON.stringify(a));
