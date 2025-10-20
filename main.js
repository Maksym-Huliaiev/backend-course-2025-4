const { Command } = require("commander");
const fs = require("fs");
const http = require("http");

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

const server = http.createServer((req, res) => {    
    res.end('ok');    
})    

server.listen(opts.port, opts.host, () => {
    console.log(`Server running at http://${opts.host}:${opts.port}/`);
});