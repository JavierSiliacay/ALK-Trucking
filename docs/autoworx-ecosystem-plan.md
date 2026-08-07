# ALK Trucking & Autoworx Ecosystem Integration Plan

**Context:** Sir Alfred owns both ALK Trucking and Autoworx (Repair Shop). This integration aims to bridge the two systems so that any repair work done at Autoworx on an ALK Truck automatically flows into the ALK Trucking system as a recorded maintenance expense, eliminating double-data entry.

## 1. The Operational Flow

1. **The Trigger:** A mechanic at Autoworx creates a repair estimate/Job Order.
2. **The Handshake:** Autoworx recognizes the Plate Number belongs to ALK Trucking. It fires a background Webhook (POST request) to the ALK server with the estimate details.
3. **The ALK Dashboard:** The ALK Maintenance Module receives this data and displays it as a "Pending Estimate".
4. **Approval & Completion:** 
   - Management can click "Approve" from ALK, sending a webhook back to Autoworx.
   - Once the repair is marked "Paid/Completed" in Autoworx, it sends a final Webhook to ALK.
5. **Automated Accounting:** ALK automatically takes that final cost and logs it as an official Maintenance Expense. The Dashboard's Total Expenses and Net Profit automatically update.

## 2. Technical Architecture

- **Matching Key:** The truck's `plateNo` is the primary foreign key bridging both databases.
- **API Endpoints:** 
  - ALK will expose `/api/webhooks/autoworx` to listen for incoming Job Orders.
  - Autoworx will expose `/api/webhooks/alk` to listen for approvals.
- **Security:** Both endpoints must be secured using a shared Secret API Key (Bearer token) to prevent unauthorized requests.
- **CORS:** Ensure `alk-trucking.vercel.app` only accepts cross-origin requests from `autoworxcagayan.com`.


## Next Steps

When ready to implement, begin by updating the `drizzle/schema.ts` in ALK Trucking to include an `autoworxJobId` column in the `expenses` or `maintenance` table to track which expenses originated from the Autoworx sync.
