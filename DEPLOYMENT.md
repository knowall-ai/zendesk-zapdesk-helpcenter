# Zapdesk Help Center Theme - Deployment Guide

This guide explains how to build, package, and deploy the KnowAll AI Zapdesk Help Center theme to Zendesk Guide.

## Overview

The Zapdesk theme is a custom Zendesk Help Center theme that embeds a React-based Lightning Network payment app directly within your Help Center. All assets are self-hosted within Zendesk, eliminating the need for external hosting platforms (Azure, Vercel, etc.).

## Prerequisites

- Node.js 18+ and npm
- Zendesk Guide account (Professional or Enterprise plan for custom themes)
- ZCLI (Zendesk CLI) - Install with: `npm install -g @zendesk/zcli`
- Basic understanding of Zendesk Guide themes

## Project Structure

```
zendesk-zapdesk-helpcenter/
├── theme/                          # Zendesk theme files
│   ├── assets/                     # Static assets (images, compiled JS/CSS)
│   │   ├── zapdesk-app.bundle.js  # React app bundle (generated)
│   │   └── zapdesk-app.css        # React app styles (generated)
│   ├── templates/                  # Handlebars templates
│   │   ├── home_page.hbs          # Home page template
│   │   ├── article_page.hbs       # Article page template
│   │   ├── section_page.hbs       # Section page template
│   │   ├── category_page.hbs      # Category page template
│   │   └── custom_pages/
│   │       └── zapdesk-app.hbs    # Dedicated Zapdesk app page
│   ├── manifest.json               # Theme metadata and settings
│   ├── script.js                   # Theme bootstrap script
│   └── style.css                   # Theme base styles
│
└── zapdesk-app/                    # React app source
    ├── src/
    │   ├── components/             # React components
    │   ├── utils/                  # Utility functions
    │   ├── App.jsx                 # Main app component
    │   ├── main.jsx                # Entry point
    │   └── styles.css              # App styles
    ├── package.json
    └── vite.config.js              # Build configuration
```

## Step 1: Install Dependencies

### Install React App Dependencies

```bash
cd zapdesk-app
npm install
```

This installs:
- React 18.2.0
- React DOM 18.2.0
- Vite (build tool)
- React plugin for Vite

## Step 2: Build the React App

The React app must be built into a single bundle that can be uploaded to Zendesk's asset manager.

```bash
cd zapdesk-app
npm run build
```

This command:
1. Bundles the React app using Vite
2. Outputs `zapdesk-app.bundle.js` and `zapdesk-app.css`
3. Places the files in `theme/assets/` directory
4. Creates a UMD module that exposes `window.ZapdeskApp`

### Build Configuration

The build is configured in `vite.config.js`:
- **Format**: UMD (Universal Module Definition)
- **Global name**: `ZapdeskApp`
- **Output directory**: `../theme/assets`
- **No external dependencies**: Everything is bundled

### Verify Build Output

After building, verify these files exist:
```bash
ls -l theme/assets/
# Should show:
# zapdesk-app.bundle.js
# zapdesk-app.css
```

## Step 3: Configure ZCLI

### Authenticate with Zendesk

```bash
zcli login -i
```

Follow the prompts:
1. Enter your Zendesk subdomain (e.g., `knowallai`)
2. Provide your email and API token
3. ZCLI saves credentials for future use

### Create API Token

If you don't have an API token:
1. Go to Zendesk Admin Center
2. Navigate to Apps and integrations → APIs → Zendesk API
3. Click "Add API token"
4. Copy the token (save it securely)

## Step 4: Local Preview

Preview the theme locally before deploying:

```bash
cd theme
zcli themes:preview
```

This command:
1. Starts a local server
2. Proxies your Zendesk Help Center
3. Applies your theme on top of live content
4. Auto-reloads when you edit files

**Preview URL**: The command outputs a URL like `http://localhost:3000`

### Live Reloading

