# Paymob Setup Integration Plan

## Objective
Update the `bun run setup` script to prompt for Paymob credentials and add them to the backend `.env` file during project setup.

---

## Current State
- Setup script exists in `scripts/setup/`
- It generates `backend/.env` from `backend/.env.example`
- Paymob section exists in `.env.example` with empty values
- Script currently asks for: DB connection, JWT secret, Google OAuth, CORS origins

---

## Proposed Changes

### 1. Update `.env.example` Template
**File:** `backend/.env.example`

**Action:** Ensure Paymob section has clear comments:
```env
# ============================================
# Paymob Payment Gateway (Sandbox)
# Sign up at: https://accept.paymob.com/portal2/en/register
# Dashboard: https://accept.paymob.com/portal2/en/login
# Get credentials from: Settings → Account Info & Payment Integrations
# ============================================
Paymob__ApiKey=
Paymob__IntegrationId=
Paymob__IframeId=
Paymob__HmacSecret=
Paymob__BaseUrl=https://accept.paymob.com
```

### 2. Identify Setup Script Entry Point
**Files to check:**
- `scripts/setup/index.ts` or `scripts/setup/main.ts` (main entry)
- Look for backend env generation logic
- Find where it prompts for config values

### 3. Add Paymob Prompts
**Location:** In the backend `.env` generation section

**Prompts to add:**
1. **Ask if user wants to configure Paymob:**
   - "Do you want to configure Paymob payment gateway? (y/n)"
   - If "n" → skip, leave empty values
   - If "y" → continue prompts

2. **Paymob API Key:**
   - Prompt: "Enter Paymob API Key (from Settings → Account Info):"
   - Required if configuring Paymob
   - Show help: "Get it from: https://accept.paymob.com/portal2/en/settings"

3. **Integration ID:**
   - Prompt: "Enter Paymob Integration ID (from Payment Integrations):"
   - Type: number
   - Validate: must be a positive integer

4. **iFrame ID:**
   - Prompt: "Enter Paymob iFrame ID:"
   - Type: number
   - Validate: must be a positive integer

5. **HMAC Secret:**
   - Prompt: "Enter Paymob HMAC Secret (from Security Settings):"
   - Required if configuring Paymob

6. **Base URL (optional):**
   - Don't prompt, use default: `https://accept.paymob.com`
   - Can be overridden manually later for production

### 4. Update Backend `.env` Writer
**Action:** Write Paymob values to `backend/.env`

**Logic:**
```typescript
// If user chose to configure Paymob
if (configurePaymob) {
  envContent += `\nPaymob__ApiKey=${paymobApiKey}`;
  envContent += `\nPaymob__IntegrationId=${paymobIntegrationId}`;
  envContent += `\nPaymob__IframeId=${paymobIframeId}`;
  envContent += `\nPaymob__HmacSecret=${paymobHmacSecret}`;
  envContent += `\nPaymob__BaseUrl=https://accept.paymob.com`;
} else {
  // Leave empty for manual configuration later
  envContent += `\nPaymob__ApiKey=`;
  envContent += `\nPaymob__IntegrationId=`;
  envContent += `\nPaymob__IframeId=`;
  envContent += `\nPaymob__HmacSecret=`;
  envContent += `\nPaymob__BaseUrl=https://accept.paymob.com`;
}
```

### 5. Add Validation
**Validation rules:**
- API Key: non-empty string if configuring
- Integration ID: positive integer
- iFrame ID: positive integer
- HMAC Secret: non-empty string if configuring

**Error handling:**
- Show clear error messages
- Allow retry on invalid input
- Provide examples if validation fails

### 6. Update Setup Summary
**Action:** Add Paymob status to the final setup summary

**Example output:**
```
✅ Backend configured
✅ Database connection set
✅ JWT configured
✅ Google OAuth configured (optional)
✅ Paymob payment gateway configured
   ⚠️  Remember to configure callback URLs in Paymob dashboard:
   - Transaction Processed: https://YOUR_NGROK_URL/api/payments/callback
   - Transaction Response: https://YOUR_NGROK_URL/api/payments/webhook
```

### 7. Add Help Documentation
**Action:** Show helpful info after setup completes

**Info to display if Paymob configured:**
```
📌 Paymob Setup Next Steps:
1. Start ngrok: npx ngrok http 5000
2. Copy your ngrok HTTPS URL (e.g., https://abc123.ngrok.io)
3. Go to Paymob Dashboard → Settings → Payment Integrations
4. Set callback URLs:
   - Transaction Processed: https://YOUR_NGROK_URL/api/payments/callback
   - Transaction Response: https://YOUR_NGROK_URL/api/payments/webhook
5. Test with sandbox card: 4987654321098769
```

---

## Implementation Steps

### Step 1: Locate Setup Script Structure
- [ ] Read `scripts/setup/` directory
- [ ] Find main entry point (index.ts or similar)
- [ ] Identify where backend env prompts happen
- [ ] Understand existing prompt/validation patterns

### Step 2: Add Paymob Prompt Logic
- [ ] Add "Configure Paymob?" yes/no prompt
- [ ] Add conditional prompts for 4 credentials
- [ ] Add validation for Integration ID and iFrame ID (must be numbers)
- [ ] Ensure all prompts follow existing style/pattern

### Step 3: Update .env Writer
- [ ] Find where `backend/.env` is written
- [ ] Add Paymob section writing logic
- [ ] Handle both configured and skipped scenarios
- [ ] Maintain proper formatting and comments

### Step 4: Update Summary Output
- [ ] Add Paymob status to completion summary
- [ ] Show callback URL instructions if configured
- [ ] Add ngrok setup reminder

### Step 5: Test
- [ ] Run `bun run setup` with Paymob configuration
- [ ] Run `bun run setup` skipping Paymob
- [ ] Verify `.env` file has correct values
- [ ] Test with actual Paymob credentials

---

## Files to Modify

1. **`backend/.env.example`**
   - Add/update Paymob comments
   - Ensure clear instructions

2. **`scripts/setup/index.ts`** (or main entry)
   - Add Paymob prompts
   - Add validation logic
   - Update env writer

3. **`scripts/setup/README.md`** (if exists)
   - Document Paymob setup
   - Add callback URL instructions

---

## Success Criteria

✅ Setup script asks "Configure Paymob?" during backend setup  
✅ If yes, prompts for 4 credentials with validation  
✅ If no, leaves empty values in `.env`  
✅ Generated `.env` has correct Paymob section  
✅ Summary shows Paymob status and next steps  
✅ Instructions mention ngrok and callback URLs  
✅ Validation prevents invalid input (non-numeric IDs)  
✅ User can skip and configure manually later  

---

## Optional Enhancements

- **Pre-fill detection:** Check if `.env` already has Paymob values, skip prompts
- **Quick mode:** `bun run setup:quick` skips Paymob (leaves empty)
- **Validation link:** Show Paymob dashboard link for each credential
- **Copy helper:** Offer to copy callback URLs to clipboard
- **Test mode:** Add `Paymob__ApiKey=test_mode` for local dev without credentials

---

## Notes

- Keep prompts optional - not everyone needs Paymob immediately
- Provide clear signup link for new users
- Don't validate credentials against Paymob API (too slow during setup)
- User can always manually edit `.env` later
- ngrok URL changes on restart, so callback URLs need manual update in dashboard
