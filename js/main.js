// nadachat js application file [CCBY4] 
var api = {},
app = {
	room: location.hash.slice(1) || serial(),	// conversation ID used by server API to dispatch
	isAlice: !location.hash.slice(1),	// is this device the one starting the conversation?
	workerURL: "", // used to hold the blobURL generated from fetching the worker code with ajax
	pollPeriod: 200, // # of ms to wait before re-connecting an http long-poll
	messageIDs: {}, // a look up table of used message ID
	readyState: 0,  // application lifecycle stage (0-8)
	counter: 0,	// how many messages have been recieved?

	ITEM: function(o) {
		var bonus = ((app.isAlice && o.user == 0) || (!app.isAlice && o.user == 1)) ? "" : " &gt;&gt; ";
		return "<li class='item msg " + (bonus ? "you" : "them") + " ' id=msg_" + o.tx + "><div class=heading>" + 
			"<time>" + 
				new Date(o.date).toLocaleString() + 
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
			w.onerror = console.error.bind(console);			
			w.onmessage = function(e) {
				var ob = e.data.data,
					et = performance.now();
					
				rndme.time("int", 40).then(function(s) {
					STAMP += s;
				});

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
				STAMP: STAMP
			});

		} else {
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
						app.SET_STATE(5);
						console.log("bob set aes key", performance.now() - st);
					});

					app.SET_STATE(2);

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


(function(){ // build API methods with pre-fills:
	["publicKey", "privateKey", "ask", "send", "fetch", "leave", "begin"].forEach(function(f){
		api[f]=function(e){
			return $.post( "/api/", {
				cmd: f,
				room: app.room,
				tx: serial().slice(-12),
				user: +app.isAlice,
				data: e
			}); 	
		};
	});
}());


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
	
	w.postMessage({type:"aesenc", key: getMessageKeyByIndex(messageIndex) , data:  $("#taMsg").val(), });
	
});//end click()

// key bindings for compose box:
$("#taMsg").keyup(function(e){
		if(e.keyCode==27) return e.target.value=""; // clear on [esc]
		
		if( {10:1, 13:1}[e.keyCode] && !(e.shiftKey||e.ctrlKey) ){ // send if not inserting line and pressing [return] or [enter]
			$("#btnSend").click();
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
		
$("#lnkBeep").click(function(e){
	var old=$("#spnBeep").text();
	$("#spnBeep").text( old=="off" ? "on" : "off");
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
			if(![0,1,0,0,0,1][app.readyState]) return setTimeout(poll, app.readyState===5 ? app.pollPeriod : (app.pollPeriod*10) );
			
			api.fetch(poll.lastDate).then(function(response, status, xhr){
				app.pollTimeout=setTimeout(poll, app.pollPeriod);				
				poll.lastDate = xhr.getResponseHeader("Date");
					
				var lines=response.split("\n").slice(1).map(function(line){
					return line && JSON.parse(line);
				}).filter(Boolean);
				
				if(!response.trim()) return app.SET_STATE(6);					 //other person left, do something about it
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
						var w=new Worker(workerURL);					
						w.onerror=console.error.bind(console);
						w.onmessage=function(e){
							line.data=e.data.data.trim();
							$("#ulList").append(app.ITEM(line));
							$("#ulList li:last-child")[0].scrollIntoView(true);
							STAMP+=Math.floor(performance.now()*100).toString().slice(-1);
							w.terminate();
							clearTimeout(app.msgtimeout);
							app.msgtimeout=setTimeout(function(){ $("#btnSend").prop("disabled", false);}, 200);
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
	return get64RandomChars().slice(-32); //Math.random().toString(36).slice(-16);			
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
var st=performance.now()+1.5; // helps make Math.random() safer and buys time for other number generation methods, just in case (legacy)
while(performance.now()<st) Math.random(); // runs the performance.now clock up for better rndme.time() seeds

// add entropy from dom to that from php:
STAMP+= stamp();

// add some entropy from window.crypto (munged with timing data)
STAMP+= rndme.crypto("int", 610, Boolean).slice(-40);

// add entropy from orientation and acceleration sensors on portable devices and some laptops
rndme.motion("int", 40, function(s){
	STAMP+=s;
});

setTimeout(function(){ // load the worker code into a variable so that we can spawn fresh new workers without network IO:
	rndme.time("int", 40).then(function(s){
		STAMP+=s;
		$.get({ dataType: 'text', url: "/js/sjcl-core.js"}, function(coreCode){	
			$.get({ dataType: 'text', url: "/js/rsaworker.js"}, function(a,b,c){	
				workerURL=URL.createObjectURL(new Blob(["var STAMP="+STAMP+";var window=self;"+ coreCode +";\n\n\n"+a],{type:"text/plain"}));
				STAMP=STAMP.slice(-64).split("").reverse().join("");				
				window.WORKER=new Worker(workerURL);
				WORKER.onerror=console.error.bind(console);
				setTimeout(app.BOOT.bind(app), 38);
			}); // end worker code fetch;
		});//end core fetch
	});//end time() cb
}, 200 );	