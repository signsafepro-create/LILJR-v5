const fs = require("fs");
const file = "server.js";
let lines = fs.readFileSync(file, "utf8").split("\n");

// Remove any existing omnibus/aeon lines
lines = lines.filter(l => !l.includes("omnibus") && !l.includes("aeon"));

// Find last require line
let lastReq = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("require(")) lastReq = i;
}

// Insert requires after last require
lines.splice(lastReq + 1, 0,
  'const omnibusRoutes = require("./omnibus-routes");',
  'const aeonRoutes = require("./aeon-routes");'
);

// Find express.static line
let staticLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("express.static")) staticLine = i;
}

// Insert routes AFTER express.static (so API routes come before catch-all)
lines.splice(staticLine + 1, 0,
  'app.use("/api/omnibus", omnibusRoutes);',
  'app.use("/api/aeon", aeonRoutes);'
);

fs.writeFileSync(file, lines.join("\n"));
console.log("PATCHED");
