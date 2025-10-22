// Vercel Serverless Function to post comments to Zendesk

/**
 * Sanitize user input to prevent injection attacks
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (!input || typeof input !== 'string') return ''

  // Remove any HTML/script tags
  let sanitized = input.replace(/<[^>]*>/g, '')

  // Escape special characters that could be used for injection
  sanitized = sanitized
    .replace(/[<>]/g, '') // Remove any remaining angle brackets
    .trim()

  // Limit length to prevent abuse
  const MAX_LENGTH = 1000
  if (sanitized.length > MAX_LENGTH) {
    sanitized = sanitized.substring(0, MAX_LENGTH)
  }

  return sanitized
}

export default async function handler(req, res) {
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

    // Validate ticketId (should be numeric)
    const sanitizedTicketId = String(ticketId).replace(/[^0-9]/g, '')
    if (!sanitizedTicketId) {
      return res.status(400).json({ error: 'Invalid ticket ID' })
    }

    // Validate and sanitize sats to prevent injection
    const sanitizedSats = parseInt(sats, 10)
    if (isNaN(sanitizedSats) || sanitizedSats < 0 || sanitizedSats > 100000000) {
      return res.status(400).json({ error: 'Invalid sats amount' })
    }

    // Sanitize user inputs to prevent injection attacks
    const sanitizedMessage = sanitizeInput(message)
    const sanitizedAgentName = sanitizeInput(agentName)

    // Get Zendesk credentials from environment variables
    const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN
    const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL
    const ZENDESK_API_TOKEN = process.env.ZENDESK_API_TOKEN

    if (!ZENDESK_SUBDOMAIN || !ZENDESK_EMAIL || !ZENDESK_API_TOKEN) {
      console.error('Missing Zendesk environment variables')
      return res.status(500).json({ error: 'Server configuration error' })
    }

    // Build the comment text with sanitized inputs
    const commentText = `⚡ Lightning Tip Sent: ${sanitizedSats.toLocaleString()} sats${sanitizedMessage ? `\n\nMessage: ${sanitizedMessage}` : ''}${sanitizedAgentName ? `\nTo: ${sanitizedAgentName}` : ''}\n\nTip sent via Zapdesk by KnowAll AI`

    // Make API request to Zendesk with sanitized ticket ID
    const zendeskUrl = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/requests/${sanitizedTicketId}/comments.json`

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
