// dirty script to generate photos attributes for POIs from file names.

var fs = require('fs');
var path = require('path');

var photosDir = '../app/content/photos';
var output = '';

fs.readdirSync(photosDir).forEach(function(dir) {
    var node = [];
    var stats = fs.statSync(path.join(__dirname, photosDir, dir));
    if (stats.isDirectory()) {
        fs.readdirSync(path.join(__dirname, photosDir, dir)).forEach(function(file) {
            node.push({
                file: path.join(dir, file),
                attribution: 'John Doe'
            });
        });
        output += '\n-----' + dir + '-----\n';
        output += '"images":';
        output += JSON.stringify(node, null, 2);
        output += ',';
    }
});

fs.writeFileSync('out.txt', output);
console.log(output);
