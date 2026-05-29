const fs = require("fs");
const file = "server.js";
let content = fs.readFileSync(file, "utf8");
if (content.includes("dominance-routes")) {
  console.log("ALREADY WIRED");
  process.exit(0);
}
content = `const dominanceRoutes = require("./dominance-routes");\n` + content;
const useLine = `app.use("/api/dominance", dominanceRoutes);\n`;
const listenIdx = content.indexOf("app.listen");
if (listenIdx !== -1) {
  const before = content.lastIndexOf("\n", listenIdx) + 1;
  content = content.slice(0, before) + useLine + content.slice(before);
} else {
  content += "\n" + useLine;
}
fs.writeFileSync(file, content);
console.log("WIRED");
