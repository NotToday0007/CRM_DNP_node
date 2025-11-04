import express from "express";
import { exec } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Required for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// Route to trigger script
app.post("/run", (req, res) => {
  const { file } = req.body;
  const filePath = path.join(__dirname, file);

  console.log(`🚀 CRM DNP Automation Server: POST /run { file: '${file}' }`);

  exec(`node ${filePath}`, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Error: ${error.message}`);
      return res.status(500).json({ error: error.message });
    }
    if (stderr) {
      console.error(`⚠️ Stderr: ${stderr}`);
    }
    console.log(`✅ Script Output:\n${stdout}`);
    res.json({ message: "Script executed successfully", output: stdout });
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
