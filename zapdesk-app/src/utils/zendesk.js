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
