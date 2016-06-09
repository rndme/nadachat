(function(){  "use strict"; // nadachat js application file [CCBY4] 

var api = {},
app = {
	room: location.hash.slice(1) || get64RandomChars().slice(-32),	// conversation ID used by server API to dispatch
	isAlice: !location.hash.slice(1),	// is this device the one starting the conversation?
	workerURL: "", 		// used to hold the blobURL generated from fetching the worker code with ajax
	pollPeriod: 300, 	// # of ms to wait before re-connecting an http long-poll
	messageIDs: {}, 	// a look up table of used message ID
	readyState: 0,  		// application lifecycle stage (0-8)
	counter: 0,			// how many messages have been recieved?


	BOOT: function() {
		location.replace("#");
		$(document.body).removeClass("loading");

		if(this.isAlice) { // gen ecc curve, ajax to server, update hash and on-screen info from splash to waiting...
			// add some entropy, we got important work to attend to...
			STAMP+= rndme._stamp();
			STAMP+= rndme.crypto("int", 150, Number);
				
			// gen and send pubkey
			getWorker(function(e) {
				var ob = e.data.data;
				app.pubkey = ob;				
				api.publicKey({
					pubkey: {
						x: ob.pubx,
						y: ob.puby
					}
				}).then(function() {
					app.SET_STATE(1);
				});
			}, {
				type: "ecc",
				STAMP: STAMP + 
					rndme._stamp() + 
					[].join.call(crypto.getRandomValues(new Int32Array(32)), "").replace(/\W/g,"")+
					rndme.crypto("int", 150, Number) + 
					Math.random().toString().slice(3)+
					rndme._stamp() 
			});//end getWorker()

		} else { // alice or bob? bob:
			app.SET_STATE(3)
			api.ask().then(function(e) {
				var st = performance.now();

				try{
					e=JSON.parse(e);
				}catch(y){
					return app.SET_STATE(7);
				}
				
				// stop if there's any problem with the response or key
				if(!e || !e.data || !e.data.pubkey) return app.SET_STATE(7);
				
				//set pubkey with response:
				app.pubkey = e.data.pubkey;
				
				//now send aes key and iv to server/alice
				var aes = {
					iv: get64RandomChars(),
					key: get64RandomChars(),
					nonce: String(Array(24)).split("").map(get64RandomChars).join("")
				};
				app.aes = aes;
				app.nonce=expandNonce(app.aes.nonce);
				getWorker(function(e) {
						//replace with one that's using a worker to ecc the payload:
						api.privateKey(e.data).then(function() {
							setTimeout(function(){app.SET_STATE(5);}, 444);
						});
					}, {
						type: "encode",
						pub: app.pubkey,
						data: aes,
						STAMP: STAMP
				});
			});
		} // end if alice/bob?

		// update invite URL link and textbox:
		$("#pageurl").val(location + "" + app.room);
		$("#pageurlLink").prop("href", location + "" + app.room);
	},

	ITEM: function(o) { // templates a LI string from a message object, used to render the inbox list:
		var bonus = ((app.isAlice && o.user == 0) || (!app.isAlice && o.user == 1)) ? "" : " &gt;&gt; ";
		return "<li class='item msg " + (bonus ? "you" : "them") + " ' id=msg_" + o.tx + "><div class=heading>" + 
			"<time>" + 
				new Date(o.date).toLocaleTimeString() + 
			"</time>" +
			"<a href=# class='xbtn btn-xl xbtn-default rem pull-right '> &nbsp; remove  &nbsp; </a>" +
			"</div><div class=bod>" + marked(bonus + sanitize(o.data.trim())).trim() + "</div>"+
		"</li>";

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
	
	DISCONNECT: function(){
		app.SET_STATE(8);	
	},
	
	SEND_MESSAGE: function(e){
		$("#btnSend").prop("disabled", true);		
		var messageIndex=app.counter; // copy index for async process safety
		getWorker(function(e){					
				var msg=JSON.parse(e.data.data); // unpack sjcl's default aes string bundle to strip redundancy
				api.send({ 
					i: messageIndex,  
					iv: msg.iv, 
					ct: msg.ct 
				}).then(function(){ // sent, clear+focus message entry box to indicate
						$("#taMsg").val("").focus();
				});	
			}, {
				type: "aesenc", 
				key:  getMessageKeyByIndex(messageIndex) , 
				data: $("#taMsg").val(), 
				STAMP: STAMP 
			},
			app.DISCONNECT
		);//end getWorker()
 }// end SEND()

};// end app definition



// build server interaction API's methods with pre-filled values:
["publicKey", "privateKey", "ask", "send", "fetch", "leave", "begin"].forEach(function(method){
	api[method] = function(e){ 
		return $.post( "/api/", {
			cmd: 	method,
			room:	app.room,	
			tx: 		get64RandomChars().slice(-12), // a session-unique message id, used to detect repeated messages, otherwise meaningless
			user: 	+app.isAlice,	// 1 or 0
			data: 	e
		}); // end post()
	};// end apu method
}); // end forEach() of API method names



///////////////////////////////////////////////
//bind ui controls:
//send button handlers:
$("#btnSend").click(app.SEND_MESSAGE);

// key bindings for compose box:
$("#taMsg").keydown(function(e){
	
		if(e.keyCode==27) return e.target.value=""; // clear on [esc]
		
		if( {10:1, 13:1}[e.keyCode] && !(e.shiftKey||e.ctrlKey) ){ // send message right away if not inserting line and pressing [return] or [enter]
			$("#btnSend").click();
			e.preventDefault();
			return false;
		}//end if enter key
		
});//end keydown()


// cover tracks when clicking the 'exit' link (top-right)
$("#btnLeave").click(function(){
	api.leave().then(function(){
		location.replace("#");	// stop back button leakage by killing room id in url hash
		try{window.close();}catch(y){} // some browsers allow this, which is cool
		location.replace("about:blank"); // doesn't make another meaningful history entry to clear
	});
});

// select the invite url when clicked:
$("#pageurl").focus(function(){this.select();});


// list item remove capability:
$("#ulList").on("click", ".rem", function(e){
	$(e.target.parentNode).remove();
});

// keep the invite link from accidental clicks by user:
$("#pageurlLink").click(function(e){
	e.preventDefault();
	e.target.blur();
	return false;
})	;

// toggle the sound feature on and off each click
$("#lnkBeep").click(function(e){
	var old=$("#spnBeep").text();
	$("#spnBeep").text( old=="off" ? "on" : "off");
	app.beep=old=="off";
	if(app.beep) beeper.play(); // preview a beep sound to adjust vol
	e.preventDefault();
});

window.onhashchange=function(e){ // make it easier to paste in a new conversation id into an existing nadachat window
  if( location.hash.slice(1) && /^#[\w\-\/]+$/.test(location.hash))	location.reload();
};

window.addEventListener("offline", app.DISCONNECT, false);
/*  window.onunload=function(){ //re-enable if you get post working correctly...
	if(app.readyState==5) navigator.sendBeacon("/api/?cmd=leave&room="+app.room);
}; */


/////////////////////////////////
// fetches messages in the background using long-polling:
(function poll(){ 
			
			if(app.readyState>5) return;			
			if(![0,1,0,0,0,1][app.readyState]) return setTimeout(poll, app.readyState===5 ? app.pollPeriod : (app.pollPeriod*3) );
			
			api.fetch(poll.lastDate).then(function(response, status, xhr){
				poll.lastDate = xhr.getResponseHeader("Date");
				app.pollTimeout=setTimeout(poll, app.pollPeriod);				
				
				
				var respLines=response.split("\n"), 
				 xdate=respLines[0].trim(); //try to suss out a datastamp from the first (padding) line
				if(xdate) poll.lastDate =  xdate;				
				
				if(response.trim().length < 50 && response.indexOf("#LEFT#")!==-1) return app.SET_STATE(6); //other person left, do something about it
				
				// turn each line into a js object by parsing as json
				var lines=respLines.slice(1).map(function(line){
					return line && JSON.parse(line);
				}).filter(Boolean);
				
				if(!lines.length) return; // nothing to do
				document.body.dataset.empty= app.counter===0; // set body flag if no messages
				
				// if alice is waiting for a bob response instead of a new message:
				if(app.readyState===1){
					var aes;
					lines.filter(function(obj){
						return obj.cmd==="privateKey";
					}).forEach(function(obj){  // if alice found bobs private key:
						aes=obj.data;
					});		
											
					if(!aes) return;	// didn't find a pubkey-protected secret
					return getWorker(function(evt){				
						app.aes=JSON.parse(evt.data.data);
						app.nonce=expandNonce(app.aes.nonce);
						delete app.aes.nonce; // delete orig from bob
						api.begin().then(app.SET_STATE.bind(app, 5));
					}, { 
						type: "decode", 
						ob: app.pubkey, 
						data: aes.data 
					});				
				}//end if private key incoming? (that functionality borrows this otherwise msg-only poll() transport)				
				
				// append any new messages the view:
				lines.filter(function(line){
					return line.cmd==="send";
				}).forEach(function(line){
					if(!app.messageIDs[line.tx]){
						app.messageIDs[line.tx]=1;						
						app.counter++;	
						if(app.counter===1) document.body.dataset.empty='false';
												
						getWorker(function(e){
							line.data=e.data.data.trim();
							
							// if beep option enabled and tab no focused, beep:
							if(app.beep && !document.hasFocus()) beeper.play();
							
							// add message to list
							$("#ulList").append(app.ITEM(line).trim().replace(/<a /g, "<a target=_blank "));
							$("#ulList li:last-child")[0].scrollIntoView(true);
							
							// use this opertunity to add some timing to add a digit to STAMP
							STAMP+=Math.floor(performance.now()*100).toString().slice(-1);
							
							// enable the locked-out send button: (debounced)
							clearTimeout(app.msgtimeout);
							app.msgtimeout=setTimeout(function(){ $("#btnSend").prop("disabled", false);}, 200);
							
						}, {
							type:"aesdec", 
							key: getMessageKeyByIndex(line.data.i) , 
							data: sjaes(line.data.iv, line.data.ct) 
						});
						
						
					}//end if new message?
				}); // end line forEach()
			});//end api.fetch()
}());
	

///////////////////////////////////////////////
// utils:
function expandNonce(nonce){ // stretches bits of nonce to get more otp data
	return String(nonce).match(/.{12}/g).map(sha3_256).join("")
				.match(/.{12}/g).map(sha3_256).join("").match(/../g).map(function(a){
					return String.fromCharCode(parseInt( ("00"+a).slice(-2), 16 ));
				}).join("");
}

var getMessageKeyByIndex =(function(){	
	var keys=[]; // make list of keys private
	return function getKey(index){
		index= +index || 0;		
		if(index>=keys.length){ // if no cached key, mint ones between last and needed:
			for(var i=keys.length, mx=index+1;i<mx;i++){ // from the highest known key index to the needed index
				var lastKey = keys.slice(-1)[0] || sha3_256(app.aes.iv + app.aes.key) ; // use last known or a new key to
				keys.push(  sha3_256( index + app.nonce.slice(index*8, (index*8)+8)+ lastKey )  ); // derive a key from the last, the index, and some otp data
			} // next key
		} // end if missing key?
		return keys[index];
	}
}()); // end getMessageKeyByIndex()

function sjaes(iv, ct){ // turns two pieces of an aes package into an sjcl-shaped packed string, for unpacking incoming messages into a format understood by sjcl
	return JSON.stringify({
		cipher: "aes",
		mode: "gcm",
		ks: 256,
		iv: iv,
		v: 1,
		iter: 1000,
		ts: 128,
		adata: "",
		ct: ct
	});
}

function sanitize(ht){ // tested in ff, ch, ie9+, turns html into entities
  return new Option(ht).innerHTML;
}

function get64RandomChars(){
	return sha3_512( 
			Math.random()+ // a quick pad/iv
			STAMP+
			rndme._stamp()+
			rndme.crypto("base92", 124, Boolean).slice(124)
		).match(/\w{2}/g)
		.map(function(a){
			return  "wp7aY_xzcFLfmoyQqu51KWsZEvOb9XJSP3tin06dR-ClUkGeMVIjgr2NDH4hBT8A"[Math.floor((parseInt(a, 16)/255)*64)]; // convert hex pairs to b64 chars
		})
		.filter(String)
		.join("")
		.slice(-64);
}


function stamp(){ // collects un-guessable information

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
			document.body.scrollHeight,
			document.body.scrollWidth
		];
	}

	  return doms.concat([
		Math.random(), 
		Math.floor(performance.now()*1000), 
		(Date.now()-147298194451)/(setTimeout(Boolean)+2), 
		crypto.getRandomValues(new Uint32Array(1))[0]
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


function getWorker(fnResponder, objMessage, fnError){
	var w=new Worker(app.workerURL);					
	w.onerror=function(e){
		console.error(e);
		if(fnError) fnError.call(w, e);
		w.terminate();
	};
	w.onmessage=function(evt){				
		w.terminate();
		fnResponder.call(w, evt);
	};
	w.postMessage(objMessage);			
	return w;
}

/////////////////////////////////////
//// worker builder and boot starter
setTimeout(function buildWorker(){ // load the worker code into a variable so that we can spawn fresh new workers without network IO:
	rndme.time("int", 1000).then(function(s){
		STAMP = s + STAMP;
		$.get({ dataType: 'text', url: "/js/sjcl-core.js"}, function(coreCode){	
			$.get({ dataType: 'text', url: "/js/rsaworker.js"}, function(a,b,c){	
			
				// for older firefox and others w/o self.crypto IN WORKERS
				// note: polyfilling with Math.random() is safe since other unpredictable and CSPRNG-sourced data is mixed into SJCL's fortuna, which is what really matters
				var poly=';var crypto2={getRandomValues: function(r){r.forEach(function(a,b){r[b]=Math.floor(4294967296*Math.random());}); return r;}};'+
							'if(typeof crypto==="undefined") crypto=crypto2;';
				
				// add together the accumulated entropy, a sjcl shim for Workers (window=self), the self.crypto polyfill, and the fetched core and worker code and save to a blob url:
				app.workerURL=URL.createObjectURL(new Blob(["var STAMP="+STAMP+";var window=self;"+ poly+ coreCode +";\n\n\n"+a],{type:"text/plain"}));
				
				// throw away most of the accumulated entropy to protect the sealed worker thread code from XSS:
				STAMP= rndme._stamp() + STAMP.slice(-200).split("").reverse().join("") + rndme._stamp();
				
				// crypto worker url ready, boot up the application:
				setTimeout(app.BOOT.bind(app), 38);
			}); // end worker code fetch;
		});//end core fetch
	});//end time() cb
}, 120 );	

// a beep .wav file hard-coded into a url to avoid network activity just to beep on incoming messages if desired:
var beeper=new Audio("data:audio/wav;base64,UklGRm4IAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgATElTVCwAAABJTkZPSUFSVAoAAABkYW5kYXZpcwAASUNNVA4AAABwdWJsaWMgZG9tYWluAGRhdGEWCAAAgICAgICAgICAgH+Af4B/gICAgIB/gH+Af4CAgICAgH+Af4B/gIB/gIB/gH+Af4B/gIB/gH+AgH+Af4B/gIB/gIB/gICAgIB/gH+AgICAgH+Af4B/gIB/gH+AgH+Af4CAf4B/gICAf4B/gH+Af4CAf4B/gH+Af4B/gH+AgH+Af4CAf4B/gICAf4B/gH+AgH+AgH+Af4B/gH+Af3+Af4CAgH9/f4CAf4CAgXKWgnKEgXWjZXaiaYmCeYiCZqNvaqJvgIV1iYlbo4Bdm3x+gHeFlFSXkVuTgH2Ed3qgWYWbYYuCfId4cKdheJ9oh4N5iIBmq2troHCBgnmIh12kfGKbd4CBeISTV5qJX5Z8gIN2fp1Xj5Vgj32AhXZ3plt/nWWJf36He2uoaHCfbYV+fImCYKd2Zp10g394iI1Zn4Vgl3mCgXaCmVeSkmCQfICEdnijWYObZIl/f4d6bahkdZ9qhn98iIFiqHBpn3KCgHiIi1mjg2GZeICDiIJ1eIGDjHl5cXWLi4+Kd2xwdoqUjY1xcnB6iYuLgnZ4e4CLgH92d4WHjI52bnNyipGSj3Btb3iHkY+LcXN5eoiFhX52f4eDh312cXeIj5GLdG1reImQlYp0cHB7hoqMhHd3fYCGgX52d4SLjYl3cG94iZCUiXVtbXmJjpCIc3N2fYiDhX12foaGiXp2dHaGj5CKdmtteIiQkYt0cHF8h4mLgXd6foGIgHx3eISKjYp3b294iY+UinRtbnqHjo+GdXR3f4eEg3aFapGBdXqZbn6Sg2eMhnB9jXV5mXx6h4NvgX58eJ13gYKCa4xwhX6WbomEe22UaoKFjXCOgXxwjnCCh4hwi4V4eYl4fIh8d4aOdIOHenWJcn+Ck3KLf31wjGuHgJFxkHx+co1qiYKKco98fXaLcIaEgHWLgnl/iHaAhnZ8hol3iH97eohthYCMdJB7f3eKaIt/jXKTeX51jGmMgYh1j3t9e4hviIR7eYx/eoODdYKGcoGFh3aNfXt7iWmIgYx0knh9dotmjYCNZZV2fZpuYr1qXah+cXaVhml3sl1rsGB9knB/ll+UhmqNdY19cI2UT52PVJqCdYh+dZpihJRmkXiAjXJvrVtzqGl9hoOCeW+nZHKjZoWIc4aNXJ9/ZZZ3hXx3i5BUoIlZmH19g3l8m1mNlGGPeYCIdXOoXHyfZoV/gIZ7a6hmcaJrg4J7hoVho3donXKCgHiGj1ifh2CWeoCBd4GZV5KUX5B9f4R4eKNbg51kiX6Ah3lsqGRzomuDgH6Hf2KocWmgcIGBeYeMWKCEYJd/c3Bzh5aJiHN2coCJhIV3d4OEgZB5b3Z0iYyTi3RubXaJko+JdnFuf4eIjIByfH9/jX97cXeHiI6PdmxwdIiQk49yb213iY2MinV0en+HgoR4doOHhol9c254iI+SjHZta3aIkJCLdnBwfYeIiIB2e4GCh4B6cniFjI+Ld25rd4mQlYp0cGx5iY2MhnV3eH6JgoF5d4GIiIp6c3F2iI+Si3ZsbHiIkJCJdHJyfYiIh352fYGCiX55cniGjI+Ld25teImQkot1bpJ3hISFXIp/enijcX2Gi12Nfn95mnCChoJsi396f4x0fY18d4p9eIZ7d4KUcIaHeHKRbYKBkm+KgX9vkm2DgpFtjX9+bY9whIOMb4uBe3eLdoGFfnaHiHiBhnh8h3J/g412i398dotrhoGPcpB9fnKMaYmCjXKRen12i2uKg4N0jXx8fIdyh4N5fIeDeIeBeYGHbYODiXSPfHx5imeJf4xzk3p+dotmjYGJdJJ4fniJbIyCgHiNe3yAhXKHhXZ9iIN4iIJ5fohthZtSj5BsfZB3i3CHhmagcm+gfVe1clumfHSAh4V3a6htZatrfIt0gJhUlJVcjoOCeniGlVSWlVeVhHWIgHCeZX2WaY96fY54ZrBlaqZveoSCg35ppm9pom2BhnaCk1iai2CUe4J/doOZVJaUW5J/e4R6dqJfgptkinx/h3psq2ZxoGyCfoCIf2SocmagcoB/fIaKW6CDYJl4gYB3gZZXlZJdkX5/gnd7oFiIm2CLf36Ge2+nYnigaIZ/fYh/YqtuaqBwgYF7h4dcpHxriImLjntqdHKKkpSId3BtfYeLi4hyeXp9i4CCdneChoiQeW9yd4WNl4t0bG11iJKPinR0cn6IiId9dH2EgYmAenB3iYmPj3ZtbnaIkJOLdXBteomLi4V3dnmCh4GBd3eCiYmLenFteIeQk4t2bWx3iZCPiHZycn2Hh4Z9dn2Chol8eXF3houQi3ZubHeJj5OLdHFveoiLi4R1ent/iIJ+d3eDiIqLeXFueIiPlIp2bW14iI+Qh3R1dH2IhoV8dn+Dhol8eHB4hod5fZF7cI+HZoKFeHGgeneIimKId314nXaEgodki3aBe5hyiYB+bo1yg4iLbYiGdHqPdIGHenaFjHWBiHh1jXJ+gZJxh4R9cI9tgoKScI1+gG6NbYeAjnCNfX51i3CHg4N0iYB6fol0gYZ3e4aIdoWFenuJbYGCjHSQfX51imiJf410kHiBdIprjICHdJB4fXiJb4qDgHeKf3qChHaEhnN/hYV3in97fohrhoCLdJF6f3eKZo1/i3SSd4B3immNgIV1knh8gHN3mIJthZJpeJlzapmGaYeQbHqOd3WSgHCIiHB/jXd4jIB0hoJ2g4d4hIZ5e4l6eImDdoaDeX2IenqIgXaEhnd8iXt5h4F3g4Z4f4h8eoeAeIKFeX+FfXuFf3uB");
beeper.volume=0.2; // file is somewhat loud, let's not blast anyone out of their chair!


}());
