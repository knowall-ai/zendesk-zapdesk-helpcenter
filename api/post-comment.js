// Vercel Serverless Function to post comments to Zendesk
module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { ticketId, message, sats, agentName } = req.body

    // Validate input
    if (!ticketId || !sats) {
      return res.status(400).json({ error: 'Missing required fields: ticketId, sats' })
    }

    // Get Zendesk credentials from environment variables
    const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN
    const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL
    const ZENDESK_API_TOKEN = process.env.ZENDESK_API_TOKEN

    if (!ZENDESK_SUBDOMAIN || !ZENDESK_EMAIL || !ZENDESK_API_TOKEN) {
      console.error('Missing Zendesk environment variables')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Build the comment text
    const commentText = `⚡ Lightning Tip Sent: ${Number(sats).toLocaleString()} sats${message ? `\n\nMessage: ${message}` : ''}${agentName ? `\nTo: ${agentName}` : ''}\n\nTip sent via Zapdesk by KnowAll AI`

    // Make API request to Zendesk
    const zendeskUrl = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/requests/${ticketId}/comments.json`

    const authString = Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_API_TOKEN}`).toString('base64')

    const response = await fetch(zendeskUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${authString}`
      },
      body: JSON.stringify({
        request: {
          comment: {
            body: commentText,
            public: true // Make it public so customer can see it
          }
        }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Zendesk API error:', errorText)
      return res.status(response.status).json({
        error: 'Failed to post comment to Zendesk',
        details: errorText
      })
    }

    const data = await response.json()
    return res.status(200).json({
      success: true,
      message: 'Comment posted successfully',
      comment: data.comment
    })

  } catch (error) {
    console.error('Error posting comment:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
