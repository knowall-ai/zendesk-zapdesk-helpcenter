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
  // CORS Configuration - Restrict to allowed origins only
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [
        'https://knowallai.zendesk.com',
        'https://zendesk-zapdesk-helpcenter.vercel.app',
        'https://zendesk-zapdesk-helpcenter-git-main-akashjadhav1989-gmailcoms-projects.vercel.app'
      ];

  const origin = req.headers.origin;

  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // For same-origin requests or when origin header is not present
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }

  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // Reject requests from unauthorized origins
  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Origin not allowed'
    });
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

    console.log('[API] Environment check:', {
      hasSubdomain: !!ZENDESK_SUBDOMAIN,
      hasEmail: !!ZENDESK_EMAIL,
      hasToken: !!ZENDESK_API_TOKEN,
      subdomain: ZENDESK_SUBDOMAIN ? ZENDESK_SUBDOMAIN.substring(0, 3) + '***' : 'missing'
    })

    if (!ZENDESK_SUBDOMAIN || !ZENDESK_EMAIL || !ZENDESK_API_TOKEN) {
      console.error('Missing Zendesk environment variables:', {
        subdomain: !!ZENDESK_SUBDOMAIN,
        email: !!ZENDESK_EMAIL,
        token: !!ZENDESK_API_TOKEN
      })
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Missing Zendesk credentials'
      })
    }

    // Build the comment text with sanitized inputs
    const commentText = `⚡ Lightning Tip Sent: ${sanitizedSats.toLocaleString()} sats${sanitizedMessage ? `\n\nMessage: ${sanitizedMessage}` : ''}${sanitizedAgentName ? `\nTo: ${sanitizedAgentName}` : ''}\n\nTip sent via Zapdesk by KnowAll AI`

    // Make API request to Zendesk with sanitized ticket ID
    // Use tickets endpoint (not requests) for agent authentication
    const zendeskUrl = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets/${sanitizedTicketId}.json`

    const authString = Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_API_TOKEN}`).toString('base64')

    console.log('[API] Attempting to post to Zendesk:', {
      url: zendeskUrl,
      ticketId: sanitizedTicketId,
      subdomain: ZENDESK_SUBDOMAIN
    })

    let response
    try {
      response = await fetch(zendeskUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`
        },
        body: JSON.stringify({
          ticket: {
            comment: {
              body: commentText,
              public: true // Make it public so customer can see it
            }
          }
        })
      })
    } catch (fetchError) {
      console.error('[API] Fetch error:', fetchError)
      return res.status(500).json({
        error: 'Failed to connect to Zendesk API',
        message: fetchError.message,
        details: 'Network error or DNS resolution failure'
      })
    }

    if (!response.ok) {
      const errorText = await response.text()
      console.error('[API] Zendesk API error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      return res.status(response.status).json({
        error: 'Failed to post comment to Zendesk',
        status: response.status,
        details: errorText
      })
    }

    let data
    try {
      const responseText = await response.text()
      console.log('[API] Zendesk raw response:', responseText)
      data = JSON.parse(responseText)
      console.log('[API] Success! Zendesk parsed data:', data)
    } catch (parseError) {
      console.error('[API] Failed to parse Zendesk response:', parseError)
      return res.status(500).json({
        error: 'Invalid response from Zendesk',
        message: parseError.message
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Comment posted successfully',
      ticket: data.ticket
    })

  } catch (error) {
    console.error('Error posting comment:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
