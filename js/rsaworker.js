var window=self; // fools sjcl into thinking we are running in a browser scope instead of a worker scope

// this is now injected as a string to avoid net io / log entries:
// importScripts('https://nadachat.com/js/sjcl-core.js'); //make with directions on https://github.com/bitwiseshiftleft/sjcl/wiki/Getting-Started, adding --with-ecc to configure as the only change, then taking core.js

// over-ride ajcl AES defaults with stronger values:
sjcl.json.defaults.ks=256;
sjcl.json.defaults.ts=128;

// add entropy to the fortuna instance used by sjcl:
sjcl.random.addEntropy(STAMP); // use entropy from PHP and DOM
sjcl.random.addEntropy(stamp()); // 
sjcl.random.addEntropy(getRandomFromCrypto(94));
sjcl.random.addEntropy(location.href); // use blob url for unpredictable values 
sjcl.random.addEntropy(get64FromTimeNew());


// sends a response or error back to the web app:
function send(type, data){
	self.postMessage({type:type, data: data});
}





self.addEventListener("message", function(evt) {

	sjcl.random.addEntropy(stamp());
	
	var e = evt.data;
	if(e.data && e.data.STAMP)	sjcl.random.addEntropy(e.data.STAMP); // used if passing in more late-gathered entopy (like motion data)

	
	if(e.type == "ecc") { // generate a new ecc curve keypair
		var pair = sjcl.ecc.elGamal.generateKeys(sjcl.ecc.curves.c521); // a fresh ecc key pair
		send("ecc", {  // serialize into shippable values:
			pubx:  pair.pub.get().x,
			puby:  pair.pub.get().y,
			sec: pair.sec.get()
		});	
	}//end if ecc?

	
	if(e.type == "encode2") { // encode using ECC public key
		try {
			var pub=e.pub.split ? JSON.parse(e.pub) : e.pub,
			curve = sjcl.ecc.curves.c521,
			point = new sjcl.ecc.point(sjcl.ecc.curves.c521, curve.field.fromBits(pub.x), curve.field.fromBits(pub.y)),
			pubK = new sjcl.ecc.elGamal.publicKey(sjcl.ecc.curves.c521, point),
			plain = [].slice.call(new TextEncoder().encode(JSON.stringify(e.data))),
			encrypted = sjcl.encrypt(pubK, plain);				
			send("encode", (""+encrypted));
		} catch(y) {
			send("error", y+"");
		}
	}//end if encode?
	
	
	if(e.type == "decode2") { // decode using ECC secret key
		try {		
			var sec = new sjcl.ecc.elGamal.secretKey(
				sjcl.ecc.curves.c521,  
				sjcl.ecc.curves.c521.field.fromBits( e.ob.sec )
			),			
			decodedArray = sjcl.decrypt(sec, e.data, {raw: 1});
			send("decode", new TextDecoder().decode(new Uint8Array(decodedArray)));
		} catch(y) {
			send("error", y+"");
		}
	}//end if decode?
		

	if(e.type == "aesenc") { // encode using AES (GCM)
		try {
			var pw=sjcl.codec.hex.toBits(e.key);
			var enc=sjcl.encrypt(pw, e.data, {mode : "gcm"});
			send("enc", enc);
		} catch(y) {
			send("error", y.message);
		}
	}//end if encode?
	

	if(e.type == "aesdec") {// decode using AES (GCM)
		try {			
			var key=sjcl.codec.hex.toBits(e.key),
			plain=sjcl.decrypt(key, e.data);
			send("dec", plain);
		} catch(y) {
			send("error", y.message);
		}
	}//end if dec?
	
	
});//end onmessage() event handler



// utility functions

function stamp(){ // returns a bunch of random digits each time it's called
  function random(n) {return [].slice.call(crypto.getRandomValues(new Uint32Array(n)));}
  return [
    Math.random(), 
    Math.floor(performance.now()*100), 
    (Date.now()-147298194451)/(setTimeout(Boolean)+2), 
    random(1)[0]
  ].join("").replace(/\D/g,"").replace(/^0+|0+$/g,""); 
}


// crypto - OS-provided CSPRNG with timing data mixin - sync and fast
function getRandomFromCrypto(chars) { 
    var format="int";
	chars=Math.floor(chars/1.5);
	var pad=(""+Array(Math.max(64,Math.floor(chars/9.75)))).split("").map(stamp),
	out =  [].slice.call(crypto.getRandomValues(new Int16Array(chars)))
	.map(Math.abs)
	.filter(function(a,b,c){ return a<100; });
	out = out.map(function(a,b,c){
             var padSlot=Math.floor(b/10), padCol=b%10;
             return ("00"+(a+(+pad[padSlot][padCol]||1)).toString().slice(-2)).slice(-2);
        }).join("");

	
	return out.slice(-chars);
} //end getRandomFromCrypto()


function munge(a, b) {return Math.random() > .5 ? 1 : -1;}
	


function get64FromTimeNew() {
	var ua = new Uint32Array(1),
		out = random(36),
		rxd = /[523403467]/,
		limit = 0,
		round = 0,
		roundLimit =40,
		seeds = random(roundLimit + 3),
		loads = random(roundLimit + 3),
		r = [],
		times = [],
		t = (Date.now().toString().slice(-3).slice(1)*1),
		st = performance.now(),
		chars = "wp7aY_xzcFLfmoyQqu51KWsZEvOb9XJSP3tin06dR-ClUkGeMVIjgr2NDH4hBT8A".split("").sort(munge).join("").repeat(16).split(""),
		mx3 = chars.length;


	function random(n) {return [].slice.call(crypto.getRandomValues(new Uint32Array(n)));}
	function work() {return Math.random().toString(16).split("").filter(rxd.test, rxd).length;}
	function snap() {return String(("" + performance.now()).match(/\.\d\d/) || "0").replace(/\D/g, "").slice(-2) || 0;}


	while(performance.now() < st + 1) t += work(limit++) ;
	limit = Math.max(limit, 2);
	while(true) {
		round++;
		for(var i = ((loads[round] / 4294967296) * (limit / 8.5)) + 1; i > 0; i--) t += work();
		var slot = Math.floor((seeds[round] / 4294967296) * 32);
		out[slot] = out[slot] + t + (times[times.length] = +snap());
		if(round > roundLimit) break;
	}

	return out.map(function(a, b, c) {
		var l2 = ("" + a).slice(-3);
		return chars[(l2[2] + l2[1] + l2[0]) - 16] || ""; // toss ~16/1000 chars
	}).filter(String).join("").concat(chars.join("")).slice(20,52);

} //~15ms on "mobile" (moto e)
