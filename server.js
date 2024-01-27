const http = require("http")
const fs = require("fs")
const url = require("url")

const ROOT_FOLDER = "/public"
const ERROR_FILE_NOT_FOUND = "File not found"

http
  .createServer((req, res) => {
    let fileName = url.parse(req.url).pathname

    // IF THERE IS NO FILENAME IN THE URL, USING THE DEFAULT FILENAME
    fileName =
      fileName === "/" ? ROOT_FOLDER + "/index.html" : ROOT_FOLDER + fileName

    // IF PATH/INDEX.HTML EXISTS, REDIRECTING TO IT
    if (fs.existsSync(__dirname + fileName + "/index.html")) {
      const redirectedURL =
        fileName.substring(ROOT_FOLDER.length, fileName.length) + "/index.html"

      res.writeHead(302, {
        Location: redirectedURL,
      })
      res.end()
      return
    }

    const isTextFile =
      fileName.indexOf(".js") === fileName.length - 3 ||
      fileName.indexOf(".htm") === fileName.length - 4 ||
      fileName.indexOf(".html") === fileName.length - 5 ||
      fileName.indexOf(".json") === fileName.length - 5 ||
      fileName.indexOf(".txt") === fileName.length - 4 ||
      fileName.indexOf(".md") === fileName.length - 3

    fs.readFile(__dirname + decodeURIComponent(fileName), "binary", (_, content) => {
      try {
        if (isTextFile) {
          res.writeHead(200, { "Content-Length": content.length })
          res.write(content)
          res.end()
        } else {
          const binaryContent = Buffer.from(content, "binary")
          res.writeHead(200, {
            "Content-Length": binaryContent.length,
          })
          res.end(binaryContent)
        }
      } catch (err) {
        res.writeHead(404, { "Content-Length": ERROR_FILE_NOT_FOUND.length })
        res.write(ERROR_FILE_NOT_FOUND)
        res.end()
      }
    })
  })
  .listen(8080)
