<?php
	$NONCE=base64_encode(getGoodRandom(16));
	//header("Strict-Transport-Security: max-age=31536000; includeSubDomains"); // this is persisted by useragents, so it can't be used...
	header("Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self' fonts.googleapis.com cdnjs.cloudflare.com; media-src data:; font-src cdnjs.cloudflare.com fonts.gstatic.com; script-src 'self' 'nonce-" . $NONCE .  "'  blob:; child-src data: blob:; connect-src 'self' ");
	
	function getGoodRandom($bytes = 32){
		if (function_exists('random_bytes')) return random_bytes($bytes );
		if (function_exists('openssl_random_pseudo_bytes')) return openssl_random_pseudo_bytes($bytes );
		if (function_exists('mcrypt_create_iv')) return mcrypt_create_iv($bytes , MCRYPT_DEV_URANDOM);
		if (@is_readable('/dev/urandom')) return shell_exec('head -c '. $bytes .' < /dev/urandom');
	}

?><!DOCTYPE html>
<html lang=en>
  <head>
    <meta charset="utf-8">
    <title>nadachat</title>

    <meta name=description content="secure chat, simplified">
    <meta name=author content=dandavis>

	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name=viewport content="width=360, initial-scale=1">
	
    <link rel=icon href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAAAb1BMVEUAAAAhuQwswxIPrQQFnwAAogAswxMwxxQpwBEnvxAguQ0WsAgTsAcAngAAlAAAmQAwyBUswxIpwREmvxAkvw8iug4jug4iug4euQscuQsYtAgatQsKqwAIowMJpQMKpQMAlgAAmwAAkAA80Bs1zBfqXBpsAAAAI3RSTlMAsPpyQgf++fXsu4mCMCIP/vTs5dvXzsWopKCRZ1xSTTgcF79dx4oAAAB3SURBVDjL7crXDoJAFAZhD7sUqfbe/33/ZzQxUQmETLhnbuebTY0pflyKo5kdzs43/Xu1LOhXsnev9m7KubpFp/oPPrtPivgLNNC2AqClB6D0DkCpB6DVE4ByAuEGQDsCoQKgkkBOYE0gIpAQyAhsCBgBB2BRvwGHA1YAeHZI+QAAAABJRU5ErkJggg==">
	
    <!-- Bootstrap core CSS -->
    <link href="https://cdnjs.cloudflare.com/ajax/libs/bootswatch/3.3.6/cyborg/bootstrap.min.css" rel=stylesheet>
    <!-- Application CSS -->
	<link href="css/main.css" rel=stylesheet>
	
