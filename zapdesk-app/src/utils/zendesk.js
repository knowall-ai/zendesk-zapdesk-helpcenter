/**
 * Zendesk API utilities for fetching user information
 */

/**
 * Fetch agent's Lightning address from Zendesk user profile
 * @param {number} userId - The Zendesk user ID
 * @returns {Promise<string|null>} - The Lightning address or null
 */
export async function fetchAgentLightningAddress(userId) {
  console.log('=== FETCHING AGENT LIGHTNING ADDRESS ===')
  console.log('User ID:', userId)

  if (!userId) {
    console.error('❌ No user ID provided')
    return null
  }

  try {
    // Fetch user data from Zendesk API
    const response = await fetch(`/api/v2/users/${userId}.json`)

    console.log('Zendesk API response status:', response.status)

    if (!response.ok) {
      console.error('❌ Failed to fetch user data:', response.status, response.statusText)
      return null
    }

    const data = await response.json()
    console.log('✅ User data received:', data)

    // Extract Lightning address from user fields
    const user = data.user

    // Check if lightning_address exists in user_fields
    if (user.user_fields && user.user_fields.lightning_address) {
      const lightningAddress = user.user_fields.lightning_address
      console.log('✅ Lightning address found:', lightningAddress)
      return lightningAddress
    }

    // Check custom fields (alternative location)
    if (user.custom_fields) {
      const lightningField = user.custom_fields.find(
        field => field.id === 'lightning_address' || field.name === 'lightning_address'
      )
      if (lightningField && lightningField.value) {
        console.log('✅ Lightning address found in custom_fields:', lightningField.value)
        return lightningField.value
      }
    }

    console.warn('⚠️ No Lightning address found in user profile')
    return null
  } catch (error) {
    console.error('❌ Error fetching Lightning address:', error)
    console.error('Error message:', error.message)
    return null
  }
}

/**
 * Fetch current user information
 * @returns {Promise<Object|null>} - User data or null
 */
export async function fetchCurrentUser() {
  try {
    const response = await fetch('/api/v2/users/me.json')

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return data.user
  } catch (error) {
    console.error('Error fetching current user:', error)
    return null
  }
}

/**
 * Get CSRF token from the page
 * Zendesk includes it in meta tags or forms
 */
function getCSRFToken() {
  console.log('🔍 Searching for CSRF token...')

  // Try to get from meta tag (most common in Zendesk)
  const metaTag = document.querySelector('meta[name="csrf-token"]')
  console.log('Meta tag with name="csrf-token":', metaTag)
  if (metaTag) {
    const token = metaTag.getAttribute('content')
    console.log('✅ Found CSRF token in meta tag:', token?.substring(0, 20) + '...')
    return token
  }

  // Try alternative meta tag names
  const altMetaTag = document.querySelector('meta[name="csrf_token"]')
  console.log('Meta tag with name="csrf_token":', altMetaTag)
  if (altMetaTag) {
    const token = altMetaTag.getAttribute('content')
    console.log('✅ Found CSRF token in alt meta tag:', token?.substring(0, 20) + '...')
    return token
  }

  // Try to get from form inputs in comment form
  const tokenInput = document.querySelector('input[name="authenticity_token"]')
  console.log('Input with name="authenticity_token":', tokenInput)
  if (tokenInput) {
    const token = tokenInput.value
    console.log('✅ Found CSRF token in form input:', token?.substring(0, 20) + '...')
    return token
  }

  // Try alternative input name
  const altTokenInput = document.querySelector('input[name="csrf_token"]')
  console.log('Input with name="csrf_token":', altTokenInput)
  if (altTokenInput) {
    const token = altTokenInput.value
    console.log('✅ Found CSRF token in alt form input:', token?.substring(0, 20) + '...')
    return token
  }

  // Check all meta tags
  console.log('All meta tags:', document.querySelectorAll('meta'))

  // Check all forms
  console.log('All forms on page:', document.querySelectorAll('form'))

  console.error('❌ CSRF token not found in page')
  return null
}

/**
 * Post a public comment to a Zendesk request
 * @param {string|number} requestId - The Zendesk request ID
 * @param {string} message - The comment message
 * @param {number} amount - The tip amount in sats
 * @param {string} agentName - Name of the agent being tipped
 * @returns {Promise<Object|null>} - Comment data or null
 */
export async function postTipComment(requestId, message, amount, agentName) {
  console.log('=== POSTING TIP COMMENT TO ZENDESK ===')
  console.log('Request ID:', requestId)
  console.log('Amount:', amount, 'sats')
  console.log('Agent:', agentName)
  console.log('Message:', message)

  if (!requestId) {
    console.error('❌ No request ID provided')
    return null
  }

  try {
    // Get CSRF token
    const csrfToken = getCSRFToken()
    console.log('CSRF Token:', csrfToken ? 'Found' : 'Not found')

    // Build the comment body
    let commentBody = `⚡ **Lightning Tip: ${amount} sats**\n\n`

    if (agentName) {
      commentBody += `Thank you ${agentName}!\n\n`
    }

    if (message && message.trim()) {
      commentBody += `${message.trim()}\n\n`
    }

    commentBody += `---\n*Sent via Lightning Network*`

    console.log('Comment body:', commentBody)

    // Build headers
    const headers = {
      'Content-Type': 'application/json'
    }

    // Add CSRF token if available
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken
    }

    console.log('Request headers:', headers)

    // Post comment to Zendesk API
    const response = await fetch(`/api/v2/requests/${requestId}/comments.json`, {
      method: 'POST',
      headers: headers,
      credentials: 'same-origin', // Include cookies for authentication
      body: JSON.stringify({
        request: {
          comment: {
            body: commentBody,
            public: true
          }
        }
      })
    })

    console.log('Zendesk API response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Failed to post comment:', response.status, errorText)
      throw new Error(`Failed to post comment: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Comment posted successfully:', data)

    return data
  } catch (error) {
    console.error('❌ Error posting comment:', error)
    console.error('Error message:', error.message)
    throw error
  }
}
