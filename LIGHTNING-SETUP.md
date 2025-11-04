# Lightning Network Payment Setup Guide

This guide explains how to configure Lightning Network payments for your KnowAll AI Help Center, allowing customers to tip support agents directly.

## Overview

The Zapdesk Lightning payment integration supports:
- **Agent-specific payments**: Customers can tip the specific agent who helped them
- **Real Lightning payments**: Using LNURL-pay protocol with Lightning addresses
- **QR code generation**: Automatic QR codes for easy mobile wallet payments
- **Invoice creation**: Generates valid Lightning Network invoices

## How It Works

1. Customer submits a support request
2. Agent is assigned to the ticket and resolves the issue
3. Customer views the request and sees the Zapdesk tipping widget in the sidebar
4. Customer clicks a tip amount (100, 500, 1000 sats, or custom)
5. System generates Lightning invoice using the agent's Lightning address
6. Customer scans QR code or copies invoice to their Lightning wallet
7. Payment goes directly to the agent's Lightning wallet

## Prerequisites

### For Agents
Each support agent who wants to receive tips needs:
1. **Lightning wallet** (Phoenix, Wallet of Satoshi, Breez, etc.)
2. **Lightning address** (format: `username@domain.com`)

### Recommended Lightning Wallet Providers
- **Phoenix** (https://phoenix.acinq.co/) - Self-custodial, easy to use
- **Wallet of Satoshi** (https://walletofsatoshi.com/) - Custodial, instant setup
- **Breez** (https://breez.technology/) - Self-custodial, feature-rich
- **Alby** (https://getalby.com/) - Browser extension, Lightning address included

## Step 1: Get Lightning Addresses for Agents

### Option A: Using Alby (Recommended)
1. Visit https://getalby.com
2. Create account
3. You'll get a Lightning address like `yourname@getalby.com`
4. Configure payout to your own Lightning wallet

### Option B: Using Wallet of Satoshi
1. Download Wallet of Satoshi app
2. Go to Settings → Lightning Address
3. Set your preferred address: `yourname@walletofsatoshi.com`

### Option C: Self-Hosted with LNbits
1. Deploy LNbits instance
2. Enable LNURL-pay plugin
3. Create Lightning addresses for each agent
4. Format: `agent@yourdomain.com`

## Step 2: Configure Agent Lightning Addresses in Zendesk

Unfortunately, Zendesk doesn't have a built-in field for Lightning addresses, so you have two options:

### Option A: Use Custom User Fields
1. Go to Zendesk Admin → People → Configuration → User Fields
2. Create a new text field: **Lightning Address**
3. Set field key: `lightning_address`
4. Add the field to agent profiles
5. Each agent updates their profile with their Lightning address

### Option B: Manual Template Configuration
If custom fields aren't available, you can hardcode addresses in the template:

Edit `theme-copenhagen/templates/request_page.hbs` and replace:

```handlebars
data-agent-lightning-address="{{assignee.lightning_address}}"
```

With a lookup map:

```handlebars
data-agent-lightning-address="{{#is assignee.email 'agent1@yourcompany.com'}}agent1@getalby.com{{/is}}{{#is assignee.email 'agent2@yourcompany.com'}}agent2@getalby.com{{/is}}"
```

## Step 3: Test the Integration

### 1. Create a Test Ticket
- Submit a support request
- Assign it to an agent who has a configured Lightning address

### 2. View the Ticket
- Open the request page
- Look for "Tip Your Agent" section in the sidebar
- You should see the agent's name

### 3. Generate Invoice
- Click a tip amount (e.g., 500 sats)
- System will:
  1. Fetch LNURL metadata from the Lightning address
  2. Generate a real Lightning invoice
  3. Display QR code and invoice string

### 4. Make Test Payment
- Scan QR code with your Lightning wallet
- Or copy the invoice string
- Confirm the payment in your wallet

## Lightning Address Format

Lightning addresses follow email format: `username@domain.com`

**Examples:**
- `alice@getalby.com`
- `bob@walletofsatoshi.com`
- `support@knowall.ai`

## LNURL-pay Protocol Flow

When a customer tips, the system:

1. **Parses Lightning address**: `agent@domain.com` → `https://domain.com/.well-known/lnurlp/agent`
2. **Fetches LNURL metadata**: Min/max amounts, callback URL, comment support
3. **Validates amount**: Ensures tip is within allowed range
4. **Requests invoice**: Calls callback URL with amount in millisats
5. **Displays QR code**: Generates QR code from invoice
6. **Shows recipient**: Displays agent's Lightning address for verification

## Mock vs Real Payments

### Mock Payments (Development)
If agent doesn't have a Lightning address configured:
- System shows mock invoice
- Warning message displayed
- No real payment possible

### Real Payments (Production)
If agent has valid Lightning address:
- Real invoice generated from their Lightning wallet
- Payment goes directly to agent
- Tracked by request ID in payment description

## API Integration (Optional)

For advanced features, you can implement your own LNURL service:

1. Set `zapdesk_lnurl_endpoint` in theme settings
2. Implement API endpoint that:
   - Receives: amount, requestId, agentEmail
   - Returns: { amount, paymentRequest, paymentHash, description }

**Example API Response:**
```json
{
  "amount": 500,
  "paymentRequest": "lnbc500n1p...",
  "paymentHash": "abc123...",
  "description": "Tip for agent: 500 sats",
  "recipient": "agent@knowall.ai",
  "status": "pending"
}
```

## Troubleshooting

### "Agent Lightning address not configured"
- Agent hasn't set their Lightning address in Zendesk profile
- Check custom field is populated
- Verify field key is exactly `lightning_address`

### "Failed to fetch LNURL metadata"
- Lightning address may be invalid
- Check format: `username@domain.com`
- Verify the Lightning service is online
- Test address manually: `https://domain.com/.well-known/lnurlp/username`

### QR Code Not Displaying
- Check browser console for errors
- Verify invoice string is valid
- Try different QR API if needed

### "Amount must be between X and Y sats"
- Lightning address has min/max limits
- Try different amount
- Most addresses support 1-1,000,000 sats

## Security Considerations

1. **Verify recipients**: Always show Lightning address to customer
2. **Amount limits**: Enforce reasonable min/max amounts
3. **Rate limiting**: Prevent spam invoice generation
4. **No private keys**: System never handles private keys
5. **Direct payments**: Funds go directly to agent's wallet

## Best Practices

1. **Agent training**: Educate agents on Lightning wallets
2. **Test first**: Use small amounts for testing
3. **Clear communication**: Explain tipping to customers
4. **Optional tipping**: Never require tips
5. **Privacy**: Don't share Lightning addresses publicly

## Example Agent Profile Setup

```
Name: Alice Johnson
Email: alice@knowall.ai
Lightning Address: alice@getalby.com
```

When customer tips Alice 500 sats:
1. System fetches: `https://getalby.com/.well-known/lnurlp/alice`
2. Generates invoice for 500,000 millisats
3. Adds comment: "Tip for support request #12345"
4. Displays QR code
5. Alice receives 500 sats in her Alby wallet

## Support

For issues or questions:
- Check browser console for errors
- Verify Lightning address format
- Test with small amounts first
- Contact KnowAll AI support

## Resources

- LNURL Specification: https://github.com/lnurl/luds
- Lightning Address: https://lightningaddress.com/
- Phoenix Wallet: https://phoenix.acinq.co/
- Alby: https://getalby.com/
- LNbits: https://lnbits.com/

---

**Built with ⚡ by KnowAll AI**
