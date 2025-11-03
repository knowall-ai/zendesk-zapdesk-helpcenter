/**
 * LNURL utilities for generating Lightning Network payment requests
 */

/**
 * Generate a mock LNURL-pay request
 * In production, this should call your actual LNURL service
 */
export async function generateLNURL({ apiBase, lnurlEndpoint, amount, articleId, placement }) {
  // If custom amount, prompt for it
  if (amount === 'custom') {
    const customAmount = prompt('Enter amount in satoshis:', '1000')
    if (!customAmount || isNaN(customAmount)) {
      throw new Error('Invalid amount')
    }
    amount = parseInt(customAmount, 10)
  }

  // In production, call your LNURL service API
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
          placement,
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
      return generateMockLNURL(amount)
    }
  }

  // Mock implementation for development/testing
  return generateMockLNURL(amount)
}

/**
 * Generate mock LNURL data for development
 * Replace this with actual LNURL service integration
 */
function generateMockLNURL(amount) {
  // This is a mock Lightning invoice for demonstration
  // In production, this should be a real invoice from your Lightning node
  const mockInvoice = `lnbc${amount}n1pj9x7xzpp5qqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqqqsyqcyq5rqwzqfqypqdq5xysxxatsyp3k7enxv4jsxqzpusp5zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zyg3zygs9q2gqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpqqqqqqqqqqqq`

  return {
    amount,
    paymentRequest: mockInvoice,
    paymentHash: generateRandomHash(),
    expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
    description: `Zapdesk tip: ${amount} sats`,
    status: 'pending'
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
