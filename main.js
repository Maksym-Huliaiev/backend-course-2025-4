const { Command } = require("commander");
const { XMLBuilder } = require("fast-xml-parser");
const fs = require("fs");
const http = require("http");
const { URL } = require("url");

const program = new Command();

program
  .requiredOption("-i, --input <path>", "шлях до файлу для читання (JSON/JSONL)")
  .requiredOption("-h, --host <host>", "адреса сервера")
  .requiredOption("-p, --port <port>", "порт сервера");

program.parse(process.argv);
const opts = program.opts();

console.log(opts);

if (!fs.existsSync(opts.input)) {
    console.error(`Cannot find input file.`);
    process.exit(1);
}

function buildXml(passengers, includeAge) {
  const mapped = passengers.map((p) => {
    const node = {
      name: p.Name || "",
      ticket: p.Ticket || "",
    };
    if (includeAge && p.Age) {
      node.age = p.Age;
    }
    return node;
  });

  const root = { passengers: { passenger: mapped } };

  const builder = new XMLBuilder({
    ignoreAttributes: false,
    suppressEmptyNode: true,
    format: true,
  });
  return builder.build(root);
}

const server = http.createServer((req, res) => {   
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const survivedParam = url.searchParams.get("survived");
    const ageParam = url.searchParams.get("age");

    fs.readFile(opts.input, "utf-8", (err, data) => {
        if (err) {  
            console.error("Error reading file:", err);
            res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Error reading file");
            return;
        }

        const lines = data.split('\n');

        let passangers = lines.map(line => JSON.parse(line));

        let filtered = passangers;
        if (survivedParam && survivedParam.toLowerCase() === "true") {
          filtered = passangers.filter((passanger) => passanger.Survived ==='1');
        }

        const includeAge = Boolean(ageParam && ageParam.toLowerCase() === "true");
        const xml = buildXml(filtered, includeAge);

        res.writeHead(200, {
        "Content-Type": "application/xml; charset=utf-8"
        });
        res.end(xml);
    });
    
  } catch (err) {
    console.error("Error processing request:", err);
    res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Internal Server Error");
  }
})    

server.listen(opts.port, opts.host, () => {
    console.log(`Server running at http://${opts.host}:${opts.port}/`);
});