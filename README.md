# Zapdesk Help Center Theme

A self-hosted Zendesk Help Center theme with an embedded React app for Lightning Network payments (tips via LNURL-pay). This solution eliminates the need for external hosting platforms like Azure, Vercel, or S3 by packaging everything directly within Zendesk's Guide theme.

## Features

- **🔌 Fully Self-Hosted**: All assets (HTML, JS, CSS) are hosted within Zendesk Guide
- **⚡ Lightning Network Integration**: Built-in LNURL-pay support for instant Bitcoin tips
- **⚛️ React-Based App**: Modern, responsive embedded application
- **🎨 Customizable Theme**: Easy-to-configure settings via Zendesk Guide admin
- **📱 Mobile-Friendly**: Responsive design works on all devices
- **🚀 Zero External Dependencies**: No CORS issues, no external hosting costs

## Project Structure

```
zendesk-zapdesk-helpcenter/
├── theme/                          # Zendesk Guide theme
│   ├── assets/                     # Static assets
│   ├── templates/                  # Handlebars templates
│   ├── manifest.json               # Theme configuration
│   ├── script.js                   # Bootstrap script
│   └── style.css                   # Theme styles
│
├── zapdesk-app/                    # React app source
│   ├── src/
│   │   ├── components/
│   │   ├── utils/
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
│
├── DEPLOYMENT.md                   # Detailed deployment guide
└── package.json                    # Root package with helper scripts
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- Zendesk Guide account (Professional or Enterprise)
- ZCLI: `npm install -g @zendesk/zcli`

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/knowall-ai/zendesk-zapdesk-helpcenter.git
   cd zendesk-zapdesk-helpcenter
   ```

2. **Install dependencies and build**:
   ```bash
   npm run setup
   ```
   This installs the React app dependencies and builds the bundle.

3. **Preview locally**:
   ```bash
   zcli login -i  # Authenticate with Zendesk first
   npm run preview:theme
   ```

4. **Package for upload**:
   ```bash
   npm run package:theme
   ```
   This creates `knowallai-zapdesk-theme.zip`.

5. **Upload to Zendesk**:
   - Go to Zendesk Admin Center → Guide → Customize design
   - Click "Add theme" → "Import theme"
   - Upload `knowallai-zapdesk-theme.zip`
   - Configure theme settings
   - Publish

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run install:app` | Install React app dependencies |
| `npm run build:app` | Build React app bundle |
| `npm run dev:app` | Run React app in development mode |
| `npm run preview:theme` | Preview theme locally with ZCLI |
| `npm run package:theme` | Create ZIP file for Zendesk upload |
| `npm run build:all` | Build React app (production) |
| `npm run setup` | Install deps and build (first-time setup) |

## Configuration

After uploading the theme, configure these settings in Zendesk Guide Admin:

| Setting | Description | Default |
|---------|-------------|---------|
| **Enable Zapdesk App** | Toggle app on/off | ✓ Enabled |
| **API Base URL** | Base URL for API calls | `https://api.knowall.ai` |
| **App Placement** | Where to show the app | `article_footer` |
| **Brand Color** | Primary brand color | `#F7931A` |
| **LNURL-pay Endpoint** | Lightning payment endpoint | (empty) |

### App Placement Options

- **article_footer**: Appears at the bottom of article pages
- **home_page**: Appears on the Help Center homepage
- **custom_page**: Only on `/hc/{locale}/p/zapdesk-app`

## Development

### Modifying the React App

1. **Edit source files** in `zapdesk-app/src/`
2. **Test in dev mode**:
   ```bash
   npm run dev:app
   ```
3. **Build for production**:
   ```bash
   npm run build:app
   ```
4. **Preview in Zendesk context**:
   ```bash
   npm run preview:theme
   ```

### Modifying Theme Templates

1. **Edit `.hbs` files** in `theme/templates/`
2. **Edit styles** in `theme/style.css`
3. **Preview changes**:
   ```bash
   npm run preview:theme
   ```
   Changes reload automatically.

### Modifying Theme Settings

Edit `theme/manifest.json` to add/modify theme settings exposed in Zendesk Admin.

## How It Works

