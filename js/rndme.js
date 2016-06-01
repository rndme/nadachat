// rndme.js - unpredictable number generation from sound, sight, movement, and time
(function(a,b){"function"==typeof define&&define.amd?define([],a):"object"==typeof exports?module.exports=a():b.rndme=a()}(function(){

/* example uses:
//  source (  format  size  callback  progess )
rndme.sound("bytes", 12345, function(s){alert(s)});
rndme.motion("hex", 1024,function(s){alert(s)}, console.info.bind(console));
rndme.time("float", 256,function(s){alert(s)}, console.info.bind(console));
rndme.video("base92", 1024).then(alert).catch(confirm);
*/


 var rndme=Object.create(null);


// video - capture unpredictable data from user camera
rndme.video=getRandomFromVideo;
  
function getRandomFromVideo(format, chars, callback, progress, err) { // returns a 64 char base64url string
	"use strict";
  chars=Math.floor(chars * 0.55);
	var canvas = document.createElement("canvas"),
		ctx = canvas.getContext("2d"),
		webkit = false,
		moz = false,
		v = null,
		W = 320,
		H = 240,
		n = navigator,
		dataBuffer=[],
		v = document.createElement("video");

	if(n.getUserMedia) {
		n.getUserMedia({
			video: {
				width: W,
				height: H,
				framerate: 60, 
				facingMode: "environment",
			}
		}, success, err);
	} else if(n.webkitGetUserMedia) {
		webkit = true;
		n.webkitGetUserMedia({
			video: {
				facingMode: "environment",
				width: W,
				height: H,
			  framerate: 60, 
				optional: []
			}
		}, success, err);
	} else if(n.mozGetUserMedia) {
		moz = true;
		n.mozGetUserMedia({
			video: {
				facingMode: "environment",
				width: W,
				height: H,
			  framerate: 60, 
			},
			audio: false
		}, success, err);
	}


	function dumpCanvas() {
		var data = ctx.getImageData(0, 0, W, H).data,
		pSum=data.slice(0, 512).reduce(function(a,b){return a+b;}, 10),	  
		sigLength = Math.floor(Math.max(64,Math.min(2048, (pSum-32768)/9))),
		sig = crypto.getRandomValues(new Uint32Array(sigLength)),
			r = [],
			taken = 0;
			
	  if( pSum < 100 ) return setTimeout(updateCanvas, 20);
	  
		
		for(var i = 1, mx = data.length; i < mx; i++) {
			var v = data[i];
			if( v < 255) {
				sig[(sigLength-1)-(taken++ % sigLength)]+=v;
			}
		}

		//keygen and dump:
		sig = [].slice.call(sig).map(function(a) {
			return ("00"+a).slice(-2);
			  //parseInt("0" + a.toString(2).slice(-10), 2);
		}).join("");

	  	if(/^0+$/.test(sig)) return setTimeout(updateCanvas, 20);
	  
	  	dataBuffer.push(sig);	  
	  	var used=(""+dataBuffer).length*0.53;
	  
	  	if(used > chars){
		 	var collect=[]; 
		  	formatData(dataBuffer.join(""), format, collect);
			updateCanvas.stop();	
		  	if(callback) callback(collect.join("")); 
		}else{
		  if(progress) progress({value: used, max: chars});
		  setTimeout(updateCanvas, 0);		  
		}
	  

	}


	function updateCanvas() {
		ctx.drawImage(v, 0, 0, W, H);
		setTimeout(dumpCanvas, 25);
	}


	function success(stream) {
		updateCanvas.stop = function() {
			stream.getTracks()[0].stop();
		};

		if(webkit) v.src = window.webkitURL.createObjectURL(stream);
		else if(moz) {
			v.mozSrcObject = stream;
			v.play();
		} else v.src = stream;
		setTimeout(updateCanvas, 9);
	}

}  //end getRandomFromVideo()





// time - capture unpredictable data from user device performance


rndme.time = getRandomFromTime;


function getRandomFromTime(format, chars, callback, progress) { 

	var ua = new Uint32Array(1),
		counts=Math.ceil(chars/2),
		ds=(Date.now()+performance.now()).toString().replace(/\D/g,""),
		dsl=ds.length, 
		out =random(counts),// Array.from(Array(counts)).map(function(a,b){return rndme._stamp().slice(b%10, (b%10)+1)*b}),
	//.map((a,b)=>b*ds[b%dsl]),//random(counts),
		rxd = /[523403467]/,
		limit = 0,
		round = 0,
		roundLimit = chars * 0.333, //0.7,
		seeds = random(roundLimit + 3),
		loads = random(roundLimit + 3),
		r = [],
		t = (Date.now().toString().slice(-3).slice(1)*1),
		st = performance.now();
		

	function random(n) {return [].slice.call(crypto.getRandomValues(new Uint32Array(n)));}
	function work() {return Math.random().toString(16).split("").filter(rxd.test, rxd).length;}
	function snap() {return +String(("" + performance.now()).match(/\.\d\d/) || "0").replace(/\D/g, "").slice(-2).split("").reverse().join("") || 0;}


	while(performance.now() < st + 1) t += work(limit++) ;
	limit = Math.max(limit*1.75, 2);

	function next(){
	
		round++;
		for(var i = ((loads[round] / 4294967296) * (limit / 9)) + 1; i > 0; i--) t = work();
		var slot = counts-(round % counts)//Math.floor((seeds[round] / 4294967296) * counts)// round % counts; //;
		out[slot] = +out[slot] + +t + snap();
	  	if(progress) progress({value: round, max: roundLimit});
		if(round < roundLimit) return setTimeout(next,0);
	
	  
	  	var collect=[];
		formatData(out.map(function(a, b, c) {
			return ("000" + a).slice(-2);
		}).filter(String).join("").replace(/\D+/g,""), format, collect);
	  
	  
		callback(collect.slice(-chars).join(""));

	}//end next()

	next();

} //end time()







// sound - capture unpredictable data from user microphone


rndme.sound=sound;

function sound(mode, length, callback, progress, err) {
	"use strict";

	var n = navigator,
		format = mode,
		limit = length,
		count = 0,		
		ALLS = [],
		makeRandom = sound,
		isRecording = false;

	var AudioContext = window.AudioContext || window.webkitAudioContext;

	var audioContext = makeRandom.ac || (makeRandom.ac = new AudioContext()),
		audioInput = null,
		inputPoint = null,
		buffers = [],
		TIMER = 0,
		xstream,
		gum = n.getUserMedia

		if(!gum) gum =  (n.mediaDevices && n.mediaDevices.getUserMedia && n.mediaDevices.getUserMedia.bind(n.mediaDevices)) || n.webkitGetUserMedia || n.mozGetUserMedia;
		if(!gum) return err("sound source needs getUserMedia()");
  
	function makeIt() {

		var resp = gum.call(n, {
			"audio": {
				volume: 0.7,
				channelCount: 1,
				echoCancellation: false,
				"mandatory": {
					"googEchoCancellation": "false",
					"googAutoGainControl": "false",
					"googNoiseSuppression": "false",
					"googHighpassFilter": "false",

				},
				"optional": []
			},
		}, gotStream, err)
		  if(resp && resp.then) resp.then(gotStream);

	} //end makeIt()




	function gotStream(stream) {
		xstream = stream;	  
		inputPoint = audioContext.createGain();
		audioInput = audioContext.createMediaStreamSource(stream);
		audioInput.connect(inputPoint);
		gotStream.ip = inputPoint;
		gotStream.ai = audioInput;

		var node = (inputPoint.context.createScriptProcessor || inputPoint.context.createJavaScriptNode).call(inputPoint.context, 2048, 1, 1);
		audioInput.connect(node);
		node.connect(audioInput.context.destination); //this should not be necessary
		node.onaudioprocess = function(e) {
			if(isRecording) buffers.push(e.inputBuffer.getChannelData(0));
		};

		gotStream.node = node;

	  
		var zg = gotStream.zg || (gotStream.zg = audioContext.createGain());
		zg.gain.value = 0.0;
		inputPoint.connect(zg);
		zg.connect(audioContext.destination);
	  
	  function rec() {
			isRecording = true;
			setTimeout(function() {
			
				getMyBuffers(buffers);
				isRecording = false;
			}, 100 );
		}
	  
		TIMER = setInterval(rec, 160 );
	  	setTimeout(rec,0);
	}





	function getMyBuffers(buffers) {
		var rxd = /\D/g,
		rxd3 = /\d{3}/g,
			x=[], 
			s="";

		buffers.some(function(r, ind) {

			if(progress) progress({
				value: count,
				max: limit
			});

			if(!r || !r.map) return err("getMyBuffers passed non buffer");

			for(var i = 0, mx = r.length; i < mx; i++) {
				var a = r[i],
					u = ("" + a).replace(rxd, "").slice(-11, - 3);
				if(+u) x.push(u);
			}
		  
			s = x.join("");
			count+=formatData(s, format, ALLS);
		  
			if(count > limit) {
				if(format === "raw" && buffers[ind + 1]) return false;
				if(format === "raw") limit = 9e9;
				clearInterval(TIMER);
				setTimeout(function() {
					xstream.getTracks()[0].stop();
				}, 50);
			  
			  
				buffers.length = 0;
				isRecording = false;
				if(progress)progress({
					value: count,
					max:limit
				});

				gotStream.ai.disconnect();
				gotStream.ip.disconnect();
				callback(ALLS.join("").slice(0, limit));
			  ALLS.length = 0;
			  
				return true;
			}


		}); //end some();

	}


	makeIt();
  
  
} //end sound();
  

  
  
  
  
  
  
  
  
  
  
// motion - capture unpredictable data from user movement and sensor noise
rndme.motion = getRandomMotion;

function getRandomMotion(format, chars, callback, progress, err) { // returns a long string of digits to callback

  	if(!window.ondevicemotion && !window.ondeviceorientation) err("motion source needs device motion API");
  
	chars = +chars || 1024;
  	
	var samples = {},
		rounds=0,
		pad=random(~~(chars/19)).map(function(a){return 1/a;}),
	 	lastPos = [0,0,0];
  
  	function random(n) {return [].slice.call(crypto.getRandomValues(new Uint16Array(n)));}


  
	function accelChange(e) {
		var acc = e.accelerationIncludingGravity || "",
	  		off=pad[rounds] || 0,
			buff,
			pos = [acc.x || e.alpha||0, acc.y||e.beta||0, acc.z||e.gamma||0],
			dif = [pos[0] - lastPos[0]-off, pos[1] - lastPos[1]-off, pos[2] - lastPos[2]-off];
  
			samples[dif[0].toString().slice(-9,-1)]=1;
	  		samples[dif[1].toString().slice(-9,-1)]=1;
	  		samples[dif[2].toString().slice(-9,-1)]=1;
	  		samples[(dif[0]+dif[1]+dif[2]).toString().slice(-9,-1)]=1;
	  		samples[(dif[1]-dif[2]-off).toString().slice(-9,-1)]=1;
	   		samples[((dif[2]-dif[0])/(off/7)).toString().slice(-9,-1)]=1;
	  
	  		rounds++;
			lastPos = pos;
			buff=Object.keys(samples);
	  		if(progress) progress({value:buff.length, max: buff.length*8})
	  		if ( (buff.length*7.95) > chars) done( buff );
	  		
	}

 
	function done(data) {
	  	samples=null;
		window.removeEventListener('devicemotion', accelChange, false);
	    window.removeEventListener('deviceorientation', accelChange, false);
	    var out=String(data).replace(/\-?0\.00*/g, "").replace(/\D+/g,""),
	  	collect=[];
	  	
	  	formatData(out, format, collect);
	  	callback(collect.slice(-chars).join());
	  	if(progress) progress({value:0, max: 1});
	}

	window.addEventListener('devicemotion', accelChange, false);
  	window.addEventListener('deviceorientation', accelChange, false);
  
  
}//end getRandomMotion()

  
  
  

rndme.crypto=  getRandomFromCrypto;
// crypto - OS-provided CSPRNG with timing data mixin - sync and fast
function getRandomFromCrypto(format, chars, callback, progress) { 
	chars=Math.floor(chars/1.5);
	var pad=(""+Array(Math.floor(chars/9.75))).split("").map(rndme._stamp),
	out =  [].slice.call(crypto.getRandomValues(new Int8Array(chars)))
	.map(Math.abs)
	.filter(function(a,b,c){ return a<100; });
	out = out.map(function(a,b,c){
             var padSlot=Math.floor(b/10), padCol=b%10;
             return ("00"+(a+(+pad[padSlot][padCol]||1)).toString().slice(-2)).slice(-2);
        }).join("");

	var collect=[], buff;
	formatData(out, format, collect);	  
	buff =collect.slice(-chars).join("");
	if(callback) callback(buff);
	return buff;
} //end getRandomFromCrypto()    
  




rndme.unsafe=  getRandomFromMath;
// crypto - Browser-provided PRNG - sync, fast, uniform, and not secure
function getRandomFromMath(format, chars, callback, progress) { 
	chars=Math.floor(chars/1.5);
	var out=Array(Math.floor(chars/15)).join(",").split(",").map(Math.random).join("").replace(/,?0\./g,"");

	var collect=[], buff;
	formatData(out, format, collect);	  
	buff =collect.slice(-chars).join("");
	if(callback) callback(buff);
	return buff;
} //end getRandomFromMath()     



rndme.combo = function combo (sources, format, samples, cb) {
	if(!Array.isArray(sources)) sources = [sources];
	sources = sources.map(function(a) {
		return rndme[a]("int", samples);
	});

	return Promise.all(sources).then(function(out) {
		var collect = [];
		formatData(out.reduce(rndme._combine), format, collect);
		collect = collect.slice(-samples).join("")
		if(cb) cb(collect);
		return collect;
	});
};//end combo()




 
  

function formatData(strData, format, dest){
	dest=dest || [];
	var rxd = /\D/g,
		rxd3 = /\d{3}/g,
		count= 0,
		s=strData;

	
	switch(format) {

	  case 'hex':
		dest.push((s.match(rxd3) || []).map(function(a, b, c) {
		  a = ~~((a/999) * 256);
		  count++;
		  return("00" + a.toString(16)).slice(-2);
		}).join(""));
		break;

	  case 'bytes':
		var tr=(s.match(rxd3) || []), i=0, mx=tr.length, rr=Array(mx);
		for(;i<mx;i++){
		  count++;
		  rr[i]= ~~ ((tr[i] / 999) * 255);
		}
		dest.push(rr+'');				
		break;

	  case 'int':
		dest.push(s.replace(rxd, "") || "");
		count = dest.join("").length;
		break;

	  case 'raw':
		count += String(s).length;
		dest.push(s);
		break;

	  case 'float':
		dest.push((s.match(/\d{16}/g) || []).map(function(a, b, c) {
		  count++;
		  return +("0." + a);
		}).join(","));
		break;

	  case 'base64':
		var chars = "wp7aY_xzcFLfmoyQqu51KWsZEvOb9XJSP3tin06dR-ClUkGeMVIjgr2NDH4hBT8A".repeat(26).split("").sort(munge);

		dest.push((s.match(rxd3) || []).map(function(a, b, c) {
		  count++;
		  return chars[+a];
		}).join(""));
		break;


	  case 'base92':
	  default:
		
		var chars="0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ!#$%&()*+,-./:;<=> ?@[]^_{|}~`\t".split("").sort(munge);

		var tr=(s.match(/\d{2}/g) || []), i=0, mx=tr.length, rr=Array(mx);
		for(;i<mx;i++){
		  count++;
		  rr[i]= chars[+tr[i]] || "";
		}
		dest.push(rr.join(""));				
		break;


	}
	return count;

  }//end formatData()

  

  
//utils
function spin(r, max) { // to unweave linearity of gathered unique samples
	for(var slot1 = 0, slot2 = 0, temp = 0, i = 0, mx = r.length, limit = +max || mx; i < limit; i++) {
	  slot1 = Math.floor(Math.random() * mx);
	  slot2 = Math.floor(Math.random() * mx);
	  temp = r[slot1];
	  r[slot1] = r[slot2];
	  r[slot2] = temp;
	}
	return r;
}
  
function munge(a, b) {
	return Math.random() > .5 ? 1 : -1;
}



// a sync timestamp method, returns a new 10-digit string each time
function stamp() {
	return(Date.now() / (performance.now() * 100)).toString().split("").filter(/./.test, /\d/).slice(-10).join("");
};
  
function combine(r1, r2){
   var i=0, mx=Math.min(r1.length, r2.length), out=Array(mx);
   for(i;i<mx;i++) out[i] = String(+r1[i]+ +r2[i]).slice(-1);
  return out.join("");
}

  
  
//publish utils:
rndme._munge=munge;  
rndme._spin= spin;
rndme._stamp= stamp;
rndme._combine=combine;  


    
function make(method) {
	var func = rndme[method];
	rndme[method] = function _rnd(format, size, callback, progress, err) {
		var one5 = size * 1.5,
			three = size * 3,
			osize = size;
		size = {
			'float': size * 16,
			hex: one5,
			base64: three,
			bytes: three,
			base92: size * 2.2
		}[format] || size;
	  
		var cb2 = function rndme_cb(x) {
			var u, delim = {
				float: ',',
				bytes: ',',
				base92: '',
				int: '',
			    hex: '',
			  base64: '',
			}[format];
			if (delim !== u) x = x.split(delim).slice(-osize).join(delim.exec?"":delim);
			if (callback) callback(x);
			return x;
		};
		if (callback) return func(format, size, cb2, progress, err || console.error.bind(console));
		return new Promise(function(resolve, reject) {
			func(format, size, resolve, null, reject);
		}).then(cb2); //end promise
	} //end _rnd()
} //end make


["sound","motion","time","video","crypto","unsafe"].forEach(make);
  

  
// return static class:
 return rndme;

}, this));
