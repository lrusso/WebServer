# Simple Node.js Web Server

Simple Node.js Web Server for serving files.

### Running the Web server using the default port (80) and a SSL port (443)

```
node server.js
```

### Running the Web server using a custom ports

```
node server.js 8080 4430
```

### Running the Web server in the background

* First, you need to install Forever.
   
```
npm install -g forever
```

* Then, for starting the Web Server:

```
forever start -a -l /dev/null -c node server.js > /dev/null 2>&1
```

* Finally, for stopping the Web Server:

```
forever stop -a -l /dev/null -c node server.js > /dev/null 2>&1
```
