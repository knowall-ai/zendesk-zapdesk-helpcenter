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
      // Wait for the form to appear and CKEditor to initialize
      await new Promise(resolve => setTimeout(resolve, 800))
    } else {
      console.log('ℹ️ No "Add to conversation" button found (form may already be visible)')
    }

    // Step 2: Find the CKEditor contenteditable div
    console.log('🔍 Looking for CKEditor...')

    const ckEditorElement = document.querySelector('.ck-editor__editable[contenteditable="true"]') ||
                           document.querySelector('[role="textbox"][contenteditable="true"]') ||
                           document.querySelector('.ck-content[contenteditable="true"]')

    if (!ckEditorElement) {
      console.error('❌ Could not find CKEditor on page')
      console.log('Looking for contenteditable elements:', document.querySelectorAll('[contenteditable="true"]'))
      return false
    }

    console.log('✅ Found CKEditor element:', ckEditorElement)

    // Step 3: Try to find the CKEditor instance
    console.log('🔍 Looking for CKEditor instance...')

    // CKEditor 5 stores instance in the DOM element
    let editorInstance = null

    // Try multiple ways to get the editor instance
    if (ckEditorElement.ckeditorInstance) {
      editorInstance = ckEditorElement.ckeditorInstance
      console.log('✅ Found CKEditor instance via ckeditorInstance property')
    } else if (window.CKEDITOR && window.CKEDITOR.instances) {
      // CKEditor 4 way
      const instanceKeys = Object.keys(window.CKEDITOR.instances)
      if (instanceKeys.length > 0) {
        editorInstance = window.CKEDITOR.instances[instanceKeys[0]]
        console.log('✅ Found CKEditor 4 instance')
      }
    }

    // Build the comment body
    let commentHTML = `<p><strong>⚡ Lightning Tip: ${amount} sats</strong></p>`

    if (agentName) {
      commentHTML += `<p>Thank you ${agentName}!</p>`
    }

    if (message && message.trim()) {
      const lines = message.trim().split('\n').filter(line => line.trim())
      lines.forEach(line => {
        commentHTML += `<p>${line}</p>`
      })
    }

    commentHTML += `<hr><p><em>Sent via Lightning Network</em></p>`

    console.log('📝 Content to insert:', commentHTML)

    // If we found the editor instance, use its API
    if (editorInstance) {
      console.log('✅ Using CKEditor API to set content')
      if (editorInstance.setData) {
        editorInstance.setData(commentHTML)
      } else if (editorInstance.model && editorInstance.model.change) {
        // CKEditor 5 way
        editorInstance.model.change(writer => {
          const root = editorInstance.model.document.getRoot()
          writer.remove(writer.createRangeIn(root))
          const viewFragment = editorInstance.data.processor.toView(commentHTML)
          const modelFragment = editorInstance.data.toModel(viewFragment)
          editorInstance.model.insertContent(modelFragment)
        })
      }
    } else {
      // Fallback: Manually insert content and trigger events
      console.log('⚠️ CKEditor instance not found, using manual insertion')

      // Focus the editor first
      ckEditorElement.focus()

      // Clear existing content
      ckEditorElement.innerHTML = ''

      // Insert the HTML
      ckEditorElement.innerHTML = commentHTML

      // Trigger comprehensive events
      const events = ['input', 'change', 'keydown', 'keyup', 'paste']
      events.forEach(eventType => {
        const event = new Event(eventType, { bubbles: true, cancelable: true })
        ckEditorElement.dispatchEvent(event)
      })

      // Trigger input event with InputEvent
      const inputEvent = new InputEvent('input', {
        bubbles: true,
        cancelable: true,
        inputType: 'insertText',
        data: commentHTML
      })
      ckEditorElement.dispatchEvent(inputEvent)

      // Move cursor to end
      const range = document.createRange()
      const selection = window.getSelection()
      range.selectNodeContents(ckEditorElement)
      range.collapse(false)
      selection.removeAllRanges()
      selection.addRange(range)
    }

    // Update the hidden textarea
    const hiddenTextarea = document.querySelector('#request_comment_body') ||
                          document.querySelector('textarea[name="request[comment][body]"]')

    if (hiddenTextarea) {
      console.log('📝 Updating hidden textarea')
      hiddenTextarea.value = commentHTML
      hiddenTextarea.dispatchEvent(new Event('change', { bubbles: true }))
    }

    // Also update the mimetype field if it exists
    const mimetypeField = document.querySelector('#request_comment_body_mimetype')
    if (mimetypeField && mimetypeField.value !== 'text/html') {
      console.log('📝 Setting mimetype to text/html')
      mimetypeField.value = 'text/html'
    }

    // Scroll and highlight
    ckEditorElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

    const originalBorder = ckEditorElement.style.border
    const originalBackground = ckEditorElement.style.backgroundColor
    ckEditorElement.style.border = '3px solid #84CC16'
    ckEditorElement.style.backgroundColor = '#F0FDF4'
    ckEditorElement.style.transition = 'all 0.3s'

    setTimeout(() => {
      ckEditorElement.style.border = originalBorder
      ckEditorElement.style.backgroundColor = originalBackground
    }, 3000)

    console.log('✅ Comment form auto-filled successfully!')
    console.log('💡 User needs to click "Submit" to post the comment')

    return true
  } catch (error) {
    console.error('❌ Error filling comment form:', error)
    console.error('Error message:', error.message)
    console.error('Stack:', error.stack)
    return false
  }
}