1. **Theme Bootstrap** (`theme/script.js`):
   - Detects `.zapdesk-app-container` elements
   - Reads configuration from data attributes
   - Dynamically loads React app bundle

2. **React App Bundle** (`theme/assets/zapdesk-app.bundle.js`):
   - Self-contained UMD module
   - Exposes `window.ZapdeskApp.mount()`
   - No external dependencies

3. **Templates** (`.hbs` files):
   - Curlybars templating (Zendesk's Handlebars variant)
   - Conditionally render app container based on settings
   - Pass configuration via data attributes

4. **Payment Flow**:
   - User clicks tip button → App generates LNURL request
   - Modal displays QR code and invoice
   - User pays with Lightning wallet
   - (Optional) Webhook confirms payment

## Customization

### Adding Custom Tip Amounts

Edit `zapdesk-app/src/App.jsx`:

```jsx
<TipButton
  amount={2000}
  label="2,000 sats"
  onClick={() => handleTipClick(2000)}
  disabled={loading}
/>
```

Then rebuild: `npm run build:app`

### Integrating Real LNURL Service

1. Deploy a Lightning node with LNURL support
2. Create API endpoint for payment requests
3. Update `zapdesk-app/src/utils/lnurl.js`:
   ```javascript
   export async function generateLNURL({ apiBase, lnurlEndpoint, amount, articleId }) {
     const response = await fetch(`${apiBase}${lnurlEndpoint}`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify({ amount, articleId })
     })
     return response.json()
   }
   ```
4. Configure endpoint in theme settings

### Styling

**CSS Variables** (in `theme/style.css` and `zapdesk-app/src/styles.css`):

```css
:root {
  --zapdesk-brand-color: #F7931A;
  --zapdesk-text-primary: #1f1f1f;
  --zapdesk-bg-primary: #ffffff;
  /* ... */
}
```

Modify these for consistent branding.

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for comprehensive deployment instructions.

### Quick Deploy

```bash
# 1. Build everything
npm run build:all

# 2. Package theme
npm run package:theme

# 3. Upload knowallai-zapdesk-theme.zip to Zendesk
# Via Admin Center → Guide → Customize design → Add theme → Import
```

## Architecture

### Self-Hosting Strategy

Traditional approach (external hosting):
```
User → Zendesk Guide → External Host (Vercel/Azure) → React App
        ↓ CORS issues, hosting costs, latency
```

Our approach (self-hosted):
```
User → Zendesk Guide → Assets in Zendesk → React App
        ↓ No CORS, no external costs, faster
```

### Benefits

1. **No External Dependencies**: Everything runs within Zendesk's infrastructure
2. **No CORS Issues**: Assets served from same origin
3. **Reduced Costs**: No separate hosting fees
4. **Simplified Deployment**: Single ZIP upload
5. **Better Performance**: Assets served from Zendesk's CDN
6. **Easier Maintenance**: One place to manage everything

## Troubleshooting

### App Doesn't Appear

- Check "Enable Zapdesk App" is checked in theme settings
- Verify placement setting matches the page you're viewing
- Check browser console for errors
- Ensure assets uploaded correctly (Admin → Guide → Assets)

### Build Errors

```bash
# Clean and rebuild
cd zapdesk-app
rm -rf node_modules dist
npm install
npm run build
```

### Preview Not Working

```bash
# Re-authenticate
zcli logout
zcli login -i

# Try preview again
npm run preview:theme
```

## Resources

- [Deployment Guide](./DEPLOYMENT.md) - Complete deployment instructions
- [Zendesk Guide Themes Docs](https://developer.zendesk.com/documentation/help_center/themes/)
- [ZCLI Documentation](https://developer.zendesk.com/documentation/apps/app-developer-guide/zcli/)
- [Lightning Network](https://lightning.network/)
- [LNURL Specification](https://github.com/lnurl/luds)

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

- **Issues**: [GitHub Issues](https://github.com/knowall-ai/zendesk-zapdesk-helpcenter/issues)
- **Discussions**: [GitHub Discussions](https://github.com/knowall-ai/zendesk-zapdesk-helpcenter/discussions)
- **Email**: support@knowall.ai

---

Built with ⚡ by [KnowAll AI](https://knowall.ai)
