# Simple Node.js Web Server

Simple Node.js Web server with SSL support.

## Running the Web server

* Standard ports: ```node server.js```
* Customs ports: ```node server.js 8080 4430```

## Workaround for browsing to localhost using SSL

1. Run ```node server.js```
2. Open Chrome and browse to ```https://localhost```
3. Click on ```ADVANCED```
4. Click on ```Proceed to localhost (unsafe)```

This workaround is useful for testing purposes because, for example, a Web App may require access to the webcam and that is not allowed using a non-secure connection.

## Running the Web server in the background

1. Install Forever: ```npm install -g forever```
2. Start the server: ```forever start -a -l /dev/null -c node server.js > /dev/null 2>&1```
3. Stop the server: ```forever stop -a -l /dev/null -c node server.js > /dev/null 2>&1```

## How to launch the server on startup (MacOS)

- Run `nano ~/Library/LaunchAgents/com.lrusso.server.plist`
- Assuming that you have the server folder path in `/Users/lrusso/Server`, paste the following code:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.lrusso.server</string>

    <key>ProgramArguments</key>
    <array>
        <string>/usr/local/bin/node</string>
        <string>/Users/lrusso/Server/server.js</string>
    </array>

    <key>WorkingDirectory</key>
    <string>/Users/lrusso/Server</string>

    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:/opt/homebrew/bin</string>
    </dict>

    <key>RunAtLoad</key>
    <true/>

    <key>KeepAlive</key>
    <true/>

    <key>StandardErrorPath</key>
    <string>/dev/null</string>
    <key>StandardOutPath</key>
    <string>/dev/null</string>
</dict>
</plist>
```

- Run `chmod 644 ~/Library/LaunchAgents/com.lrusso.server.plist`
- Run `launchctl load ~/Library/LaunchAgents/com.lrusso.server.plist`
