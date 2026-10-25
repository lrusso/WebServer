const https = require("https")
const http = require("http")
const fs = require("fs")
const { join, sep } = require("path")

const ROOT_FOLDER = "/public"
const PUBLIC_FOLDER = join(__dirname, ROOT_FOLDER)
const ERROR_FILE_NOT_FOUND = "File Not Found"
const ERROR_INTERNAL_SERVER_ERROR = "Internal Server Error"

const CHUNK_SIZE_IN_MB = 10

const args = process.argv?.slice(2)
const serverPort = args.length > 0 ? args[0] : 80
const serverSSLPort = args.length > 1 ? args[1] : 443

const isFolder = (path) => {
  try {
    const stats = fs.statSync(path)
    return stats.isDirectory()
  } catch (error) {
    return false
  }
}

const isFile = (path) => {
  try {
    const stats = fs.statSync(path)
    return stats.isFile()
  } catch (error) {
    return false
  }
}

const getLocalPath = (pathname) => {
  try {
    const localPath = join(PUBLIC_FOLDER, decodeURIComponent(pathname))

    // paths outside the public folder (e.g. an encoded "../") are not served
    return (localPath + sep).startsWith(PUBLIC_FOLDER + sep) ? localPath : null
  } catch (err) {
    // malformed urls (e.g. a lone "%") can't be decoded
    return null
  }
}

const encodePath = (path) => {
  // each part of the path is encoded, so the names with "#", "?", "%" or
  // spaces still work as links
  return path.split("/").map(encodeURIComponent).join("/")
}

