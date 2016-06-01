//nadachat builder. needs linux, openssl, and npm.  there are probably better systems, but this works.

//load up node utils:
const execSync = require('child_process').execSync;
const fs = require('fs');


//copy base template
execSync('cp _index.php index.php');

//build sjcl with ecc:
execSync('cd node_modules/sjcl/ ; ./configure --with-ecc --with-gcm --with-hmac');
execSync('cd node_modules/sjcl/ ; make');


// copy scripts to places they need to be for the web, with integrity signatures:

//copy sjcl
execSync('cp node_modules/sjcl/core.js js/sjcl-core.js');

//copy rndme
execSync('cp node_modules/rndme/rndme.js js/rndme.js');
var temp=String(fs.readFileSync("index.php")).replace("#rndme#", execSync('openssl dgst -sha256 -binary js/rndme.js | openssl base64 -A'));
fs.writeFileSync("index.php", temp);

//copy js-sha3
execSync('cp node_modules/js-sha3/src/sha3.js js/sha3.js');
var temp=String(fs.readFileSync("index.php")).replace("#sha3#", execSync('openssl dgst -sha256 -binary js/sha3.js | openssl base64 -A'));
fs.writeFileSync("index.php", temp);

//copy jquery
execSync('cp node_modules/jquery/dist/jquery.js js/jquery.js');
var temp=String(fs.readFileSync("index.php")).replace("#jquery#", execSync('openssl dgst -sha256 -binary js/jquery.js | openssl base64 -A'));
fs.writeFileSync("index.php", temp);




