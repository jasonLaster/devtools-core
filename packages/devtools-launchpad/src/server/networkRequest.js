const http = require("http");
const https = require("https");

const fs = require("fs");

function httpOrHttpsGet(url, onResponse) {
  let protocol = url.startsWith("https:") ? https : http;

  return protocol.get(url, response => {
    if (response.statusCode !== 200) {
      console.error(`error response: ${response.statusCode} to ${url}`);
      response.emit("statusCode", new Error(response.statusCode));
      return onResponse("{}");
    }
    let body = "";
    response.on("data", d => {
      body += d;
    });
    response.on("end", () => onResponse(body));

    return undefined;
  });
}

function atob(str) {
  return new Buffer(str, "base64").toString("binary");
}

function handleNetworkRequest(req, res) {
  const url = req.query.url;
  if (url.startsWith("file://")) {
    const _path = url.replace("file://", "");
    res.json(JSON.parse(fs.readFileSync(_path, "utf8")));
  } else if (url.startsWith("data:")) {
    const match = url.match(/^(data:application\/json;base64,)(.*)/);
    if (match) {
      const [, , base64] = match;
      const json = atob(base64);
      return res.status(200).send(json);
    }
    res.status(500).send("Malformed data request");
  } else {
    const httpReq = httpOrHttpsGet(req.query.url, body => {
      try {
        res.send(body);
      } catch (e) {
        res.status(500).send("Malformed json");
      }
    });

    httpReq.on("error", err => res.status(500).send(err.code));
    httpReq.on("statusCode", err => res.status(err.message).send(err.message));
  }
}

module.exports = {
  handleNetworkRequest
};
