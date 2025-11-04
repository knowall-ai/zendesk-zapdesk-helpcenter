/**
 * LNURL utilities for generating Lightning Network payment requests
 */

/**
 * Generate LNURL-pay request with agent Lightning address support
 * Supports both API-based and Lightning address-based payments
 */
export async function generateLNURL({
  apiBase,
  lnurlEndpoint,
  amount,
  articleId,
  requestId,
  placement,
  agentName,
  agentEmail,
  agentLightningAddress
}) {
  console.log('=== GENERATE LNURL CALLED ===')
  console.log('Parameters:', {
    amount,
    requestId,
    agentName,
    agentEmail,
    agentLightningAddress
  })

  // If custom amount, prompt for it
  if (amount === 'custom') {
    const customAmount = prompt('Enter amount in satoshis:', '1000')
    if (!customAmount || isNaN(customAmount)) {
      throw new Error('Invalid amount')
    }
    amount = parseInt(customAmount, 10)
    console.log('Custom amount entered:', amount)
  }

  // If agent has a Lightning address, use LNURL-pay protocol
  if (agentLightningAddress) {
    console.log('✅ Agent has Lightning address, using LNURL-pay protocol')
    console.log('Lightning Address:', agentLightningAddress)
    try {
      return await generateFromLightningAddress({
        lightningAddress: agentLightningAddress,
        amount,
        requestId,
        agentName
      })
    } catch (error) {
      console.error('❌ Failed to generate from Lightning address:', error)
      throw new Error(`Failed to generate payment for ${agentLightningAddress}: ${error.message}`)
    }
  }

  // If custom LNURL endpoint is configured, use it
  if (lnurlEndpoint) {
    try {
      const response = await fetch(`${apiBase}${lnurlEndpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount,
          articleId,
          requestId,
          placement,
          agentName,
          agentEmail,
          timestamp: Date.now()
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Failed to fetch LNURL from API:', error)
      // Fall back to mock data for development
      return generateMockLNURL(amount, agentName)
    }
  }

  // Mock implementation for development/testing
  return generateMockLNURL(amount, agentName)
}

/**
 * Generate invoice from Lightning address using LNURL-pay protocol
 * Lightning address format: username@domain.com
 */
async function generateFromLightningAddress({ lightningAddress, amount, requestId, agentName }) {
  console.log('=== LNURL-PAY FLOW START ===')
  console.log('Lightning Address:', lightningAddress)
  console.log('Amount:', amount, 'sats')
  console.log('Request ID:', requestId)
  console.log('Agent Name:', agentName)

  // Parse Lightning address (e.g., agent@knowall.ai)
  const [username, domain] = lightningAddress.split('@')
  console.log('Parsed username:', username)
  console.log('Parsed domain:', domain)

  if (!username || !domain) {
    console.error('❌ Invalid Lightning address format')
    throw new Error('Invalid Lightning address format')
  }

  // Step 1: Fetch LNURL-pay endpoint from well-known URL
  const lnurlPayUrl = `https://${domain}/.well-known/lnurlp/${username}`
  console.log('Step 1: Fetching LNURL metadata from:', lnurlPayUrl)

  try {
    // Get LNURL-pay metadata
    const metadataResponse = await fetch(lnurlPayUrl)
    console.log('Metadata response status:', metadataResponse.status)

    if (!metadataResponse.ok) {
      throw new Error(`Failed to fetch LNURL metadata: ${metadataResponse.status}`)
    }

    const metadata = await metadataResponse.json()
    console.log('✅ LNURL metadata received:', metadata)

    // Validate amount is within allowed range
    const minSendable = metadata.minSendable / 1000 // Convert from millisats to sats
    const maxSendable = metadata.maxSendable / 1000
    console.log('Amount limits:', { min: minSendable, max: maxSendable, requested: amount })

    if (amount < minSendable || amount > maxSendable) {
      console.error(`❌ Amount ${amount} is outside allowed range ${minSendable}-${maxSendable}`)
      throw new Error(`Amount must be between ${minSendable} and ${maxSendable} sats`)
    }

    console.log('✅ Amount validation passed')

    // Step 2: Request invoice from callback URL
    const amountMillisats = amount * 1000
    const callbackUrl = `${metadata.callback}?amount=${amountMillisats}`

    // Add comment if supported
    let finalCallbackUrl = callbackUrl
    if (metadata.commentAllowed && requestId) {
      const comment = encodeURIComponent(`Tip for support request #${requestId}`)
      finalCallbackUrl += `&comment=${comment}`
      console.log('Comment added to callback:', comment)
    }

    console.log('Step 2: Requesting invoice from:', finalCallbackUrl)

    const invoiceResponse = await fetch(finalCallbackUrl)
    console.log('Invoice response status:', invoiceResponse.status)

    if (!invoiceResponse.ok) {
      throw new Error(`Failed to get invoice: ${invoiceResponse.status}`)
    }

    const invoiceData = await invoiceResponse.json()
    console.log('✅ Invoice data received:', invoiceData)

    if (invoiceData.status === 'ERROR') {
      console.error('❌ Invoice generation failed:', invoiceData.reason)
      throw new Error(invoiceData.reason || 'Failed to generate invoice')
    }

    const paymentData = {
      amount,
      paymentRequest: invoiceData.pr,
      paymentHash: extractPaymentHash(invoiceData.pr),
      expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
      description: `Tip for ${agentName || 'support agent'}: ${amount} sats`,
      recipient: lightningAddress,
      status: 'pending',
      successAction: invoiceData.successAction
    }

    console.log('=== PAYMENT DATA GENERATED ===')
    console.log('Amount:', paymentData.amount, 'sats')
    console.log('Recipient:', paymentData.recipient)
    console.log('Payment Request:', paymentData.paymentRequest)
    console.log('Payment Hash:', paymentData.paymentHash)
    console.log('Description:', paymentData.description)
    console.log('==============================')

    // Return standardized payment data
    return paymentData
  } catch (error) {
    console.error('❌ Lightning address payment error:', error)
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    throw error
  }
}

/**
 * Extract payment hash from Lightning invoice
 */
function extractPaymentHash(invoice) {
  try {
    // Payment hash is typically after 'lnbc' and before the signature
    // This is a simplified extraction - in production use a proper BOLT11 decoder
    const match = invoice.match(/lnbc\d+[munp]1[^\s]+/)
    return match ? match[0].substring(0, 64) : generateRandomHash()
  } catch {
    return generateRandomHash()
  }
}

/**
 * Generate mock LNURL data for development
 * Replace this with actual LNURL service integration
 */
function generateMockLNURL(amount, agentName = 'support agent') {
  // This is a mock Lightning invoice for demonstration
  // In production, this should be a real invoice from your Lightning node
  const mockInvoice = `lnbc${amount}n1pj9x7xzpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpusp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygs9q2gqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqqqqqqqqqqqq`

  return {
    amount,
    paymentRequest: mockInvoice,
    paymentHash: generateRandomHash(),
    expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
    description: `Tip for ${agentName}: ${amount} sats`,
    recipient: 'mock@knowall.ai',
    status: 'pending',
    note: 'This is a mock invoice for development. Configure a Lightning address for real payments.'
  }
}

/**
 * Generate a random payment hash for mock data
 */
function generateRandomHash() {
  return Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('')
}

/**
 * Check payment status (for future implementation)
 */
export async function checkPaymentStatus(paymentHash, apiBase) {
  try {
    const response = await fetch(`${apiBase}/api/payment/status/${paymentHash}`)
    return await response.json()
  } catch (error) {
    console.error('Failed to check payment status:', error)
    return { status: 'unknown' }
  }
}
