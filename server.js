// ==============================
// 📦 IMPORTS (ESM Style)
// ==============================
import { execSync } from "child_process";
import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// ==============================
// ⚙️ ESM Helpers
// ==============================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// 🚀 EXPRESS APP SETUP
// ==============================
const app = express();
app.use(express.json());

// ==============================
// 📂 Ensure lead_data.json exists
// ==============================
const leadDataPath = path.join(__dirname, "lead_data.json");
if (!fs.existsSync(leadDataPath)) {
  fs.writeFileSync(leadDataPath, JSON.stringify({}, null, 2));
  console.log("📁 lead_data.json created");
}

// ==============================
// 🏠 Homepage
// ==============================
app.get("/", (req, res) => {
  res.send("🚀 CRM DNP Automation Server: POST /run { file: 'day1_createLead.js' }");
});

// ==============================
// ✅ Allowed Scripts
// ==============================
const ALLOWED = [
  "day1_createLead.js",
  "day2_3_checkLead.js",
  "day4_verifyLead.js"
];

// ==============================
// ⚙️ Run Script Endpoint
// ==============================
app.post("/run", (req, res) => {
  const { file } = req.body;

  if (!file) {
    return res.status(400).json({ error: "Missing 'file' in body." });
  }

  if (!ALLOWED.includes(file)) {
    return res.status(400).json({ error: "File not allowed." });
  }

  const scriptPath = path.join(__dirname, file);

  try {
    console.log(`🧩 Running script: ${scriptPath}`);
    execSync(`node "${scriptPath}"`, { stdio: "inherit" });
    res.json({ success: true, message: `✅ Successfully ran ${file}` });
  } catch (err) {
    console.error("❌ Script error:", err);
    res.status(500).json({
      success: false,
      message: `❌ Failed to run ${file}`,
      error: err.message,
    });
  }
});

// ==============================
// 🖥️ START SERVER
// ==============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`⚡ Script Runner Active on port ${PORT}`));
