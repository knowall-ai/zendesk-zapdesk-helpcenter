// Vercel Serverless Function to fetch agent Lightning address from Zendesk

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

  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
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

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { ticketId } = req.query

    // Validate input
    if (!ticketId) {
      return res.status(400).json({ error: 'Missing required parameter: ticketId' })
    }

    // Validate ticketId (should be numeric)
    const sanitizedTicketId = String(ticketId).replace(/[^0-9]/g, '')
    if (!sanitizedTicketId) {
      return res.status(400).json({ error: 'Invalid ticket ID' })
    }

    // Get Zendesk credentials from environment variables
    const ZENDESK_SUBDOMAIN = process.env.ZENDESK_SUBDOMAIN
    const ZENDESK_EMAIL = process.env.ZENDESK_EMAIL
    const ZENDESK_API_TOKEN = process.env.ZENDESK_API_TOKEN

    if (!ZENDESK_SUBDOMAIN || !ZENDESK_EMAIL || !ZENDESK_API_TOKEN) {
      console.error('Missing Zendesk environment variables')
      return res.status(500).json({
        error: 'Server configuration error',
        details: 'Missing Zendesk credentials'
      })
    }

    const authString = Buffer.from(`${ZENDESK_EMAIL}/token:${ZENDESK_API_TOKEN}`).toString('base64')

    console.log('[Get Agent Lightning] Fetching ticket:', sanitizedTicketId)

    // Fetch ticket to get assignee
    const ticketUrl = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/tickets/${sanitizedTicketId}.json`

    let ticketResponse
    try {
      ticketResponse = await fetch(ticketUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`
        }
      })
    } catch (fetchError) {
      console.error('[Get Agent Lightning] Fetch error:', fetchError)
      return res.status(500).json({
        error: 'Failed to connect to Zendesk API',
        message: fetchError.message
      })
    }

    if (!ticketResponse.ok) {
      const errorText = await ticketResponse.text()
      console.error('[Get Agent Lightning] Zendesk API error:', errorText)
      return res.status(ticketResponse.status).json({
        error: 'Failed to fetch ticket from Zendesk',
        status: ticketResponse.status,
        details: errorText
      })
    }

    const ticketData = await ticketResponse.json()
    const assigneeId = ticketData.ticket?.assignee_id

    console.log('[Get Agent Lightning] Assignee ID:', assigneeId)

    if (!assigneeId) {
      return res.status(404).json({
        error: 'No agent assigned',
        message: 'This ticket does not have an assigned agent'
      })
    }

    // Fetch assignee user details
    const userUrl = `https://${ZENDESK_SUBDOMAIN}.zendesk.com/api/v2/users/${assigneeId}.json`

    let userResponse
    try {
      userResponse = await fetch(userUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${authString}`
        }
      })
    } catch (fetchError) {
      console.error('[Get Agent Lightning] User fetch error:', fetchError)
      return res.status(500).json({
        error: 'Failed to fetch user from Zendesk',
        message: fetchError.message
      })
    }

    if (!userResponse.ok) {
      const errorText = await userResponse.text()
      console.error('[Get Agent Lightning] User API error:', errorText)
      return res.status(userResponse.status).json({
        error: 'Failed to fetch user from Zendesk',
        details: errorText
      })
    }

    const userData = await userResponse.json()
    const user = userData.user

    console.log('[Get Agent Lightning] User data:', {
      name: user.name,
      email: user.email,
      user_fields: user.user_fields
    })

    // Check for Lightning address in user fields or notes
    let lightningAddress = null

    // Try direct property access
    if (user.user_fields) {
      lightningAddress = user.user_fields.lightning_address

      // If not found, search through all fields for a lightning address value
      if (!lightningAddress) {
        const fieldEntries = Object.entries(user.user_fields || {})

        for (const [key, value] of fieldEntries) {
          if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
            lightningAddress = value
            console.log('[Get Agent Lightning] Found lightning address in field:', key, '=', value)
            break
          }
        }
      }
    }

    // Also check notes
    const fromNotes = user.notes?.match(/lightning:\s*(\S+@\S+)/i)?.[1]

    if (!lightningAddress && fromNotes) {
      lightningAddress = fromNotes
    }

    console.log('[Get Agent Lightning] Final lightning address:', lightningAddress)

    if (!lightningAddress) {
      return res.status(404).json({
        error: 'Lightning address not found',
        message: `Agent ${user.name} does not have a Lightning address configured`,
        agentName: user.name
      })
    }

    return res.status(200).json({
      success: true,
      agent: {
        name: user.name,
        email: user.email,
        avatarUrl: user.photo?.content_url || '',
        lightningAddress: lightningAddress
      }
    })

  } catch (error) {
    console.error('[Get Agent Lightning] Error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
