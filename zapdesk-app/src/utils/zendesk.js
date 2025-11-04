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
 * Auto-fill Zendesk's native comment form with tip message
 * This works around CSRF restrictions by using the existing form
 * @param {string} message - The user's message
 * @param {number} amount - The tip amount in sats
 * @param {string} agentName - Name of the agent being tipped
 * @returns {Promise<boolean>} - Success status
 */
export async function fillCommentForm(message, amount, agentName) {
  console.log('=== AUTO-FILLING COMMENT FORM ===')
  console.log('Amount:', amount, 'sats')
  console.log('Agent:', agentName)
  console.log('Message:', message)

  try {
    // Step 1: Click "Add to conversation" button if it exists
    console.log('🔍 Looking for "Add to conversation" button...')
    const addToConversationBtn = document.querySelector('.comment-show-container') ||
                                  document.querySelector('button:contains("Add to conversation")') ||
                                  document.querySelector('[class*="comment-show"]')

    if (addToConversationBtn) {
      console.log('✅ Found "Add to conversation" button, clicking it...')
      addToConversationBtn.click()
      // Wait for the form to appear
      await new Promise(resolve => setTimeout(resolve, 500))
    } else {
      console.log('ℹ️ No "Add to conversation" button found (form may already be visible)')
    }

    // Step 2: Find the CKEditor instance
    console.log('🔍 Looking for CKEditor...')

    // Find the CKEditor contenteditable div
    const ckEditor = document.querySelector('.ck-editor__editable[contenteditable="true"]') ||
                     document.querySelector('[role="textbox"][contenteditable="true"]') ||
                     document.querySelector('.ck-content[contenteditable="true"]')

    if (!ckEditor) {
      console.error('❌ Could not find CKEditor on page')
      console.log('Looking for contenteditable elements:', document.querySelectorAll('[contenteditable="true"]'))
      return false
    }

    console.log('✅ Found CKEditor:', ckEditor)
    console.log('   Class:', ckEditor.className)
    console.log('   Aria-label:', ckEditor.getAttribute('aria-label'))

    // Build the comment body (HTML format for CKEditor)
    let commentHTML = `<p><strong>⚡ Lightning Tip: ${amount} sats</strong></p>`

    if (agentName) {
      commentHTML += `<p>Thank you ${agentName}!</p>`
    }

    if (message && message.trim()) {
      // Split message by newlines and wrap each in <p> tags
      const lines = message.trim().split('\n').filter(line => line.trim())
      lines.forEach(line => {
        commentHTML += `<p>${line}</p>`
      })
    }

    commentHTML += `<hr><p><em>Sent via Lightning Network</em></p>`

    console.log('📝 Setting CKEditor content:', commentHTML)

    // Clear existing content
    ckEditor.innerHTML = ''

    // Set the new HTML content
    ckEditor.innerHTML = commentHTML

    // Trigger input event to notify CKEditor of the change
    ckEditor.dispatchEvent(new Event('input', { bubbles: true }))
    ckEditor.dispatchEvent(new Event('change', { bubbles: true }))

    // Focus the editor
    ckEditor.focus()

    // Scroll to the editor
    ckEditor.scrollIntoView({ behavior: 'smooth', block: 'center' })

    // Highlight the editor briefly
    const originalBorder = ckEditor.style.border
    const originalBackground = ckEditor.style.backgroundColor
    ckEditor.style.border = '3px solid #84CC16'
    ckEditor.style.backgroundColor = '#F0FDF4'
    ckEditor.style.transition = 'all 0.3s'

    setTimeout(() => {
      ckEditor.style.border = originalBorder
      ckEditor.style.backgroundColor = originalBackground
    }, 3000)

    // Also update the hidden textarea for good measure
    const hiddenTextarea = document.querySelector('#request_comment_body') ||
                          document.querySelector('textarea[name="request[comment][body]"]')

    if (hiddenTextarea) {
      console.log('📝 Also updating hidden textarea')
      hiddenTextarea.value = commentHTML
    }

    console.log('✅ Comment form auto-filled successfully!')
    console.log('💡 User needs to click "Submit" to post the comment')
    console.log('📍 Content in CKEditor:', ckEditor.innerHTML.substring(0, 100) + '...')

    return true
  } catch (error) {
    console.error('❌ Error filling comment form:', error)
    console.error('Error message:', error.message)
    console.error('Stack:', error.stack)
    return false
  }
}