</head>
<body data-mode=0 id=body class=loading>
  
    <nav class="navbar navbar-inverse navbar-fixed-top">
      <div class=container>
	  <div class=row>
	  
		  <div class=col-xs-4>
				 <a class=navbar-brand href=#><b>nada</b>chat</a>
		  </div>
		  
		  <div class="col-xs-3 col-xs-offset-2">
			<a id=lnkBeep href=# class=navbar-brand>			 
				<span id=spnBeep><span class="glyphicon glyphicon-volume-off" aria-hidden="true"></span>
			</a>
		  </div>
		  
		  <div class=col-xs-3>
				<a href=# class="pull-right text-danger navbar-brand" id=btnLeave><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></a>
		  </div>
	  
		</div> <!-- /row -->
      </div>  <!-- / container -->
    </nav>
    <div class=container>
      <main id=main class=row>
		   
		   <!-- status panels: -->
		   <div class=col-xs-12 id=box>
				
			<div class="panel panel-default setup" data-rs=0> 
				<div class=panel-heading> 
					<h3 class=panel-title> 
					<span class="glyphicon glyphicon-cog spin" aria-hidden=true></span> 	Minting Encryption Keys
					</h3> 
				</div> 
				<div class=panel-body>
				<div class=progress>
					<div class="progress-bar progress-bar-striped progress-bar-warning " role=progressbar></div>
				</div> <br>
					Generating Keys, please stand by...
			  </div> 
			</div>
				
			<div class="panel panel-default  setup" data-rs=1> 
				<div class=panel-heading> 
					<h3 class=panel-title>
					<span class="glyphicon glyphicon-link" aria-hidden=true></span> 	One-Time Conversation URL
					</h3> 
				</div> 
				<div class="panel-body">
					<div class=progress>
						<div class="progress-bar progress-bar-striped active progress-bar-success" role=progressbar></div>
					</div> <br>
					Waiting for someone else to join...
									<hr>
					
					Send someone <a href id=pageurlLink disabled> this unique URL invite</a> <b>:</b>  <br><br>
					<input id=pageurl size=50 ><br><br>
					Chat opens when they arrive at the url

			  </div> 
			</div>		
						
			<div class="panel panel-default setup" data-rs=2> 
				<div class=panel-heading> 
					<h3 class=panel-title>
						<span class="glyphicon glyphicon-cog spin" aria-hidden=true></span>  Securing Connection...
					</h3> 
				</div> 
				<div class=panel-body>
					<div class=progress>
						<div class="progress-bar progress-bar-striped " role=progressbar></div>
					</div> <br>
					Confirming Invite and Connecting. 
			  </div> 
			</div>

						
			<div class="panel panel-default setup" data-rs=3> 
				<div class=panel-heading> 
					<h3 class=panel-title>
						<span class="glyphicon glyphicon-cog spin" aria-hidden=true></span>  Secure Invite Found!
					</h3> 
				</div> 
				<div class=panel-body>
					<div class=progress>
						<div class="progress-bar progress-bar-striped " role=progressbar></div>
					</div> <br>
					Encrypting secure transport... <em> This can take a while, please be patient. </em></small>
			  </div> 
			</div>
						
				<div class="panel panel-default setup" data-rs=4> 
				<div class=panel-heading> 
					<h3 class=panel-title>
					<span class="glyphicon glyphicon-cog spin" aria-hidden=true></span> 	Confirming Invite
					</h3> 
				</div> 
				<div class=panel-body>
					<div class=progress>
						<div class="progress-bar progress-bar-striped " role=progressbar></div>
					</div> <br>
					Validating secure transport...
			  </div> 
			</div>
			
			<div class="panel panel-primary setup" data-rs=5> 
				<div class=panel-heading> 
					<h3 class=panel-title> 
					<span class="glyphicon glyphicon-ok-sign" aria-hidden=true></span>	Connection Secure
					</h3> 
				</div> 
				<div class=panel-body>
					Ready to chat
			  </div> 
			</div>
							
			<div class="panel panel-warning setup" data-rs=6> 
				<div class=panel-heading> 
					<h3 class=panel-title> 
					<span class="glyphicon glyphicon-warning-sign" aria-hidden=true></span> 	Connection Idle
					</h3> 
				</div> 
				<div class=panel-body>
					Other participant has left the chat!<br>
					<button class='btn btn-success reload'>Start a New Chat</button>
			  </div> 
			</div>
		
			<div class="panel panel-danger setup" data-rs=7> 
				<div class=panel-heading> 
					<h3 class=panel-title> 
					<span class="glyphicon glyphicon-warning-sign" aria-hidden=true></span> 	Authentication Error
					</h3> 
				</div> 
				<div class=panel-body>
					You attempted to join an expired chat or a chat in-progress, which not possible. <br>
					<button class='btn btn-success reload'>Start a New Chat</button>
			  </div> 
			</div>
		
			<div class="panel panel-danger setup" data-rs=8> 
				<div class=panel-heading> 
					<h3 class=panel-title> 
						<span class="glyphicon glyphicon-warning-sign" aria-hidden=true></span>  Network Error
					</h3> 
				</div> 
				<div class=panel-body>
					Your network connection was expired, dropped, or altered; closing secure session.<br>
					<button class='btn btn-success reload'>Start a New Chat</button>
			  </div> 
			</div>		
			
			<div class="panel panel-danger setup" data-rs=9> 
				<div class=panel-heading> 
					<h3 class=panel-title> 
						<span class="glyphicon glyphicon-warning-sign" aria-hidden=true></span>  Session Timeout
					</h3> 
				</div> 
				<div class=panel-body>
					Connection to server was closed due to inactivity or by a participant leaving early<br>
					<button class='btn btn-success reload'>Start a New Chat</button>
			  </div> 
			</div>	
		
			<!-- message container -->
			<ul id=ulList></ul>	   
		
		
			<div id=info class="panel panel-default setup"  >
				<div class=panel-heading> 
					<h3 class=panel-title> 
						<span class="glyphicon glyphicon-info-sign" aria-hidden=true></span> About
						
						<span class="pull-right dropper glyphicon glyphicon-chevron-up" aria-hidden="true"></span>
						<span class="pull-right dropper glyphicon glyphicon-chevron-down" aria-hidden="true"></span>
						
					</h3> 
				</div> 
				<div class=panel-body>				
					<div class=row>
					<div class="col-md-8 col-md-offset-2">
					<h3>nadachat is a free secure messaging service. </h3>
					
					<p>
						End-to-End Encryption protects from hackers, criminals, ISPs/Employers, and overseers.
					</p>
					
					
									
				<div id=faqbox>
					<h3 id="faq">FAQ</h3>
					<h4 id="how-long-can-a-message-be-">How long can a message be?</h4>
					<p>Messages are limited to 1400 characters, or 10X more than a tweet. The relatively small message size ensures that the unique encryption key used for each message is not stretched too thin.</p>
					<h4 id="how-long-can-a-conversation-last-">How long can a conversation last?</h4>
					<p>There is no time limit, but conversations with no message for one hour will be automatically destroyed. There's also a one-hour limit of wait time between generating a URL invite and starting a conversation, which ensures that encryption keys are always fresh.</p>
					<h4 id="how-safe-are-my-conversations-">How safe are my conversations?</h4>
					<p>Really really safe. nadachat uses state of the art Elliptical Curve (521bit) and AES256 encryption, per-message unique keys (with future and backward secrecy), and authenticated encryption modes that ensure message integrity. See the security plan for more info.</p>
					<h4 id="why-does-reloading-destroy-the-conversation-">Why does reloading destroy the conversation?</h4>
					<p>By design, a lost or broken conversation cannot be restored or recovered. Since nadachat never stores encryption keys, the codes needed to communicate are lost forever when the tab is closed or reloaded.</p>
					<h4 id="how-does-this-make-money-">How does this make money?</h4>
					<p>It doesn't, but it doesn't cost very much to run either, so consider it a gift; you're welcome.</p>
				</div>

  <h3>More Info</h3>
					 <ul class=list>
						<li><a href="https://github.com/rndme/nadachat/blob/master/about.md" target=_blank >Read more about nadachat</a>
						<li><a href="https://github.com/rndme/nadachat/blob/master/security.md" target=_blank>Review nadachat's security strategy</a>
						<li><a href="https://github.com/rndme/nadachat" target=_blank>View nadachat's Source Code on GitHub</a>
					</ul>
					

					
					</div>
					</div>
				</div>
			</div>
		
		
		</div> <!-- // #box -->
	</main>

	<footer id=footer class=row>
		<span class=col-xs-10>
			<textarea id=taMsg rows=5 maxlength=1400></textarea>
		</span>
		<span class=col-xs-2>
			<button class="btn btn-default" id=btnSend disabled >Send</button>
		</span>	  
	</footer>
	  
    </div><!-- /.container -->

	<!-- add some secure entropy from php to compliment the client-produced randomness -->
	<script nonce="<?php echo $NONCE; ?>">
		var STAMP= atob("<?php echo base64_encode(getGoodRandom(96));?>") // seed from php
			.split("")
			.map(function(a){return a.charCodeAt(0).toString(10).slice(-2);}) // convert bytes to digits
			.join("");
			document.currentScript.remove(); // abundance of caution against XSS (STAMP is mixed later)
	</script>	

	<!-- marked is used to make links clickable and allow full markdown formatting in messages w/o XSS risks -->
	<script src=js/marked.js integrity="sha256-x425uGKPiyhQuub8JdKRiMy2i59+iop/9kBrqOpX7hs="
		data-orig=https://github.com/chjj/marked/></script>

	<!-- sha3 is used to derive keys from keys and to uniform-ize randomness -->
	<script src=js/sha3.js intregrity="sha256-BpS8p6Ij/LTe5PANKG9Kwv3Qn2riUoe6ASS+TrX3Be0=" 
		data-orig=https://github.com/emn178/js-sha3/></script>

	<!-- rndme is used to gather randomness from motion (on mobile devices) and timing data -->
	<script src=js/rndme.js integrity="sha256-YRwyFKcgux7NHabeEHxUzD00pBhNIPd8IeN4mxyISO4=" 
		data-orig=https://github.com/rndme/rndme/></script>

	<!-- jquery is used to connect the view to the logic and handle interaction event -->
	<script src=js/jquery.js integrity="sha256-iT6Q9iMJYuQiMWNd9lDyBUStIq/8PuOW33aOqmvFpqI="
		data-orig=https://code.jquery.com/></script>

	<!-- main contains all the application-specific logic, with the exception of the crypto operations, which are done by webworkers -->
	<script src=js/main.js></script>

  </body>
</html>
