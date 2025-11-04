const fs = require("fs");
const axios = require("axios");
const path = require("path");  // ← add this line

// ==============================
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
function generateUniqueName() {
  const randomDigits = Math.floor(1000 + Math.random() * 9000);
  return `Rifat_DNP${randomDigits}`;
}

function generateUniqueMobile() {
  const prefix = "88017";
  const randomDigits = Math.floor(10000000 + Math.random() * 90000000);
  return prefix + randomDigits.toString().slice(0, 8);
}

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
    console.log("🔑 Step 1: Logging in...");

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
    console.log("✅ Logged in successfully!\n");

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "X-Log-Ref-Id": generateLogRefId(),
    };

    // 2️⃣ CREATE LEAD
    const name = generateUniqueName();
    const mobile = generateUniqueMobile();
    console.log(`🧾 Creating lead: ${name} (${mobile})`);

    const leadRes = await axios.post(
      `${BASE_URL}/leads`,
      {
        name,
        mobile,
        source: "Automation_script",
        product_id: 1,
        country_code: "BD",
      },
      { headers }
    );

    const leadId = leadRes?.data?.id;
    if (!leadId) throw new Error("Lead not created!");
    console.log(`✅ Lead created: ID = ${leadId}\n`);

    // 3️⃣ ASSIGN OWNER
    console.log("👨‍💼 Assigning owner...");
    await axios.put(
      `${BASE_URL}/leads/${leadId}/owner-assigns`,
      { owner_id: OWNER_ID },
      { headers }
    );
    console.log(`✅ Owner (ID: ${OWNER_ID}) assigned\n`);

    // Wait 2 seconds
    console.log("⏳ Waiting 2 seconds before calling API...");
    await delay(2000);

    // 4️⃣ CALLING HISTORY (wrap in try-catch to avoid stopping script)
    console.log("📞 Calling API...");
    try {
      await axios.post(
        `${BASE_URL}/calling-histories`,
        {
          lead_id: leadId,
          source_number: "8801766339207",
          destination_number: mobile,
        },
        { headers }
      );
      console.log("✅ Call sent successfully!");
    } catch (callErr) {
      console.warn("⚠️ Call API failed, but continuing. Error:", callErr.response?.data || callErr.message);
    }

    // 5️⃣ SAVE LEAD INFO LOCALLY
    const leadInfo = { leadId, name, mobile, createdAt: new Date().toISOString() };
    fs.writeFileSync(leadFilePath, JSON.stringify(leadInfo, null, 2));
    console.log(`💾 Lead info saved in ${leadFilePath}`);
    console.log("🎉 All steps completed successfully!");
  } catch (err) {
    console.error("❌ Fatal Error:", err.response?.data || err.message);
  }
}

main();
