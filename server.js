const http = require("http")
const fs = require("fs")

const ROOT_FOLDER = "/public"
const ERROR_FILE_NOT_FOUND = "File not found"

const args = process.argv?.slice(2)
const serverPort = args.length > 0 ? args[0] : 8080

const handleRequest = (req, res) => {
  const baseURL = req.protocol + "://" + req.headers.host + "/"
  const reqUrl = new URL(req.url, baseURL)

  let fileName = reqUrl.pathname

  // IF THERE IS NO FILENAME IN THE URL, USING THE DEFAULT FILENAME
  fileName = fileName === "/" ? ROOT_FOLDER + "/index.html" : ROOT_FOLDER + fileName

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

  var fileExtension = fileName.split(".").pop().toLowerCase()

  const isTextFile =
    fileExtension === "html" ||
    fileExtension === ".html" ||
    fileExtension === ".json" ||
    fileExtension === ".txt" ||
    fileExtension === ".md"

  const getMimeType = () => {
    switch (fileExtension) {
      case "html":
        return "text/html"

      case "htm":
        return "text/html"

      case "css":
        return "text/css"

      case "csv":
        return "text/csv"

      case "pdf":
        return "text/markdown"

      case "js":
        return "text/javascript"

      case "json":
        return "application/json"

      case "txt":
        return "text/plain"

      case "md":
        return "text/markdown"

      case "zip":
        return "application/zip"

      case "7z":
        return "application/x-7z-compressed"

      case "gz":
        return "application/gzip"

      case "sh":
        return "application/x-sh"

      case "epub":
        return "application/epub+zip"

      case "doc":
        return "application/msword"

      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

      case "mp3":
        return "audio/mpeg"

      case "wav":
        return "audio/wav"

      case "flac":
        return "audio/x-flac"

      case "mp4":
        return "video/mp4"

      case "avi":
        return "video/x-msvideo"

      case "3gp":
        return "video/3gpp"

      case "mkv":
        return "video/x-matroska"

      case "mpg":
        return "video/mpeg"

      case "mpeg":
        return "video/mpeg"

      case "ico":
        return "image/vnd.microsoft.icon"

      case "png":
        return "image/png"

      case "jpg":
        return "image/jpeg"

      case "jpeg":
        return "image/jpeg"

      case "gif":
        return "image/gif"

      case "bmp":
        return "image/bmp"

      case "svg":
        return "image/svg+xml"

      default:
        return "application/octet-stream"
    }
  }

  fs.readFile(__dirname + decodeURIComponent(fileName), "binary", (_, content) => {
    try {
      if (isTextFile) {
        res.writeHead(200, {
          "Content-Length": content.length,
          "Content-Type": getMimeType(),
        })
        res.write(content)
        res.end()
      } else {
        const binaryContent = Buffer.from(content, "binary")
        res.writeHead(200, {
          "Content-Length": binaryContent.length,
          "Content-Type": getMimeType(),
        })
        res.write(binaryContent)
        res.end()
      }
    } catch (err) {
      res.writeHead(404, {
        "Content-Length": ERROR_FILE_NOT_FOUND.length,
        "Content-Type": "text/plain",
      })
      res.write(ERROR_FILE_NOT_FOUND)
      res.end()
    }
  })
}

http.createServer(handleRequest).listen(serverPort)
