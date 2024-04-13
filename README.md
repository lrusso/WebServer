# Simple Node.js Web Server

Simple Node.js Web Server with SSL support.

## Running the Web server

* Standard ports: ```node server.js```
* Customs ports: ```node server.js 8080 4430```

## Workaround for browsing to localhost using SSL

1. Run ```node server.js```
2. Open Chrome and browse to ```https://localhost```
3. Click on ```ADVANCED```.
4. Click on ```Proceed to localhost (unsafe)```.

This workaround is useful for testing purposes because, for example, a Web App may require access to the webcam and that is not allowed using a non-secure connection.

## Running the Web server in the background

1. Install Forever: ```npm install -g forever```
2. Start the server: ```forever start -a -l /dev/null -c node server.js > /dev/null 2>&1```
3. Stop the server: ```forever stop -a -l /dev/null -c node server.js > /dev/null 2>&1```