While `zcli themes:preview` is running:
- Edit any `.hbs`, `.css`, or `.js` files
- Changes appear immediately in the browser
- No need to restart the preview

**Note**: If you modify the React app, you must rebuild it (`npm run build` in `zapdesk-app/`) for changes to appear.

## Step 5: Package the Theme

Create a ZIP file for upload to Zendesk:

```bash
cd theme
zip -r knowallai-zapdesk-theme.zip . -x "*.DS_Store" -x "__MACOSX/*"
```

The ZIP should include:
- `manifest.json`
- `script.js`
- `style.css`
- `templates/` (all `.hbs` files)
- `assets/` (including `zapdesk-app.bundle.js` and `zapdesk-app.css`)

### Verify ZIP Contents

```bash
unzip -l knowallai-zapdesk-theme.zip
```

Ensure all necessary files are included.

## Step 6: Upload to Zendesk

### Option A: Via Guide Admin UI (Recommended for First Deploy)

1. **Navigate to Theme Settings**:
   - Zendesk Admin Center → Guide → Customize design

2. **Import Theme**:
   - Click "Add theme"
   - Select "Import theme"
   - Upload `knowallai-zapdesk-theme.zip`

3. **Configure Theme Settings**:
   - After import, click "Customize" on the theme
   - Find "Theme settings" panel
   - Configure:
     - **Enable Zapdesk App**: ✓ (checked)
     - **API Base URL**: `https://api.knowall.ai`
     - **App Placement**: Choose `article_footer`, `home_page`, or `custom_page`
     - **Brand Color**: `#F7931A` (or your brand color)
     - **LNURL-pay Endpoint**: Your LNURL service endpoint

4. **Publish Theme**:
   - Click "Publish" to make it live
   - Or click "Preview" to test first

### Option B: Via ZCLI (For Updates)

```bash
cd theme
zcli themes:update <THEME_ID>
```

To find your theme ID:
```bash
zcli themes:list
```

## Step 7: Test the Integration

### Test on Article Pages

1. Navigate to any Help Center article
2. Scroll to the bottom (if placement is `article_footer`)
3. Verify the Zapdesk app appears with:
   - Lightning icon
   - "Support with Lightning" header
   - Tip buttons (100, 500, 1000 sats, Custom)

### Test Payment Flow

1. Click a tip button (e.g., "500 sats")
2. Modal should open showing:
   - QR code
   - Lightning invoice
   - Copy button
   - Payment instructions
3. Test the "Copy Invoice" button
4. Close modal and verify it dismisses properly

### Test on Home Page

If placement is `home_page`:
1. Go to Help Center home
2. Verify app appears below the search box

### Test Custom Page

1. Navigate to `/hc/en-us/p/zapdesk-app`
2. Verify dedicated Zapdesk page loads
3. Test full app functionality

## Step 8: Production Checklist

Before going live:

- [ ] **Build React app** with production optimizations
- [ ] **Test all templates**: home, article, section, category, custom page
- [ ] **Configure LNURL endpoint** in theme settings
- [ ] **Test payment flow** end-to-end with real Lightning wallet
- [ ] **Verify mobile responsiveness** on various devices
- [ ] **Check browser compatibility** (Chrome, Firefox, Safari, Edge)
- [ ] **Test with different Help Center content** (articles with/without images, long articles, etc.)
- [ ] **Enable error monitoring** for the React app (Sentry, etc.)
- [ ] **Set up analytics** to track tip usage
- [ ] **Document support process** for users having issues

## Customization

### Changing App Placement

Edit theme settings in Zendesk Guide Admin:
- `article_footer`: After article content
- `home_page`: On the Help Center homepage
- `custom_page`: Only on `/hc/{locale}/p/zapdesk-app`

### Styling Customization

**Theme Styles** (`theme/style.css`):
- Modify CSS variables in `:root` selector
- Adjust layout, colors, typography

**App Styles** (`zapdesk-app/src/styles.css`):
- Edit React app styles
- Rebuild after changes: `npm run build`

