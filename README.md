# Simple Node.js Web Server

Simple Node.js Web Server with SSL support.

### Running the Web server

```
node server.js
```

### Running the Web server using a custom ports

```
node server.js 8080 4430
```

---

### Workaround for browsing to localhost using SSL

- Run ```node server.js```
- Open Chrome and browse to ```https://localhost```
- Click on **ADVANCED**.
- Click on **Proceed to localhost (unsafe)**.

This workaround is useful for testing purposes and because, for example, you could have a Web App that may require access to your webcam and that is not allowed using a non-secure connection.

---

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
