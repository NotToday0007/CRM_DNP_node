import fs from "fs";
import axios from "axios";
import path from "path";
import { fileURLToPath } from "url";

// Recreate __dirname and __filename (not built-in in ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==============================
// 🔐 CONFIG SECTION
// ==============================
const BASE_URL = "https://crm-api.shikho.dev/api/v1";
const USERNAME = "rifatkhan.khan0044444@gmail.com";
const PASSWORD = "t3st9999";

const USER_ID = 965; // your user id
const OWNER_ID = 993;
const LEAD_STAGE_ID = 18;
const COURSE_ID = 10;
const BOOKING_MONEY = "1000.00";
const EXPECTED_VALUE = "1200.00";

// ==============================
// 🧠 Helper Functions
// ==============================
function generateLogRefId() {
  const timestamp = Date.now();
  return `crm-web-${USER_ID}-${timestamp}`;
}

function generateBookingTransId() {
  const randomNumber = Math.floor(10000000 + Math.random() * 90000000);
  return `AB${randomNumber}`;
}

function getCurrentTimestamp() {
  const now = new Date();
  const options = {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  const parts = new Intl.DateTimeFormat("en-CA", options).formatToParts(now);
  const yyyy = parts.find((p) => p.type === "year").value;
  const mm = parts.find((p) => p.type === "month").value;
  const dd = parts.find((p) => p.type === "day").value;
  const hh = parts.find((p) => p.type === "hour").value;
  const min = parts.find((p) => p.type === "minute").value;
  const ss = parts.find((p) => p.type === "second").value;
  return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

function generateLeadData() {
  const timestamp = Date.now();
  const name = `Arif_${timestamp}`;
  const mobile = "88017" + Math.floor(10000000 + Math.random() * 89999999);
  return { name, mobile };
}

// ==============================
// 🚀 Main Flow
// ==============================
(async () => {
  try {
    // Login
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

    if (!loginRes.data || !loginRes.data.access_token)
      throw new Error("No access token returned.");
    const token = loginRes.data.access_token;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "X-Log-Ref-Id": generateLogRefId(),
    };

    // Create Lead
    const { name, mobile } = generateLeadData();
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

    const leadId = leadRes.data?.id;
    if (!leadId) throw new Error("Lead ID not returned.");

    // Change Owner
    await axios.put(
      `${BASE_URL}/leads/${leadId}/owner-assigns`,
      { owner_id: OWNER_ID },
      { headers }
    );

    // Stage Assign
    const expectedCallingAt = getCurrentTimestamp();
    const bookingTransId = generateBookingTransId();

    await axios.put(
      `${BASE_URL}/leads/${leadId}/stage-assigns`,
      {
        lead_stage_id: LEAD_STAGE_ID,
        expected_calling_at: expectedCallingAt,
        task_priority: "high",
        course_id: COURSE_ID,
        expected_value: EXPECTED_VALUE,
        booking_money: BOOKING_MONEY,
        booking_trans_id: bookingTransId,
      },
      { headers }
    );

    // ✅ Short summary for email
  const emailBody = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background: #f4f7fa; padding: 30px 0; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 2px 6px rgba(0,0,0,0.05); overflow: hidden;">
      
      <div style="background: linear-gradient(90deg, #2b6cb0, #3182ce); padding: 18px 0; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 20px; letter-spacing: 0.5px;">💼 RTP Automation Report</h2>
      </div>

      <div style="padding: 20px 30px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
          <tr>
            <td style="padding: 8px 0; width: 45%; color: #4a5568;"><strong>Lead ID:</strong></td>
            <td style="padding: 8px 0; color: #2d3748;">${leadId}</td>
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
            <td style="padding: 8px 0; color: #4a5568;"><strong>Booking Trans ID:</strong></td>
            <td style="padding: 8px 0; color: #2d3748;">${bookingTransId}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #4a5568;"><strong>Expected Calling At:</strong></td>
            <td style="padding: 8px 0; color: #2d3748;">${expectedCallingAt}</td>
          </tr>
        </table>

        <div style="text-align: center; margin-top: 25px;">
          <p style="color: #38a169; font-weight: 600; margin: 0;">
            ✅ Successfully executed at ${new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka" })}
          </p>
        </div>
      </div>

    </div>
  </div>
`;


    // Output only this for n8n Email node
    console.log(JSON.stringify({ emailBody }));
  } catch (error) {
    const errorMsg = error.response
      ? `Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`
      : error.message || error;
    const emailBody = `
CRM Lead Automation Script FAILED ❌

Error: ${errorMsg}
`;
    console.log(JSON.stringify({ emailBody }));
    process.exitCode = 1;
  }
})();
