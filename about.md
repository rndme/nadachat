



# nadachat
### Super Safe, Super Simple

#### Web-based secure chat, easy as 1-2-3
1. copy the selected 1-time url at [https://nadachat.com/](https://nadachat/com/)
2. send your contact the url in an email, sms, im, smoke signals, etc
3. they click the link, you both start chatting


## Why nadachat?
nadachat provides a quick and easy way to securely communicate over the web without application installs, user registration, or prior-arrangement. 
Existing online offerings use weak or no end-to-end encryption, are slow and cumbersome, or complicated to use. 
Many services even run advertisements which can track you online! 
There HAD to be something simpler and better, so nadachat was designed from the ground up around three principles:

1. Easy enough for a grandma to use
2. Safe enough for a president to use
3. Easy cleanup of digital artifacts


## Safe, not just secure
nadachat protects you in ways others can't or won't. 

### No downloads, stored contacts, or installs
Smartphone apps need to be downloaded with a signed-in account, leaving a server record of your possession. 
Sometimes just having a secure messaging app is enough to look suspicious. 
Installing any app also leaves a good deal of forensic evidence on the device/computer. 
If you are forced to unlock your device, secure messaging contacts gives others a solid lead on where to turn next. 

Unlike a mere email address, if you have securely verified a contact with a QR code or other shared secret, there's no denying that you know that person and are both using the application. 
Most web-based solutions (fb, hangouts, etc) require account registrations and can connect the dots between such known users, and are known to cooperate with surveillance organizations. 




### Minimal Forensic Evidence
While everyone knows that an examination of a smartphone would reveal a messaging app, many folks don't realize how many activity artifacts web browsing leaves behind.  

* Cookies record where and when you've been, so nadachat doesn't use them. 
* Pictures are nice, but your device saves copies, so nadachat doesn't use them. 
* Stored preferences like beep/no beep create files, so nadachat doesn't use them. 
* Taskbar message notifications can be intercepted or logged to the system, so nadachat doesn't use them. 
* Microphones and cameras can provide unpredictable data for making strong cryptography keys, but approving them records the permissions to the device, so nadachat doesn't use them. 

In short, there are many ways for the web to inadvertently pollute your device, but nadachat goes out of the way to avoid as many as possible.


### Minimal Interception Opportunity

Even if someone intercepts all your messages and both devices used, it's impossible to recover the contents of your messages if the conversation is over.

While HTTPS keeps out ISPs, websites themselves can still see anything you send. 
That's why nadachat also uses powerful end-to-end encryption to ensure nobody else knows what you're saying, and basic techniques that go beyond encryption:

* Each conversation uses a different master key, which is never put to disk, and is thus un-recoverable. 
* Each message uses a different unpredictable key. 
* The secure nadachat server also takes precautions to enhance your safety and privacy. 
* nadachat.com has no database to breach, and the site's code is [formatted on github](https://github.com/rndme/nadachat/) anyway.  
* All servers log all traffic, but it's possible to reduce the level of detail considerably (see example further down). 
* All messages sent from nadachat are the same size, to remove conversation context and http log details. 
* All interaction happens from one url, and that url never has any identifying content, so logs can't reveal activity specifics. 
* Small delays are introduced to make it harder for an outsider to tell who you're talking to. 
* Clicking the (exit) link purges any (encrypted) conversation data on the server, but it's deleted within 2 hours normally.  

In short, lots of apps are encrypted, but nadachat tries to conceal so-called meta-data and prevent targeted attacks as well.



### Powerful Encryption
nadachat uses strong enough encryption to protect the [US government's "TOP-SECRET"](https://en.wikipedia.org/wiki/NSA_Suite_B_Cryptography) . 
The encryption is backed by [strong key generation](https://www.schneier.com/academic/fortuna/) process that incorporates several different sources of un-predictable randomness, the essence of strong cryptography. 
A [public-key](https://en.wikipedia.org/wiki/Public-key_cryptography) invite allows the joining party to safely send more keys to the inviter to use for each message. 
The private key used to decrypt those keys is never saved (locally or on a server), which makes it basically impossible to recover. 

If you want the specifics of nadachat's encryption, please review the [security overview](https://github.com/rndme/nadachat/blob/master/security.md) or browse the full application source online, 
but in a nutshell: a public-key pair of [ECC 521bit curves (p521)](https://github.com/bitwiseshiftleft/sjcl/wiki/Asymmetric-Crypto#sjcl-implements-a-couple-nist-and-secg-curves) protects a 
 bevy of [nonces](https://en.wikipedia.org/wiki/Cryptographic_nonce) used to derive 
 (along with ratcheting via [SHA-3](http://www.cryptrec.go.jp/estimation/techrep_id2402.pdf)) 256 bit [AES-GCM](https://www.owasp.org/index.php/Cryptographic_Storage_Cheat_Sheet#Rule_-_Use_strong_approved_Authenticated_Encryption) 
 symmetric keys for unique per-message authenticated encryption.

The encryption is so powerful, it might run a little bit slow on current mobile devices but your next upgrade will improve the performance. 


### Open Source
nadachat is completely free in every way: free to use and free to customize, even for commercial use with the MIT licence. 
Nobody's guessing about how safe it is or isn't because everyone can review all the pieces, front and back, for themselves. 
None of it's underlying code (written or used) is "obfuscated" or restrictively licensed. 
Not only can you run it yourself, it's even easy to do so. Nadachat only needs a plain old PHP webserver, the kind your company's IT department already runs. 
Even common $x.99/month shared web-hosting plans can suffice. 
nadachat puts no firewall config, compiling code, weird server setups, complicated install procedures, click-through-agreements, or other obstacles in your way: 
  copy a folder to your server and you're up and running.



### Securing the web
nadachat uses 21st-century browser features to lock down an often-unruly web. 
All the code libraries use integrity verification to prevent un-detected modification. 
The page itself uses a strict Content Security Policy to prevent XSS attacks that would compromise your keys or messages. 
All of the actual cryptography work is done in a separate sandboxed thread from the actual page's JavaScript runtime to prevent active and timing attacks. 
HTTPS helps prevent man-in-the-middle attacks and passive (bulk) surveillance. 
A powerful CSPRNG is used, along with diverse and copious entropy, to generate keys and secrets without reliance upon the common but flawed in-browser offerings. 
All code used is delivered in full, un-minified, to allow end-user inspection. 
Avoiding outside scripts, analytics, and advertisements further reduces the attack surface. 
In short, if there's a technology or technique that makes a web application safer, nadachat uses it to keep your conversations safe.




## EFF Secure IM Checklist

The EFF provides a [checklist of features](https://www.eff.org/node/82654) to gauge the privacy and security of instant messaging services, and here's how nadachat stacks up:

 1. **Encrypted in transit?** Yes.
 1. **Encrypted so the provider can't read it?** Yes.
 1. **Can you verify contacts' identities?** No, contacts aren't saved/known; trust is "Time Of First Use".
 1. **Are past communications secure if your keys are stolen?** Yes.
 1. **Is the code open to independent review?** Yes.
 1. **Is security design properly documented?** Yes, [available here](https://github.com/rndme/nadachat/blob/master/security.md).
 1. **Has there been any recent code audit?** No. Soon? 
 


## In the interest of being open
You should be aware that nadachat.com (or any server running a nadachat server) has access to _some_ information associated with users. 
This is primarily limited to your IP address (unique) and [Browser Identifier](http://www.useragentstring.com/pages/Browserlist/) (not unique), 
and times you connected and sent message. nadachat.com stores logs for 72 hours, other server widely vary.  <br>


For the curious, here is an excerpt from the nadachat.com server logs chronicling a brief 6-message conversation between chrome and vivaldi:

```log
# (IP addresses redacted and userAgent shortened for formatting)
# chrome loading:
192.168.0.0 - - [04/Jun/2016:23:46:47 -0700] "GET / HTTP/1.1" 200 13311 "-" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:47 -0700] "GET /css/main.css HTTP/1.1" 200 3912 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:47 -0700] "GET /js/marked.js HTTP/1.1" 200 28945 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:47 -0700] "GET /js/rndme.js HTTP/1.1" 200 15730 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:47 -0700] "GET /js/sha3.js HTTP/1.1" 200 16315 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:47 -0700] "GET /js/main.js HTTP/1.1" 200 12983 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:47 -0700] "GET /js/jquery.js HTTP/1.1" 200 258468 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:48 -0700] "GET /js/sjcl-core.js HTTP/1.1" 200 114938 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:48 -0700] "GET /js/rsaworker.js HTTP/1.1" 200 4838 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:48 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:50 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "102 Safari/537.36" 
# vivaldi invitee loading:
192.168.0.0 - - [04/Jun/2016:23:46:53 -0700] "GET / HTTP/1.1" 200 8377 "-" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:53 -0700] "GET /css/main.css HTTP/1.1" 200 3912 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:53 -0700] "GET /js/marked.js HTTP/1.1" 200 29083 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:53 -0700] "GET /js/sha3.js HTTP/1.1" 200 16315 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:53 -0700] "GET /js/rndme.js HTTP/1.1" 200 15730 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:53 -0700] "GET /js/main.js HTTP/1.1" 200 12983 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:53 -0700] "GET /js/jquery.js HTTP/1.1" 200 258468 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:54 -0700] "GET /js/sjcl-core.js HTTP/1.1" 200 114938 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:55 -0700] "GET /js/rsaworker.js HTTP/1.1" 200 4838 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
# both browsers loaded, begin exchange:
192.168.0.0 - - [04/Jun/2016:23:46:55 -0700] "POST /api/ HTTP/1.1" 200 24968 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:51 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:56 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:55 -0700] "POST /api/ HTTP/1.1" 200 31080 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:56 -0700] "POST /api/ HTTP/1.1" 200 3486 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:56 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:57 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:59 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:58 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:57 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:47:03 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:46:59 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:46:59 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:47:06 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:47:03 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:47:03 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:47:09 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:47:06 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:47:07 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:47:12 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:47:09 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:47:09 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "102 Safari/537.36" 
192.168.0.0 - - [04/Jun/2016:23:47:18 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:47:12 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "75 Safari/537.36 Vivaldi/1.1.453.36" 
192.168.0.0 - - [04/Jun/2016:23:47:12 -0700] "POST /api/ HTTP/1.1" 200 3348 "https://nadachat.com/" "102 Safari/537.36" 
```


## Other Good Tools
If you don't mind possessing a secure messaging application, 
[signal](https://play.google.com/store/apps/details?id=org.thoughtcrime.securesms&hl=en), 
[surespot](https://www.surespot.me/), and 
[telegram](https://play.google.com/store/apps/details?id=org.telegram.messenger&hl=en) are good choices. 
See a [decent lifehacker article](http://lifehacker.com/how-to-encrypt-your-email-and-keep-your-conversations-p-1133495744) for info about email protection, 
and a [pc world article](http://www.pcworld.com/article/2304851/so-long-truecrypt-5-encryption-alternatives-that-can-lock-down-your-data.html) about disk encryption to further protect yourself from hackers, criminals, and oppressive governments.
The TOR browser is good for anon web access, but it's also highly suspicious, so use with care.


## Legal Mumbo Jumbo
_Mainly applies to nadachat.com, see licenses for info about running your own copy._ 

While it is very safe, nadachat or it's service providers are not liable for anything bad that happens from using it. It IS possible to tell THAT a conversation took place via surveillance, even if if WHAT the conversation was about is un-knowable. If compelled, nadachat.com WILL provide records to Law Enforcement. That said, by design there's not much nadachat.com can give them, since it doesn't ever see private keys used to encrypt conversations, much less store them. 

