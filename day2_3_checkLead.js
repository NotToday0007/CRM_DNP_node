import fs from "fs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname and __filename (not built-in in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// 🔐 CONFIG
// ==============================
const BASE_URL = "https://crm-api.shikho.dev/api/v1";
const USERNAME = "rifatkhan.khan0044444@gmail.com";
const PASSWORD = "t3st9999";
const USER_ID = 965;
const OWNER_ID = 965;
const leadFilePath = path.join(__dirname, "lead_data.json");

// ==============================
// 🧠 HELPERS
// ==============================
function generateLogRefId() {
  const timestamp = Date.now();
  return `crm-web-${USER_ID}-${timestamp}`;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    const { leadId, mobile, name } = leadData;
    console.log(`🔑 Using saved lead: ${name} (ID: ${leadId}, Mobile: ${mobile})\n`);

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
      "Content-Type": "application/json",
      "X-Log-Ref-Id": generateLogRefId(),
    };
    console.log("✅ Logged in successfully!\n");

    // 3️⃣ GET CURRENT LEAD INFO
    const leadRes = await axios.get(`${BASE_URL}/leads/${leadId}`, { headers });
const leadInfo = leadRes.data; // <-- fix here
if (!leadInfo) throw new Error("Could not fetch lead info.");

const currentOwnerId = leadInfo.owner_id;
const currentStageId = leadInfo.lead_stage_id;

    // 4️⃣ ASSIGN OWNER IF MISSING
   // 4️⃣ ASSIGN OWNER IF MISSING OR NOT 965
if (!currentOwnerId || currentOwnerId !== OWNER_ID) {
  console.log(`👨‍💼 Owner is ${currentOwnerId || "not assigned"}. Assigning OWNER_ID = ${OWNER_ID}...`);
  await axios.put(
    `${BASE_URL}/leads/${leadId}/owner-assigns`,
    { owner_id: OWNER_ID },
    { headers }
  );
  console.log(`✅ Owner assigned successfully to ${OWNER_ID}.\n`);
} else {
  console.log(`✅ Lead already has correct owner ID: ${currentOwnerId}. Proceeding...\n`);
}
    // 5️⃣ UPDATE STAGE IF 18
    if (currentStageId === 18) {
      console.log(`🔄 Lead stage is 18. Updating to 2...`);
      await axios.put(
        `${BASE_URL}/leads/${leadId}/stage-assigns`,
        { lead_stage_id: 2 },
        { headers }
      );
      console.log("✅ Stage updated to 2.\n");
    } else {
      console.log(`✅ Lead stage is ${currentStageId}. No change needed.\n`);
    }

    // 6️⃣ CALLING HISTORY
    console.log("📞 Sending call API...");
    try {
      await delay(2000); // 2 seconds wait
      await axios.post(
        `${BASE_URL}/calling-histories`,
        {
          lead_id: leadId,
          source_number: mobile,
          destination_number: mobile,
        },
        { headers }
      );
      console.log("✅ Call API executed successfully!\n");
    } catch (callErr) {
      console.warn("⚠️ Call API failed, but continuing. Error:", callErr.response?.data || callErr.message);
    }

    console.log("🎉 All steps completed successfully!");
  } catch (err) {
    console.error("❌ Fatal Error:", err.response?.data || err.message);
  }
}

main();
