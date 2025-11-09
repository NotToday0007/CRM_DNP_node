import fs from "fs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

// recreate dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// 🔐 CONFIG
// ==============================
const BASE_URL = "https://crm-api.shikho.dev/api/v1";
const USERNAME = "rifatkhan.khan0044444@gmail.com";
const PASSWORD = "t3st9999";
const USER_ID = 965;
const leadFilePath = path.join(__dirname, "lead_data.json");

// ==============================
// 🧠 HELPERS
// ==============================
function generateLogRefId() {
  return `crm-web-${USER_ID}-${Date.now()}`;
}

function formatDateTime(dt) {
  const date = new Date(dt);
  return date.toLocaleString("en-BD", { hour12: true }).replace(",", "");
}

// ==============================
// 🚀 MAIN FUNCTION
// ==============================
async function main() {
  try {
    // 1️⃣ READ LEAD DATA
    if (!fs.existsSync(leadFilePath)) {
      throw new Error("Lead JSON file not found. Run the first script first.");
    }

    const leadData = JSON.parse(fs.readFileSync(leadFilePath, "utf-8"));
    const { leadId, name, mobile, expectedCallingAt } = leadData;

    // 2️⃣ LOGIN TO CRM
    const loginRes = await axios.post(
      `${BASE_URL}/auth/login`,
      new URLSearchParams({ username: USERNAME, password: PASSWORD }),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "X-Log-Ref-Id": generateLogRefId(),
        },
      }
    );

    const token = loginRes.data?.access_token;
    if (!token) throw new Error("Login failed — no token found!");

    const headers = {
      Authorization: `Bearer ${token}`,
      "X-Log-Ref-Id": generateLogRefId(),
    };

    // 3️⃣ FETCH LOGS
    const logsRes = await axios.get(
      `${BASE_URL}/logs?cols=*&search=table_id:${leadId};table_name:Lead&conditions=table_id:=;table_name:=&join=and&page=1&orderBy=created_at&sortedBy=desc`,
      { headers }
    );

    const logs = logsRes.data?.data || [];
    const leadUpdateHistoryIds = [];

    for (const log of logs) {
      if (!log.details) continue;
      for (const detail of log.details) {
        if (detail.label === "lead_update_history_id" && detail.new_value) {
          leadUpdateHistoryIds.push(detail.new_value);
        }
      }
    }

    // 4️⃣ CHECK DNPAutomation
    let found = false;
    for (const logId of leadUpdateHistoryIds) {
      try {
        const logDetailsRes = await axios.get(
          `${BASE_URL}/logs/lead_update_history_id/${logId}`,
          { headers }
        );
        const logDetails = logDetailsRes.data;

        if (logDetails?.name === "DNPAutomation") {
          found = true;
          break;
        }
      } catch {}
    }

    // 5️⃣ FETCH CURRENT OWNER INFO
    let ownerName = "N/A";
    try {
      const leadDetailsRes = await axios.get(
        `${BASE_URL}/leads/${leadId}?cols=*`,
        { headers }
      );
      ownerName = leadDetailsRes.data?.owner?.name || "N/A";
    } catch (err) {
      console.warn("⚠️ Could not fetch owner info:", err.message);
    }

    // 6️⃣ BUILD HTML EMAIL BODY
    const dnpStatus = found ? "Found ✅" : "Not Found ❌";
    const expectedTime = expectedCallingAt
      ? formatDateTime(expectedCallingAt)
      : "N/A";
    const executedAt = formatDateTime(new Date());

    // create clickable lead link
    const leadUrl = `https://crm.shikho.dev/details/lead/${leadId}`;

    const emailBody = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7fa; padding: 30px 0; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.05); overflow: hidden;">
    
    <div style="background: linear-gradient(90deg, #2b6cb0, #3182ce); padding: 18px 0; text-align: center; color: white;">
      <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">💼 DNP Automation Report</h2>
    </div>

    <div style="padding: 20px 30px;">
      <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
        <tr>
          <td style="padding: 8px 0; width: 45%; color: #4a5568;"><strong>Lead Link:</strong></td>
          <td style="padding: 8px 0; color: #2d3748;">
            <a href="${leadUrl}" style="color: #2b6cb0; text-decoration: none; font-weight: 600;">View Lead</a>
          </td>
        </tr>
        <tr style="background-color: #f9fafc;">
          <td style="padding: 8px 0; color: #4a5568;"><strong>Name:</strong></td>
          <td style="padding: 8px 0; color: #2d3748;">${name}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4a5568;"><strong>Mobile:</strong></td>
          <td style="padding: 8px 0; color: #2d3748;">${mobile}</td>
        </tr>
        <tr style="background-color: #f9fafc;">
          <td style="padding: 8px 0; color: #4a5568;"><strong>DNP Automation:</strong></td>
          <td style="padding: 8px 0; color: #2d3748;">${dnpStatus}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #4a5568;"><strong>Latest Owner:</strong></td>
          <td style="padding: 8px 0; color: #2d3748;">${ownerName}</td>
        </tr>
      </table>

      <div style="text-align: center; margin-top: 25px;">
        <p style="color: #38a169; font-weight: 600; margin: 0;">
          ✅ Successfully executed at ${executedAt}
        </p>
      </div>
    </div>

  </div>
</div>
`;

    // 7️⃣ PRINT HTML REPORT (for n8n email)
    console.log(JSON.stringify({ emailBody }));

  } catch (err) {
    const errorMsg = err.response
      ? `Status: ${err.response.status}, Data: ${JSON.stringify(err.response.data)}`
      : err.message || err;

    const emailBody = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7fa; padding: 30px 0; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.05); overflow: hidden; padding: 20px;">
    <h3 style="color: #e53e3e;">❌ CRM Lead Automation Script FAILED</h3>
    <p>${errorMsg}</p>
  </div>
</div>
`;

    console.log(JSON.stringify({ emailBody }));
    process.exitCode = 1;
  }
}

main();
