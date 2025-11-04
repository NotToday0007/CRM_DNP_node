const fs = require("fs");
const axios = require("axios");
const path = require("path"); 
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
  const timestamp = Date.now();
  return `crm-web-${USER_ID}-${timestamp}`;
}

// ==============================
// 🚀 MAIN FUNCTION
// ==============================
async function main() {
  try {
    // 1️⃣ READ LEAD DATA FROM JSON
    if (!fs.existsSync(leadFilePath)) {
      throw new Error("Lead JSON file not found. Run the first script first.");
    }
    const leadData = JSON.parse(fs.readFileSync(leadFilePath, "utf-8"));
    const { leadId, name } = leadData;
    console.log(`🔑 Checking DNP automation for lead: ${name} (ID: ${leadId})\n`);

    // 2️⃣ LOGIN
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

    // 3️⃣ GET ALL LOGS FOR THIS LEAD
    const logsRes = await axios.get(
      `${BASE_URL}/logs?cols=*&search=table_id:${leadId};table_name:Lead&conditions=table_id:=;table_name:=&join=and&page=1&orderBy=created_at&sortedBy=desc`,
      { headers }
    );

    const logs = logsRes.data?.data || [];

    if (!logs.length) {
      console.log("ℹ️ No logs found for this lead.");
      return;
    }

    // 4️⃣ COLLECT ALL lead_update_history_id VALUES
    const leadUpdateHistoryIds = [];

    for (const log of logs) {
      if (!log.details || !log.details.length) continue;

      for (const detail of log.details) {
        if (detail.label === "lead_update_history_id" && detail.new_value) {
          leadUpdateHistoryIds.push(detail.new_value);
          console.log(`🧩 Found lead_update_history_id: ${detail.new_value}`);
        }
      }
    }

    if (leadUpdateHistoryIds.length === 0) {
      console.log("⚠️ No lead_update_history_id entries found in logs.");
      return;
    }

    console.log("\n🧾 Lead Update History IDs collected:");
    console.log(leadUpdateHistoryIds.join(", "));
    console.log("\n🔍 Now checking each ID for DNPAutomation...\n");

    // 5️⃣ CHECK EACH LOG DETAIL FOR DNPAutomation
    let foundAny = false;

    for (const logId of leadUpdateHistoryIds) {
      try {
        const logDetailsRes = await axios.get(`${BASE_URL}/logs/lead_update_history_id/${logId}`, { headers });
        const logDetails = logDetailsRes.data;

        if (logDetails?.name === "DNPAutomation") {
          console.log(`✅ DNPAutomation found for log ID ${logId}`);
          foundAny = true;
        } else {
          console.log(`ℹ️ DNPAutomation not found for log ID ${logId}`);
        }
      } catch (err) {
        console.warn(`⚠️ Could not fetch log details for ID ${logId}:`, err.response?.data || err.message);
      }
    }

    if (!foundAny) {
      console.log("\nℹ️ No DNPAutomation logs found for this lead.");
    }

    console.log("\n🎉 DNP Automation check completed!");
  } catch (err) {
    console.error("❌ Fatal Error:", err.response?.data || err.message);
  }
}

main();
