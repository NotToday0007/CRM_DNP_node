const { execSync } = require("child_process");
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());

// friendly homepage
app.get("/", (req, res) => {
  res.send("🚀 CRM DNP Automation Server: POST /run {file: 'day1_createLead.js'}");
});

// whitelist allowed script files
const ALLOWED = ["day1_createLead.js", "day2_3_checkLead.js", "day4_verifyLead.js"];

app.post("/run", (req, res) => {
  const { file } = req.body;
  if (!file) return res.status(400).send("Missing file name in body.");
  if (!ALLOWED.includes(file)) return res.status(400).send("File not allowed.");

  const scriptPath = path.join(__dirname, file);

  try {
    console.log(`🧩 Running script: ${scriptPath}`);
    execSync(`node ${scriptPath}`, { stdio: "inherit" });
    res.send(`✅ Successfully ran ${file}`);
  } catch (err) {
    console.error("❌ Script error:", err.message);
    res.status(500).send(`❌ Failed to run ${file}: ${err.message}`);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`⚡ Script runner active on port ${PORT}`));
