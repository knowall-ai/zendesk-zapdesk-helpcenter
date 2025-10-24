# Environment Variables Setup

To enable the "Mark as Paid" functionality, you need to configure Zendesk API credentials in Vercel.

## Required Environment Variables

1. `ZENDESK_SUBDOMAIN` - Your Zendesk subdomain (e.g., "knowall" if your URL is knowall.zendesk.com)
2. `ZENDESK_EMAIL` - Your Zendesk admin email address
3. `ZENDESK_API_TOKEN` - Your Zendesk API token

## How to Get Your Zendesk API Token

1. Log in to your Zendesk account as an admin
2. Go to **Admin Center** (gear icon)
3. Navigate to **Apps and integrations > APIs > Zendesk API**
4. Click the **Settings** tab
5. Enable **Token Access** if not already enabled
6. Click **Add API Token**
7. Give it a description like "Zapdesk Widget"
8. Copy the generated token (you won't be able to see it again!)

## Setting Environment Variables in Vercel

### Option 1: Via Vercel Dashboard (Recommended)

1. Go to https://vercel.com/dashboard
2. Select your project: `zendesk-zapdesk-helpcenter`
3. Go to **Settings** > **Environment Variables**
4. Add each variable:
   - Name: `ZENDESK_SUBDOMAIN`, Value: `your-subdomain`
   - Name: `ZENDESK_EMAIL`, Value: `admin@yourdomain.com`
   - Name: `ZENDESK_API_TOKEN`, Value: `your-token-here`
5. Make sure to select **Production**, **Preview**, and **Development** for each variable
6. Click **Save**

### Option 2: Via Vercel CLI

```bash
vercel env add ZENDESK_SUBDOMAIN
# Enter your subdomain when prompted

vercel env add ZENDESK_EMAIL
# Enter your email when prompted

vercel env add ZENDESK_API_TOKEN
# Enter your API token when prompted
```

## After Setting Environment Variables

You need to redeploy for the changes to take effect:

```bash
npm run build
npx vercel --prod
```

Or trigger a redeploy from the Vercel dashboard.

## Testing

After deployment:
1. Open a ticket in your Zendesk Help Center
2. Click on a tip amount
3. Add a message
4. Click "Mark as Paid"
5. Check the ticket - you should see a public comment with your tip message!

## Troubleshooting

**Error: "Server configuration error"**
- Make sure all three environment variables are set in Vercel
- Redeploy after adding environment variables

**Error: "Failed to post comment to Zendesk"**
- Verify your API token is correct
- Make sure your Zendesk email has admin permissions
- Check that the subdomain matches your Zendesk URL

**Error: "Ticket ID not found"**
- Make sure the widget is loading with the `ticket_id` URL parameter
- Check your Help Center script is passing the ticket ID correctly