### Adding New Tip Amounts

Edit `zapdesk-app/src/App.jsx`:

```jsx
<TipButton
  amount={2000}
  label="2,000 sats"
  onClick={() => handleTipClick(2000)}
  disabled={loading}
/>
```

Rebuild and redeploy.

### Integrating Real LNURL Service

Edit `zapdesk-app/src/utils/lnurl.js`:

1. Replace `generateMockLNURL()` with real API calls
2. Update `apiBase` and `lnurlEndpoint` in theme settings
3. Implement proper error handling
4. Add payment status polling if needed

## Troubleshooting

### App Doesn't Appear

**Check Theme Settings**:
- Ensure "Enable Zapdesk App" is checked
- Verify app placement setting matches the page you're viewing

**Check Browser Console**:
```javascript
// Should see:
// "Zapdesk: Initializing app with config"
// "Zapdesk: Mounting app"
```

**Verify Assets**:
- Assets uploaded: Admin Center → Guide → Customize design → Assets
- `zapdesk-app.bundle.js` and `zapdesk-app.css` should be listed

### Modal Doesn't Open

**Check JavaScript errors** in browser console:
- Look for React errors or bundle loading failures

**Verify Bundle Format**:
- Ensure build created UMD module
- Check `window.ZapdeskApp` exists after bundle loads

### Styling Issues

**Check CSS Asset**:
- Verify `zapdesk-app.css` is loaded
- Check Network tab in DevTools

**CSS Conflicts**:
- Zendesk themes may have conflicting styles
- Use more specific selectors or `!important` if needed

### Build Errors

**Node Version**:
```bash
node --version  # Should be 18+
```

**Clean Build**:
```bash
cd zapdesk-app
rm -rf node_modules dist
npm install
npm run build
```

## Updating the Theme

### Process

1. **Make changes** to templates, styles, or React app
2. **Rebuild React app** if modified: `cd zapdesk-app && npm run build`
3. **Test locally**: `zcli themes:preview`
4. **Update version** in `manifest.json`
5. **Package theme**: `zip -r theme.zip .`
6. **Upload**: Via Admin UI or `zcli themes:update`

### Version Control

Increment version in `manifest.json`:
```json
{
  "version": "1.0.1"
}
```

Zendesk tracks theme versions, allowing rollback if needed.

## API Integration

### Real LNURL Implementation

To integrate a real Lightning Network LNURL service:

1. **Set up Lightning node** (LND, c-lightning, Eclair)
2. **Deploy LNURL service** (e.g., lnbits, lndhub, custom)
3. **Create API endpoint** for payment requests:
   ```
   POST /api/lnurl/pay
   {
     "amount": 1000,
     "articleId": "12345",
     "metadata": {...}
   }
   ```
4. **Update theme settings** with endpoint URL
5. **Modify `lnurl.js`** to call real endpoint
6. **Implement webhooks** for payment confirmations
7. **Add payment status polling**

### Security Considerations

- Use HTTPS for all API calls
- Validate payment requests server-side
- Implement rate limiting
- Don't expose Lightning node directly
- Use API keys for authentication
- Log all payment attempts

## Resources

- [Zendesk Guide Themes Documentation](https://developer.zendesk.com/documentation/help_center/themes/building-themes/)
- [ZCLI Documentation](https://developer.zendesk.com/documentation/apps/app-developer-guide/zcli/)
- [Help Center Templates API](https://developer.zendesk.com/api-reference/help_center/help-center-templates/introduction/)
- [Lightning Network Documentation](https://lightning.network/)
- [LNURL Specification](https://github.com/lnurl/luds)

## Support

For issues or questions:
- Check browser console for errors
- Review Zendesk theme logs
- Consult ZCLI documentation
- Contact KnowAll AI support

---

**Next Steps**: After successful deployment, monitor usage, gather user feedback, and iterate on the design and functionality.