const escapeHTML = (text) => {
  // the names are shown as text, so a name like <b>hola.txt isn't taken as html
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

const handleRequest = (req, res) => {
  const baseURL =
    (req.protocol ? req.protocol : "http") + "://" + req.headers.host + "/"
  let reqUrl = null
  try {
    reqUrl = new URL(req.url, baseURL)
  } catch (err) {
    // the urls that can't be parsed (e.g. "//" or a wrong host) are handled as
    // a missing file
    res.writeHead(404, {
      "Content-Length": ERROR_FILE_NOT_FOUND.length,
      "Content-Type": "text/plain",
    })
    res.write(ERROR_FILE_NOT_FOUND)
    res.end()
    return
  }

  const requestedFilename =
    reqUrl.pathname === "/" ? ROOT_FOLDER : ROOT_FOLDER + reqUrl.pathname
  const requestedPath = getLocalPath(reqUrl.pathname)

  if (!requestedPath || !fs.existsSync(requestedPath)) {
    res.writeHead(404, {
      "Content-Length": ERROR_FILE_NOT_FOUND.length,
      "Content-Type": "text/plain",
    })
    res.write(ERROR_FILE_NOT_FOUND)
    res.end()
    return
  }

  const indexPath = requestedPath + "/index.html"
  const rootIndexPath = PUBLIC_FOLDER + "/index.html"

  if (reqUrl.pathname === "/" && isFile(rootIndexPath)) {
    const filePath = rootIndexPath
    const fileSize = fs.statSync(filePath).size
    const readStream = fs.createReadStream(filePath)

    // a file that can't be read closes the connection instead of the server
    readStream.on("error", () => res.destroy())

    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "text/html",
      "Accept-Ranges": "bytes",
    })
    readStream.pipe(res)
    return
  }

  if (
    isFolder(requestedPath) &&
    isFile(indexPath) &&
    reqUrl.pathname.endsWith("/")
  ) {
    const filePath = indexPath
    const fileSize = fs.statSync(filePath).size
    const readStream = fs.createReadStream(filePath)
    readStream.on("error", () => res.destroy())
    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "text/html",
      "Accept-Ranges": "bytes",
    })
    readStream.pipe(res)
    return
  }

  if (
    isFolder(requestedPath) &&
    isFile(indexPath) &&
    !reqUrl.pathname.endsWith("/")
  ) {
    res.writeHead(302, {
      Location: reqUrl.pathname + "/",
    })
    res.end()
    return
  }

  // a folder without an index.html is listed without the trailing slash (the
  // root is the exception, since its url always ends with a slash)
  if (
    isFolder(requestedPath) &&
    !isFile(indexPath) &&
    reqUrl.pathname.endsWith("/") &&
    reqUrl.pathname !== "/"
  ) {
    res.writeHead(302, {
      Location: reqUrl.pathname.replace(/\/+$/, ""),
    })
    res.end()
    return
  }

  if (isFolder(requestedPath)) {
    const folderName = decodeURIComponent(requestedFilename).substring(
      ROOT_FOLDER.length,
      decodeURIComponent(requestedFilename).length
    )
    const folderUp = folderName.substring(0, folderName.lastIndexOf("/"))
    const folderContent = fs.readdirSync(requestedPath).sort((a, b) => {
      const aIsDir = isFolder(requestedPath + "/" + a),
        bIsDir = isFolder(requestedPath + "/" + b)
      if (aIsDir && !bIsDir) {
        return -1
      }
      if (!aIsDir && bIsDir) {
        return 1
      }
      return a.localeCompare(b)
    })

    const contentHeader =
      `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>Index of ` +
      (folderName !== "" ? escapeHTML(folderName) : "/") +
      `</title></head><body><h1>Index of ` +
      (folderName !== "" ? escapeHTML(folderName) : "/") +
      `</h1><hr><table>`

    let contentBody =
      requestedFilename !== ROOT_FOLDER
        ? `<tr><td>[DIR]</td><td><a href="` +
          (folderUp !== "" ? encodePath(folderUp) : "/") +
          `">..</a></td></tr>`
        : ""
    folderContent.forEach((file) => {
      contentBody =
        contentBody +
        "<tr><td>" +
        (isFolder(requestedPath + "/" + file) ? "[DIR]" : "") +
        '</td><td><a href="' +
        encodePath(folderName + (folderName.endsWith("/") ? "" : "/") + file) +
        '">' +
        escapeHTML(file) +
        "</a></td></tr>"
    })

    const contentFooter = `</table><hr></body></html>`

    // the length is in bytes, so the names with accents (e.g. canción) aren't cut
    res.writeHead(200, {
      "Content-Length": Buffer.byteLength(
        contentHeader + contentBody + contentFooter
      ),
      "Content-Type": "text/html",
    })
    res.write(contentHeader + contentBody + contentFooter)
    res.end()
    return
  }

  try {
    const filePath = __dirname + decodeURIComponent(requestedFilename)
    const fileExtension = requestedFilename.split(".").pop().toLowerCase()
    const fileSize = fs.statSync(filePath).size
    // only the byte ranges are supported, a range in any other unit is ignored
    const fileRange =
      req.headers.range && req.headers.range.startsWith("bytes=")
        ? req.headers.range.replace(/bytes=/, "").split("-")
        : null
    let fileRangeStart = fileRange ? parseInt(fileRange[0]) : null
    let fileRangeEnd = fileRange
      ? fileRange[1]
        ? parseInt(fileRange[1])
        : Math.min(fileRange[0] + CHUNK_SIZE_IN_MB * 1048576, fileSize - 1)
      : null

    // a range without its start (e.g. bytes=-500) asks for the last bytes
    if (fileRange && fileRange[0] === "") {
      fileRangeStart = Math.max(fileSize - parseInt(fileRange[1]), 0)
      fileRangeEnd = fileSize - 1
    }

    // a range that goes past the end of the file stops at its last byte
    if (fileRangeEnd > fileSize - 1) {
      fileRangeEnd = fileSize - 1
    }

    // a range that can't be served (e.g. starting after the end of the file)
    if (fileRange && !(fileRangeStart <= fileRangeEnd)) {
      res.writeHead(416, {
        "Content-Range": "bytes */" + fileSize,
      })
      res.end()
      return
    }

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
          return "application/pdf"

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

        case "rar":
          return "application/x-rar-compressed"

        case "gz":
          return "application/gzip"

        case "epub":
          return "application/epub+zip"

        case "rtf":
          return "application/rtf"

        case "doc":
          return "application/msword"

        case "docx":
          return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

        case "xls":
          return "application/vnd.ms-excel"

        case "xlsx":
          return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"

        case "ppt":
          return "application/vnd.ms-powerpoint"

        case "pptx":
          return "application/vnd.openxmlformats-officedocument.presentationml.presentation"

        case "mp3":
          return "audio/mpeg"

        case "aac":
          return "audio/aac"

        case "flac":
          return "audio/x-flac"

        case "wav":
          return "audio/wav"

        case "ogg":
          return "audio/ogg"

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

    const readStream = fs.createReadStream(
      filePath,
      fileRange ? { start: fileRangeStart, end: fileRangeEnd } : undefined
    )
    readStream.on("error", () => res.destroy())

    if (fileRange) {
      res.writeHead(206, {
        "Content-Range":
          "bytes " + fileRangeStart + "-" + fileRangeEnd + "/" + fileSize,
        "Content-Length": fileRangeEnd - fileRangeStart + 1,
        "Content-Type": getMimeType(),
        "Accept-Ranges": "bytes",
      })
    } else {
      res.writeHead(200, {
        "Content-Length": fileSize,
        "Content-Type": getMimeType(),
        "Accept-Ranges": "bytes",
      })
    }

    readStream.pipe(res)
  } catch (err) {
    console.log(err)
    res.writeHead(500, {
      "Content-Length": ERROR_INTERNAL_SERVER_ERROR.length,
      "Content-Type": "text/plain",
    })
    res.write(ERROR_INTERNAL_SERVER_ERROR)
    res.end()
  }
}

