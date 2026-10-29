# Deploying FitTrack to Cloudflare

FitTrack is designed to be lightweight, mobile-first, and fully compatible with **Cloudflare**.

---

## 🚀 Option 1: Cloudflare D1 + Workers / Pages (Full Serverless)

Cloudflare D1 is Cloudflare's serverless SQLite database. Because FitTrack is built on SQLite, your database structure matches 1:1 with D1.

### Step 1: Install Wrangler CLI
```bash
npm install -g wrangler
# or use npx wrangler
```

### Step 2: Login to Cloudflare
```bash
npx wrangler login
```

### Step 3: Create your Cloudflare D1 Database
```bash
npx wrangler d1 create fittrack-db
```
Cloudflare will output a database ID, for example:
```
database_id: "xxxx-xxxx-xxxx-xxxx"
```

Copy that ID and paste it into `wrangler.jsonc`:
```json
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "fittrack-db",
    "database_id": "YOUR_ACTUAL_DATABASE_ID"
  }
]
```

### Step 4: Run the Schema Migration on D1
Run the included `schema.sql` to initialize all tables and indexes:
```bash
npx wrangler d1 execute fittrack-db --remote --file=./schema.sql
```
*(Or open the Cloudflare Web Dashboard -> Workers & Pages -> D1 -> fittrack-db -> Console, and paste `schema.sql` contents).*

### Step 5: Deploy with OpenNext for Cloudflare
```bash
npx @opennextjs/cloudflare build
npx wrangler deploy
```

---

## ⚡ Option 2: Cloudflare Tunnel (Zero Configuration, Run Anywhere)

If your brother wants to run this on a Mac, PC, or cheap cloud VPS with instant zero-configuration HTTPS, Cloudflare Tunnel is the easiest option:

1. In Cloudflare Dashboard -> **Zero Trust** -> **Networks** -> **Tunnels** -> **Create Tunnel**
2. Choose **Cloudflared** and run the one-line command on your machine.
3. Route traffic to:
   - Service: `HTTP`
   - URL: `localhost:3333`
4. Connect your custom domain (e.g., `trainer.yourdomain.com`).
5. **Done!** Your brother can now open `https://trainer.yourdomain.com` from his iPhone / Android from anywhere in the world with free Cloudflare SSL and DDoS protection.

---

## ⏰ Daily 6:00 AM Follow-up Reminders

### Via Cloudflare Cron Trigger (Automated)
In `wrangler.jsonc`, the cron trigger is configured:
```json
"triggers": {
  "crons": [
    "30 0 * * *" // 00:30 UTC = 06:00 AM IST
  ]
}
```
Every morning at 6:00 AM IST, Cloudflare calls `/api/reminders/daily`.

### Optional Webhook Alert (Telegram or WhatsApp)
Add this environment variable in Cloudflare:
```
REMINDER_WEBHOOK_URL="https://your-webhook-or-telegram-bot-url"
```
When configured, FitTrack will automatically ping his Telegram / WhatsApp bot every morning at 6:00 AM with his daily follow-up agenda.

### In-Browser & Phone Alerts
Your brother can also just open FitTrack on his phone browser, tap **"Enable Phone/Browser Alerts"** in the top morning banner, and FitTrack will notify him directly on his device!
