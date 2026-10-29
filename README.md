# 🏋️ FitTrack — Personal Trainer CRM & Client Management

A simple, fast, and mobile-friendly CRM built specifically for a personal trainer managing diet plans, client progress, earnings, and follow-ups.

---

## 🌟 Key Features

1. **Dashboard & 6:00 AM Daily Morning Briefing**:
   - Quick stats: Total clients, active trainees, this month's earnings (₹), pending follow-ups.
   - 6:00 AM Morning Brief banner highlighting today's follow-up tasks with one-click actions.
   - One-tap WhatsApp chat buttons directly from the card.

2. **Lead & Client Management**:
   - Save Name, Phone (+91 format), Email, Instagram handle (@username), Source (Instagram DM / WhatsApp / Referral), and Notes.
   - Status tracking: `Lead` ➔ `Active` ➔ `Completed` ➔ `Inactive`.
   - **Smart Auto-Fill**:
     - Pre-fills standard ₹2,500 rate.
     - Auto-converts client status from `Lead` to `Active` when first payment is logged.
     - Auto-schedules a check-in follow-up 7 days after payment.

3. **Diet Plan Tracker**:
   - Log diet plans (Plan name, start/end dates, detailed meal and macro breakdown).
   - Track plan adjustments with an **automatic changes log** (so he never forgets what was tweaked).
   - Status toggle: `Active`, `Completed`, `Paused`.

4. **Health Metrics & Auto-calculated BMI**:
   - Log Weight (kg), Height (cm), Body Fat %, Date, and Notes.
   - **Auto-calculates BMI** in real-time with visual category badges (Normal, Overweight, etc.).
   - Displays total weight progress (e.g., `↓ 3.5 kg lost`).

5. **Earnings Tracker**:
   - Total earnings and monthly comparisons in Indian Rupees (₹).
   - Breakdown by service (`Diet Plan`, `Personal Training`, `Consultation`).
   - Monthly revenue bar chart.
   - Log new payments in 2 taps.

6. **Promotions & Future Gym Invites**:
   - Filter past clients who dropped off after 1 session.
   - Pre-made WhatsApp message templates:
     - 🏋️‍♂️ **Gym Launch / VIP Founder Invitation**
     - 🥗 **New Diet Transformation Batch (₹2,500)**
     - 🔄 **Re-engagement Check-in**
     - ✍️ **Custom Broadcast Message**
   - Direct WhatsApp message links with personalized name replacements (`{name}`).
   - **One-Click CSV Export**: Download complete client list to import into WhatsApp Business broadcast or gym software.

---

## 🏃 Quick Start (Local)

```bash
cd fittrack
npm install
npm run dev -- --port 3333
```
Open **`http://localhost:3333`** on your browser.

### Using it on a Mobile Phone (Same Wi-Fi):
Open your mobile browser (Safari / Chrome) and navigate to your computer's local IP:
`http://<your-mac-ip>:3333`
Tap **Share ➔ Add to Home Screen** on iPhone or **Add to Home screen** on Android to use it just like a native mobile app!

---

## ☁️ Cloudflare Hosting
See [CLOUDFLARE_DEPLOYMENT.md](file:///Users/sanjiths/Downloads/Kalamade/Apps/fittrack/CLOUDFLARE_DEPLOYMENT.md) for full instructions on deploying to Cloudflare D1 + Workers/Pages or Cloudflare Zero Trust Tunnel.
