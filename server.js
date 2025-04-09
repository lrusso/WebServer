const https = require("https")
const http = require("http")
const fs = require("fs")

const ROOT_FOLDER = "/public"
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

const handleRequest = (req, res) => {
  const baseURL =
    (req.protocol ? req.protocol : "http") + "://" + req.headers.host + "/"
  const reqUrl = new URL(req.url, baseURL)

  // IF THERE IS NO FILENAME IN THE URL, USING THE DEFAULT FILENAME
  let fileName =
    reqUrl.pathname === "/" ? ROOT_FOLDER : ROOT_FOLDER + reqUrl.pathname

  // PREVENTING TO BROWSE TO A URL THAT ENDS WITH A SLASH (UNLESS IT'S THE ROOT)
  if (fileName !== ROOT_FOLDER && fileName.endsWith("/")) {
    const normalizedURL = fileName.substring(ROOT_FOLDER.length, fileName.length - 1)

    res.writeHead(302, {
      Location: normalizedURL,
    })
    res.end()
    return
  }

  // IF PATH/INDEX.HTML EXISTS, IT WILL BE READ
  if (
    isFolder(__dirname + decodeURIComponent(fileName)) &&
    isFile(__dirname + decodeURIComponent(fileName) + "/index.html")
  ) {
    const normalizedURL =
      fileName.substring(ROOT_FOLDER.length, fileName.length) + "/index.html"
    res.writeHead(302, {
      Location: normalizedURL,
    })
    res.end()
    return
  }

  const requestedPath = __dirname + decodeURIComponent(fileName)

  if (!fs.existsSync(requestedPath)) {
    res.writeHead(404, {
      "Content-Length": ERROR_FILE_NOT_FOUND.length,
      "Content-Type": "text/plain",
    })
    res.write(ERROR_FILE_NOT_FOUND)
    res.end()
    return
  }

  if (isFolder(requestedPath)) {
    const folderName = decodeURIComponent(fileName).substring(
      ROOT_FOLDER.length,
      decodeURIComponent(fileName).length
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
      (folderName !== "" ? folderName : "/") +
      `</title></head><body><h1>Index of ` +
      (folderName !== "" ? folderName : "/") +
      `</h1><hr><table>`

    let contentBody =
      fileName !== ROOT_FOLDER
        ? `<tr><td>[DIR]</td><td><a href="` +
          (folderUp !== "" ? folderUp : "/") +
          `">..</a></td></tr>`
        : ""
    folderContent.forEach((file) => {
      contentBody =
        contentBody +
        "<tr><td>" +
        (isFolder(requestedPath + "/" + file) ? "[DIR]" : "") +
        '</td><td><a href="' +
        folderName +
        "/" +
        file +
        '">' +
        file +
        "</a></td></tr>"
    })

    const contentFooter = `</table><hr></body></html>`

    res.writeHead(200, {
      "Content-Length":
        contentHeader.length + contentBody.length + contentFooter.length,
      "Content-Type": "text/html",
    })
    res.write(contentHeader + contentBody + contentFooter)
    res.end()
    return
  }

  try {
    const filePath = __dirname + decodeURIComponent(fileName)
    const fileExtension = fileName.split(".").pop().toLowerCase()
    const fileSize = fs.statSync(filePath).size
    const fileRange = req.headers.range
      ? req.headers.range.replace(/bytes=/, "").split("-")
      : null
    const fileRangeStart = fileRange ? parseInt(fileRange[0]) : null
    const fileRangeEnd = fileRange
      ? fileRange[1]
        ? parseInt(fileRange[1])
        : Math.min(fileRange[0] + CHUNK_SIZE_IN_MB * 1048576, fileSize - 1)
      : null

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

try {
  http.createServer(handleRequest).listen(serverPort)
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
    .listen(serverSSLPort)
} catch (err) {
  console.log(err)
}
