const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const virtualConsole = new jsdom.VirtualConsole();
virtualConsole.on("error", (err) => { console.error("JSDOM Error:", err); });
virtualConsole.on("log", (log) => { console.log("JSDOM Log:", log); });
virtualConsole.on("warn", (warn) => { console.warn("JSDOM Warn:", warn); });

JSDOM.fromURL("https://b2b-mobile-app.vercel.app/", {
  runScripts: "dangerously",
  resources: "usable",
  virtualConsole
}).then(dom => {
  setTimeout(() => {
    console.log("Done waiting 5 seconds.");
  }, 5000);
}).catch(err => {
  console.error("Fetch error:", err);
});
