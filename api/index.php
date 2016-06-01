<?php  /* nadachat API [CCBY4] 

Goals:
- provide a simple+maintainable CRUD interface for conversation data, no fancy PHP, no DB to break, with minimal setup
- reduce HTTP log footprint with uniform response lengths, no cookies, no GET params, and no personally identifiable data
- reduce long-term exposure by deleting any info ASAP that's not needed once used, like conversation encryption keys
- reduce network observation exposure with artificial delays, uniform response lengths, no cookies, and optional responses

*//////////////////////////////////////////////
// configuration:
$messageFolderPath = $_SERVER['DOCUMENT_ROOT'] . '/inbox/' ; // a rw folder where keys and message temporarily live
$debug = FALSE; // should text results be echoed to host after other-wise void commands run?
$bufferSize = 4096;	// size of each message, minimum. for hiding conversation details over the net, also sets stored message queue size (double this value)
$useUpgradedFilePerms = TRUE; // should chattr be applied to the message files (see inline usage, linux only, requires shell_exec())

///////////////////////////////////////////////
// setup page and php:
error_reporting(0);	// don't leak secrets
usleep(rand(123456, 230000));// at least TRY to complicate timing and DOS attacks
header("Content-Type:text/plain;charset=UTF-8"); // our JSON is not always valid, so use text
header("Cache-Control:no-cache"); // me well be back, don't ignore future requests

///////////////////////////////////////////////
// gather and sanitze any and all params:
$room=clean($_POST["room"]);
$cmd=	clean($_POST["cmd"]);
$tx=  	clean($_POST["tx"]);
$user= 	1 * $_POST["user"];
$data=  $_POST["data"]; // can't sanitize this one

if(!$cmd)	die("err: no cmd");	
if(!$room)	die("err: no room");

///////////////////////////////////////////////	
// set file path and make sure it's legit:
$FILE=  $messageFolderPath . $room . ".key";
if(!file_exists($FILE)){
	file_put_contents($FILE, " "); // if no file, make one so that we can append it:
	if($useUpgradedFilePerms) shell_exec('chattr +A +S +d ' . $FILE); // optional. make file non-dumpable, don't update access times, and make all file io sync
}
	
///////////////////////////////////////////////	
// API command dispatcher:
switch($cmd)	{
	case "publicKey": publicKey(); break;
	case "privateKey": privateKey(); break;
	case "ask": ask(); break;
	case "send": send(); break;
	case "fetch": fetch(); break;
	case "begin": begin(); break;
	case "leave": leave(); break;	
	default: break;
}
	
///////////////////////////////////////////////
// command handlers:
function fetch(){ // use long-polling to return  a delayed read of the conversation file
	global $data, $FILE, $bufferSize;	
	$timeLast  = strtotime($data);
	$misses=0;
	$chunkSize= $bufferSize * 1;
	
	while(1){
		$timeFile = strtotime(date(DATE_RFC2822, filemtime($FILE)));	
		$diff= $timeLast - $timeFile;
		$misses++;			
		if( ($diff < 1) || $misses > 56 ){
			if(filesize($FILE)> $bufferSize) $chunkSize = $bufferSize * 4; // if extra big, it's a private key packet.  (send() will clean it up soon enough)
			die(substr( str_repeat(" ", $chunkSize) . file_get_contents($FILE), -$chunkSize));	 // send tail of file only
		}
		usleep(333000);
		clearstatcache();	
	} // wend
} // end fetch()

function send(){ // append a message to file, truncating file if too big
	global $data, $FILE, $tx, $user, $bufferSize;	
	if( filesize( $FILE )  > ($bufferSize*2) )	write( substr( str_repeat(" ", ($bufferSize*2)) . file_get_contents($FILE), -($bufferSize*2))); // if file is too big, truncate it to fit
	$payload=array("date"=>strtotime(date(DATE_RFC2822))*1000, "cmd"=> 'send', "user"=>$user, "tx"=>$tx, "data"=>$data );
	append($payload);
	reply("wrote msg ");  
}

function publicKey(){ // write over file with incoming publicKey
	global $data;
	write("\n" . json_encode( array("cmd"=> 'publicKey', "data"=>$data ) ));
	reply("wrote pubkey");  
}

function privateKey(){ // just append incoming aes key 
	global $data;
	append(array("cmd"=> 'privateKey', "data"=>$data ));
	reply( "wrote aes key");
}

function ask(){ // fetch pubkey, then delete it
	global $FILE, $bufferSize;
	$oldContents= substr( file_get_contents($FILE) . str_repeat(" ", $bufferSize * 8)  , 0, $bufferSize * 8);
	write(" {}");
	echo $oldContents;
}

function begin(){ // clear AES keys and start conversation
	write(" {}");
	reply("sanitized keys");
}

function leave(){ // a user left, clear conversation history
	write(" ");
	reply("sanitized conversation");
}

/////////////////////////////////////
// utilities :

// a sanitizer for params:
function clean($str){ 
	if(!$str) return '';
	return preg_replace('/[\W]/','', $str); 
}

// sends a response of a uniform size, if debug is active
function reply($resp){
	global $debug, $bufferSize;
	if($debug) echo  substr( $resp , str_repeat(" ", $bufferSize) , 0, $bufferSize);  	
}

// replaces file contents with string passed
function write($strContents){
	global $FILE;
	file_put_contents($FILE, $strContents . "\n");
}

// appends file contents with json passed
function append($payload){
	global $FILE;
	$fh = fopen($FILE, 'a') or die();
	fwrite($fh,   json_encode( $payload ). "\n");
	fclose($fh);	
}

?>