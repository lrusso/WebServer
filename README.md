# Simple Node.js Web Server

Simple Node.js Web Server for serving files.

### Running the Web server using the default port (8080):

```
node server.js
```

### Running the Web server using a custom port:

```
node server.js 9090
```

### Running the Web server using two custom ports:

```
node server.js 9090 9091
```

### Using the Web server in the background

1) Install Forever.
   
```
npm install forever -g
```

2) Start the Web Server.

```
forever start server.js
```

3) Stop the Web Server.

```
forever stop server.js
```