const showServerError = (err, port) => {
  if (err.code === "EADDRINUSE") {
    console.log("\nError: Port " + port + " is already in use.\n")
    console.log(
      "Please close the application using that port or choose a different port.\n"
    )
  } else if (err.code === "EACCES") {
    // on linux, the ports below 1024 (such as 80) require administrator privileges
    console.log("\nError: Port " + port + " requires administrator privileges.\n")
    console.log(
      "Please run the server as administrator or choose a port above 1023.\n"
    )
  } else {
    console.log(err)
  }
  process.exit(1)
}

try {
  http
    .createServer(handleRequest)
    .on("error", (err) => showServerError(err, serverPort))
    .on("listening", () => {
      console.log("\nServer running.\n")
      console.log(
        "Browse to http://localhost" +
          (serverPort !== 80 ? ":" + serverPort : "") +
          "\n"
      )
    })
    .listen(serverPort)
} catch (err) {
  console.log(err)
}

try {
  const sslPrivateKey =
    "-----BEGIN RSA PRIVATE KEY-----\nMIICXQIBAAKBgQC+kN7aXygeOp2/bB+GrER7AiTQuizpwK19whemmFTtsu79JgWS\nADkdUfhPeJrmBPHJnhGWskLUoWyqLYM1GCfDNAyojmyW9ZFwCCiLaUuHn+Usg7+v\ndcKIGV8MKWrjojtlQatsLa2K01v9CWbaJz9p0VNLUw1l9yh5TZQCroo87QIDAQAB\nAoGAD6w+h9s3o3TSsIGl/h+A6lT8ziXht7/fBO7Hny38HiiPO0a7Qoy+JckuEOss\nYiqZ8CkN7UTv9ijolP51QhKggmsHvk/wX79xnHmQLgl/mY0yPxH6KDBihHK3J+lu\nHnH9Dk+b2VOx63+6nmF38X0GPBeQR7HBIcTl8VgZmmwdr0kCQQDraPL124EeLjGu\nAQsfeOZaZUain83jc1FouBeJ3j3X3iWKlyuZgD3e+ALV+U6Fzv379x9eBmUwGap2\ncEYt4mXbAkEAzzvSG7dhpxFdjF+QjAxt8E1x+udakGBFvCoz9EeYZEXd8CkzZZKB\nBrfZVHgjkd+yhCAT7D+8MV271xg3uAe21wJBAOYhM5p7Gg8p83D6HiiHJRFrfhDO\njhRzEDuB86jYdLaJuUNxorKttk45P3R0Ano2rv3ZSHW/ZL4P6R9dhI2ojA8CQQCK\nKtlAL3kFObfEcqbeKR9Xm1sGLSAdqIJ2HTE8ikuZd1es2ttwukgaYZOeFOeqR5ov\nK2/9ENV5mIQ3uebUZRhLAkAWmRDcafDV1lXnzqGMVvDWwQ9UoCnJueDJCFLqK+ra\nzo+8drKU+VqY6ymQpPPYj2fUaYgwqvTvRxykzZjS/0MB\n-----END RSA PRIVATE KEY-----"
  const sslCertificate =
    "-----BEGIN CERTIFICATE-----\nMIIB/TCCAWYCCQDK5QPVVgU3jzANBgkqhkiG9w0BAQUFADBDMQswCQYDVQQGEwJV\nUzETMBEGA1UECBMKQ2FsaWZvcm5pYTESMBAGA1UEBxMJU2FuIE1hdGVvMQswCQYD\nVQQKEwJTTDAeFw0xNDAxMzExODQzNTFaFw0xNDAzMDIxODQzNTFaMEMxCzAJBgNV\nBAYTAlVTMRMwEQYDVQQIEwpDYWxpZm9ybmlhMRIwEAYDVQQHEwlTYW4gTWF0ZW8x\nCzAJBgNVBAoTAlNMMIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC+kN7aXyge\nOp2/bB+GrER7AiTQuizpwK19whemmFTtsu79JgWSADkdUfhPeJrmBPHJnhGWskLU\noWyqLYM1GCfDNAyojmyW9ZFwCCiLaUuHn+Usg7+vdcKIGV8MKWrjojtlQatsLa2K\n01v9CWbaJz9p0VNLUw1l9yh5TZQCroo87QIDAQABMA0GCSqGSIb3DQEBBQUAA4GB\nAKAEe950tCwT7ysq6KvlEDLrYu9wqjgd/VaXub6TX/HOT5n5naxoOJJpDDuTfUhX\nKmBl3hpm6zvSDCr4X40LIZJVIoKvLmJwkVZ8Ywk10v6qRRRx9djycB2AYPBmXUIX\nIaVfh2k2z6Kg191s7BKZREw0xRQh4giNKls9FsiZeM8E\n-----END CERTIFICATE-----"

  https
    .createServer(
      {
        key: sslPrivateKey.replace(/\\n/g, "\n"),
        cert: sslCertificate.replace(/\\n/g, "\n"),
      },
      handleRequest
    )
    .on("error", (err) => showServerError(err, serverSSLPort))
    .listen(serverSSLPort)
} catch (err) {
  console.log(err)
}
