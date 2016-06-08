(function(){// nadachat js application file [CCBY4] 
var api = {},
app = {
	room: location.hash.slice(1) || serial(),	// conversation ID used by server API to dispatch
	isAlice: !location.hash.slice(1),	// is this device the one starting the conversation?
	workerURL: "", 		// used to hold the blobURL generated from fetching the worker code with ajax
	pollPeriod: 300, 	// # of ms to wait before re-connecting an http long-poll
	messageIDs: {}, 	// a look up table of used message ID
	readyState: 0,  		// application lifecycle stage (0-8)
	counter: 0,			// how many messages have been recieved?

	ITEM: function(o) {
		var bonus = ((app.isAlice && o.user == 0) || (!app.isAlice && o.user == 1)) ? "" : " &gt;&gt; ";
		return "<li class='item msg " + (bonus ? "you" : "them") + " ' id=msg_" + o.tx + "><div class=heading>" + 
			"<time>" + 
				new Date(o.date).toLocaleTimeString() + 
			"</time>" +
			"<a href=# class='xbtn btn-xl xbtn-default rem pull-right '> &nbsp; remove  &nbsp; </a>" +
			"</div><div class=bod>" + marked(bonus + sanitize(o.data.trim())).trim() + "</div>"+
		"</li>";

	},

	BOOT: function() {
		location.replace("#");
		$(document.body).removeClass("loading");

		if(this.isAlice) {
			// gen ecc curve, ajax to server, update hash and on-screen info from splash to waiting...
			var st = performance.now(),
				w = new Worker(workerURL);
				
			STAMP+= rndme._stamp();
			STAMP+= rndme.crypto("int", 150, Number);
				
			w.onerror = console.error.bind(console);			
			w.onmessage = function(e) {
				var ob = e.data.data,
					et = performance.now();

				setTimeout(function(){
					rndme.time("int", 1000).then(function(s) {
						STAMP += s.slice(-256) + rndme._stamp() + rndme.crypto("int", 150, Number).slice(-64);
					});
				}, 500);
				
				app.pubkey = ob;				
				api.publicKey({
					pubkey: {
						x: ob.pubx,
						y: ob.puby
					}
				}).then(function() {
					app.SET_STATE(1);
					console.log("ecc took", performance.now() - st, " total, to gen: ", et - st);
				});
				w.terminate();
			}; // end onmessage()
			
			w.postMessage({
				type: "ecc",
				STAMP: STAMP + 
					rndme._stamp() + 
					[].join.call(crypto.getRandomValues(new Int32Array(32)), "").replace(/\W/g,"")+
					rndme.crypto("int", 300, Number) + 
					Math.random().toString().slice(3)+
					rndme._stamp() 
			});

		} else {
			app.SET_STATE(3)
			api.ask().then(function(e) {
				var st = performance.now();

				try{
					e=JSON.parse(e);
				}catch(y){
					return app.SET_STATE(7);
				}
				
				if(!e || !e.data || !e.data.pubkey) {
					return app.SET_STATE(7);
				}
				//set pubkey with response:
				app.pubkey = e.data.pubkey;
				
				//now send aes key and iv to server/alice
				var aes = {
					iv: serial(),
					key: get64RandomChars(),
					nonce: String(Array(24)).split("").map(get64RandomChars).join("")
				};
				
				app.aes = aes;
				app.nonce=expandNonce(app.aes.nonce);
				var st = performance.now(),
					w = new Worker(workerURL);
					
				w.onerror = console.error.bind(console);
				w.onmessage = function(e) {

					var ob = e.data;
					console.log("aes bundling via ecc took", performance.now() - st);
					w.terminate();
					
					//replace with one that's using a worker to ecc the payload:
					api.privateKey(ob).then(function() {
						setTimeout(function(){app.SET_STATE(5);}, 444);
						console.log("bob set aes key", performance.now() - st);
					});

				}; // end onmessage()

				w.postMessage({
					type: "encode",
					pub: app.pubkey,
					data: aes,
					STAMP: STAMP
				});
			});
		} // end if alice/bob?

		$("#pageurl").val(location + "" + app.room);
		$("#pageurlLink").prop("href", location + "" + app.room);
	},

	SET_STATE: function(numState) {
		app.readyState = numState;
		app.RENDER();
		setTimeout(function() {
			$("#taMsg").focus();
		}, 200);
		if(numState == 5)$("#btnSend").prop("disabled", false);
		if(numState > 5) $("#taMsg.btnSend").remove();
	},

	RENDER: function() {
		document.body.dataset.mode = app.readyState;
	},

};

function disconnected(){
	app.SET_STATE(8);
}


// build API methods with pre-fills:
["publicKey", "privateKey", "ask", "send", "fetch", "leave", "begin"].forEach(function(method){
	api[method] = function(e){ 
		return $.post( "/api/", {
			cmd: method,
			room: app.room,
			tx: serial().slice(-12),
			user: +app.isAlice,
			data: e
		}); // end post()
	};// end apu method
}); // end forEach()



///////////////////////////////////////////////
//bind ui controls:
//send button handlers:
$("#btnSend").click(function(e){
	
	$("#btnSend").prop("disabled", true);
	var messageIndex=app.counter,	
	w=new Worker(workerURL);					
	w.onerror=disconnected;
	w.onmessage=function(e){					
		w.terminate();
		var msg=JSON.parse(e.data.data),
		out={ i: messageIndex,  iv: msg.iv, ct: msg.ct };
		api.send(out).then(function(){
				$("#taMsg").val("").focus();
		});	
	};
	
	w.postMessage({type:"aesenc", key: getMessageKeyByIndex(messageIndex) , data:  $("#taMsg").val(), STAMP: STAMP });
	//$("#taMsg").val("");
});//end click()

// key bindings for compose box:
$("#taMsg").keydown(function(e){
		if(e.keyCode==27) return e.target.value=""; // clear on [esc]
		
		if( {10:1, 13:1}[e.keyCode] && !(e.shiftKey||e.ctrlKey) ){ // send if not inserting line and pressing [return] or [enter]
			$("#btnSend").click();
			e.preventDefault();
			return false;
		}
});//end keyup()

$("#btnLeave").click(function(){
	api.leave().then(function(){
		location.replace("#");
		try{window.close();}catch(y){}
		location.replace("about:blank");
	});
});

$("#pageurl").focus(function(){this.select();});

$("#ulList").on("click", ".rem", function(e){
	$(e.target.parentNode	).remove();
});
$("#pageurlLink").click(function(e){
	e.preventDefault();
	e.target.blur();
	return false;
})	;
$("#lnkBeep").click(function(e){
	var old=$("#spnBeep").text();
	$("#spnBeep").text( old=="off" ? "on" : "off");
	app.beep=old=="off";
	e.preventDefault();
});

window.onhashchange=function(e){
  if( location.hash.slice(1) && /^#[\w\-\/]+$/.test(location.hash))	location.reload();
};

window.addEventListener("offline", disconnected, false);
/*  window.onunload=function(){ //re-enable if you get post working correctly...
	if(app.readyState==5) navigator.sendBeacon("/api/?cmd=leave&room="+app.room);
}; */

// fetches messages in the background using long-polling:
(function poll(){ 
			
			if(app.readyState>5) return;			
			if(![0,1,0,0,0,1][app.readyState]) return setTimeout(poll, app.readyState===5 ? app.pollPeriod : (app.pollPeriod*3) );
			
			api.fetch(poll.lastDate).then(function(response, status, xhr){
				poll.lastDate = xhr.getResponseHeader("Date");
				app.pollTimeout=setTimeout(poll, app.pollPeriod);				
				
				
				var respLines=response.split("\n"), 
				 xdate=respLines[0].trim();
				if(xdate) poll.lastDate =  xdate;				
				
				if(response.trim().length < 50 && response.indexOf("#LEFT#")!==-1) return app.SET_STATE(6);					 //other person left, do something about it
				
				var lines=respLines.slice(1).map(function(line){
					return line && JSON.parse(line);
				}).filter(Boolean);
				
				
				if(!lines.length) return; 				
				document.body.dataset.empty=app.counter===0;
				
				// if alice is waiting for a bob response instead of a new message:
				if(app.readyState===1){
					var aes;
						lines.filter(function(obj){
							return obj.cmd==="privateKey";
						}).some(function(obj){  // if alice found bobs private key:
								aes=obj.data;
								return true;
						});		
											
					if(!aes) return;					
					var w=new Worker(workerURL);					
					w.onerror=console.error.bind(console);
					w.onmessage=function(evt){				
							app.aes=JSON.parse(evt.data.data);
							app.nonce=expandNonce(app.aes.nonce);
							delete app.aes.nonce;
							w.terminate();
							api.begin().then(app.SET_STATE.bind(app, 5));
					};

					w.postMessage({type: "decode", ob: app.pubkey, data: aes.data });			
					return;
				}//end if private key incoming? (that functionality borrows this otherwise msg-only poll() transport)				
				
				// append any new messages the view:
				lines.filter(function(line){
					return line.cmd==="send";
				}).forEach(function(line){
					if(!app.messageIDs[line.tx]){
						app.messageIDs[line.tx]=1;						
						app.counter++;	
						if(app.counter===1) document.body.dataset.empty='false';
						var w=new Worker(workerURL);					
						w.onerror=console.error.bind(console);
						w.onmessage=function(e){
							line.data=e.data.data.trim();
							$("#ulList").append(app.ITEM(line).trim().replace(/<a /g, "<a target=_blank "));
							$("#ulList li:last-child")[0].scrollIntoView(true);
							STAMP+=Math.floor(performance.now()*100).toString().slice(-1);
							w.terminate();
							clearTimeout(app.msgtimeout);
							//poll.lastDate = Date(line.date+1000); // xhr.getResponseHeader("Date")
							//console.info("line", line.data, line.date);
							app.msgtimeout=setTimeout(function(){ $("#btnSend").prop("disabled", false);}, 200);
							if(app.beep && !document.hasFocus()) beeper.play();
						};
						w.postMessage({type:"aesdec", key: getMessageKeyByIndex(line.data.i) , data: sjaes(line.data.iv, line.data.ct) });
					}
				});				
			});//end api.fetch()
}());
	

///////////////////////////////////////////////
// utils:
function expandNonce(nonce){
	return String(nonce).match(/.{12}/g).map(sha3_256).join("")
				.match(/.{12}/g).map(sha3_256).join("").match(/../g).map(function(a){
					return String.fromCharCode(parseInt( ("00"+a).slice(-2), 16 ));
				}).join("");
}

var getMessageKeyByIndex =(function(){	
	var keys=[]; // make list of keys private
	return function getKey(index){
		index= +index || 0;		
		if(index>=keys.length){		
			for(var i=keys.length, mx=index+1;i<mx;i++){
				var temp = keys.slice(-1)[0] || sha3_256(app.aes.iv + app.aes.key) ;
				keys.push(  sha3_256( index + app.nonce.slice(index*8, (index*8)+8)+ temp )  );
			}		
		}		
		return keys[index];
	}
}());

function sjaes(iv, ct){ // turns two pieces of an aes package into an sjcl-shaped packed string
   return JSON.stringify({
	"iv": iv,
	"v": 1,
	"iter": 1000,
	"ks": 256,
	"ts": 128,
	"mode": "gcm",
	"adata": "",
	"cipher": "aes",
	"ct": ct
   });
}

function serial(){
	return get64RandomChars().slice(-32);	
}

function sanitize(ht){ // tested in ff, ch, ie9+
  return new Option(ht).innerHTML;
}

function random(n) {
	return [].slice.call(crypto.getRandomValues(new Uint32Array(n)));
}

function get64RandomChars (){
	return (STAMP+sha3_512( random(1)+STAMP+getRandomData(0.10)).match(/\w{2}/g)
		.map(function(a){return  "wp7aY_xzcFLfmoyQqu51KWsZEvOb9XJSP3tin06dR-ClUkGeMVIjgr2NDH4hBT8A"[Math.floor((parseInt(a, 16)/255)*64)]}).filter(String).join("")).slice(-64);
}

function getRandomData(kb){
	return rndme.crypto("base92", kb * 1024, Boolean).slice(-kb*1024);
};//randomData;
	
function stamp(){ 

	var doms=[];
	
	 if(typeof document==="object"){
		var s=URL.createObjectURL(new Blob([]));
		URL.revokeObjectURL(s);
		doms=[
			parseInt(s.split("/").pop().replace(/\-/g,""),16).toString().replace(/\D/g,"").slice(1)/(setTimeout(Boolean,0)||3),
			JSON.stringify(performance.timing).match(/\d,/g).join("").replace(/\D/g,"")*1,
			((innerWidth*innerHeight)).toString().replace(/\D/g,"").slice(1)*1,
			new Date(document.lastModified).getTime()/(setTimeout(Boolean,0)||3),
			Object.keys(this||Math).length,
			document.head.textContent.length,
			document.referrer.length,
			document.body.scrollHeight
		];
	}

	  return doms.concat([
		Math.random(), 
		Math.floor(performance.now()*100), 
		(Date.now()-147298194451)/(setTimeout(Boolean)+2), 
		random(1)[0]
	  ]).sort().join("").replace(/\D/g,"").replace(/^0+|0+$/g,""); 
}


// build up some un-predictable values with what's available in the browser:
var st=performance.now()+2.5; // helps make Math.random() safer and buys time for other number generation methods, just in case (legacy)
while(performance.now()<st) Math.random(); // runs the performance.now clock up for better rndme.time() seeds

// add entropy from dom to that from php:
STAMP+= stamp();

// add some entropy from window.crypto (munged with timing data)
STAMP+= rndme.crypto("int", 300, Boolean).slice(-256);

// add entropy from orientation and acceleration sensors on portable devices and some laptops
rndme.motion("int", 40, function(s){
	STAMP+=s;
});

setTimeout(function(){ // load the worker code into a variable so that we can spawn fresh new workers without network IO:
	rndme.time("int", 1000).then(function(s){
		STAMP = s + STAMP;
		$.get({ dataType: 'text', url: "/js/sjcl-core.js"}, function(coreCode){	
			$.get({ dataType: 'text', url: "/js/rsaworker.js"}, function(a,b,c){	
				var poly=';var crypto2={getRandomValues: function(r){r.forEach(function(a,b){r[b]=Math.floor(4294967296*Math.random());}); return r;}}; if(typeof crypto==="undefined") crypto=crypto2;';
				
				workerURL=URL.createObjectURL(new Blob(["var STAMP="+STAMP+";var window=self;"+ poly+ coreCode +";\n\n\n"+a],{type:"text/plain"}));
				STAMP= rndme._stamp() + STAMP.slice(-200).split("").reverse().join("") + rndme._stamp();
				window.WORKER=new Worker(workerURL);
				WORKER.onerror=console.error.bind(console);
				setTimeout(app.BOOT.bind(app), 38);
			}); // end worker code fetch;
		});//end core fetch
	});//end time() cb
}, 120 );	


var beeper=new Audio("data:audio/wav;base64,UklGRm4IAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgATElTVCwAAABJTkZPSUFSVAoAAABkYW5kYXZpcwAASUNNVA4AAABwdWJsaWMgZG9tYWluAGRhdGEWCAAAgICAgICAgICAgH+Af4B/gICAgIB/gH+Af4CAgICAgH+Af4B/gIB/gIB/gH+Af4B/gIB/gH+AgH+Af4B/gIB/gIB/gICAgIB/gH+AgICAgH+Af4B/gIB/gH+AgH+Af4CAf4B/gICAf4B/gH+Af4CAf4B/gH+Af4B/gH+AgH+Af4CAf4B/gICAf4B/gH+AgH+AgH+Af4B/gH+Af3+Af4CAgH9/f4CAf4CAgXKWgnKEgXWjZXaiaYmCeYiCZqNvaqJvgIV1iYlbo4Bdm3x+gHeFlFSXkVuTgH2Ed3qgWYWbYYuCfId4cKdheJ9oh4N5iIBmq2troHCBgnmIh12kfGKbd4CBeISTV5qJX5Z8gIN2fp1Xj5Vgj32AhXZ3plt/nWWJf36He2uoaHCfbYV+fImCYKd2Zp10g394iI1Zn4Vgl3mCgXaCmVeSkmCQfICEdnijWYObZIl/f4d6bahkdZ9qhn98iIFiqHBpn3KCgHiIi1mjg2GZeICDiIJ1eIGDjHl5cXWLi4+Kd2xwdoqUjY1xcnB6iYuLgnZ4e4CLgH92d4WHjI52bnNyipGSj3Btb3iHkY+LcXN5eoiFhX52f4eDh312cXeIj5GLdG1reImQlYp0cHB7hoqMhHd3fYCGgX52d4SLjYl3cG94iZCUiXVtbXmJjpCIc3N2fYiDhX12foaGiXp2dHaGj5CKdmtteIiQkYt0cHF8h4mLgXd6foGIgHx3eISKjYp3b294iY+UinRtbnqHjo+GdXR3f4eEg3aFapGBdXqZbn6Sg2eMhnB9jXV5mXx6h4NvgX58eJ13gYKCa4xwhX6WbomEe22UaoKFjXCOgXxwjnCCh4hwi4V4eYl4fIh8d4aOdIOHenWJcn+Ck3KLf31wjGuHgJFxkHx+co1qiYKKco98fXaLcIaEgHWLgnl/iHaAhnZ8hol3iH97eohthYCMdJB7f3eKaIt/jXKTeX51jGmMgYh1j3t9e4hviIR7eYx/eoODdYKGcoGFh3aNfXt7iWmIgYx0knh9dotmjYCNZZV2fZpuYr1qXah+cXaVhml3sl1rsGB9knB/ll+UhmqNdY19cI2UT52PVJqCdYh+dZpihJRmkXiAjXJvrVtzqGl9hoOCeW+nZHKjZoWIc4aNXJ9/ZZZ3hXx3i5BUoIlZmH19g3l8m1mNlGGPeYCIdXOoXHyfZoV/gIZ7a6hmcaJrg4J7hoVho3donXKCgHiGj1ifh2CWeoCBd4GZV5KUX5B9f4R4eKNbg51kiX6Ah3lsqGRzomuDgH6Hf2KocWmgcIGBeYeMWKCEYJd/c3Bzh5aJiHN2coCJhIV3d4OEgZB5b3Z0iYyTi3RubXaJko+JdnFuf4eIjIByfH9/jX97cXeHiI6PdmxwdIiQk49yb213iY2MinV0en+HgoR4doOHhol9c254iI+SjHZta3aIkJCLdnBwfYeIiIB2e4GCh4B6cniFjI+Ld25rd4mQlYp0cGx5iY2MhnV3eH6JgoF5d4GIiIp6c3F2iI+Si3ZsbHiIkJCJdHJyfYiIh352fYGCiX55cniGjI+Ld25teImQkot1bpJ3hISFXIp/enijcX2Gi12Nfn95mnCChoJsi396f4x0fY18d4p9eIZ7d4KUcIaHeHKRbYKBkm+KgX9vkm2DgpFtjX9+bY9whIOMb4uBe3eLdoGFfnaHiHiBhnh8h3J/g412i398dotrhoGPcpB9fnKMaYmCjXKRen12i2uKg4N0jXx8fIdyh4N5fIeDeIeBeYGHbYODiXSPfHx5imeJf4xzk3p+dotmjYGJdJJ4fniJbIyCgHiNe3yAhXKHhXZ9iIN4iIJ5fohthZtSj5BsfZB3i3CHhmagcm+gfVe1clumfHSAh4V3a6htZatrfIt0gJhUlJVcjoOCeniGlVSWlVeVhHWIgHCeZX2WaY96fY54ZrBlaqZveoSCg35ppm9pom2BhnaCk1iai2CUe4J/doOZVJaUW5J/e4R6dqJfgptkinx/h3psq2ZxoGyCfoCIf2SocmagcoB/fIaKW6CDYJl4gYB3gZZXlZJdkX5/gnd7oFiIm2CLf36Ge2+nYnigaIZ/fYh/YqtuaqBwgYF7h4dcpHxriImLjntqdHKKkpSId3BtfYeLi4hyeXp9i4CCdneChoiQeW9yd4WNl4t0bG11iJKPinR0cn6IiId9dH2EgYmAenB3iYmPj3ZtbnaIkJOLdXBteomLi4V3dnmCh4GBd3eCiYmLenFteIeQk4t2bWx3iZCPiHZycn2Hh4Z9dn2Chol8eXF3houQi3ZubHeJj5OLdHFveoiLi4R1ent/iIJ+d3eDiIqLeXFueIiPlIp2bW14iI+Qh3R1dH2IhoV8dn+Dhol8eHB4hod5fZF7cI+HZoKFeHGgeneIimKId314nXaEgodki3aBe5hyiYB+bo1yg4iLbYiGdHqPdIGHenaFjHWBiHh1jXJ+gZJxh4R9cI9tgoKScI1+gG6NbYeAjnCNfX51i3CHg4N0iYB6fol0gYZ3e4aIdoWFenuJbYGCjHSQfX51imiJf410kHiBdIprjICHdJB4fXiJb4qDgHeKf3qChHaEhnN/hYV3in97fohrhoCLdJF6f3eKZo1/i3SSd4B3immNgIV1knh8gHN3mIJthZJpeJlzapmGaYeQbHqOd3WSgHCIiHB/jXd4jIB0hoJ2g4d4hIZ5e4l6eImDdoaDeX2IenqIgXaEhnd8iXt5h4F3g4Z4f4h8eoeAeIKFeX+FfXuFf3uB");
beeper.volume=0.2;


}());
