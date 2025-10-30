import { useState, useEffect } from 'react'
import { generateLightningQR } from './services/lightning'
import { POST_COMMENT_API, GET_AGENT_LIGHTNING_API } from './config'
import logoSvg from './assets/logo.svg'

function App() {
  const [zafClient, setZafClient] = useState(null)
  const [agent, setAgent] = useState(null)
  const [ticketId, setTicketId] = useState(null)
  const [lightningAddress, setLightningAddress] = useState(null)
  const [selectedSats, setSelectedSats] = useState(100)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [qrData, setQrData] = useState(null)
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [agentError, setAgentError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [modalContent, setModalContent] = useState({ title: '', message: '', type: 'success' })

  useEffect(() => {
    // Get URL parameters
    const urlParams = new URLSearchParams(window.location.search)
    const ticketIdFromUrl = urlParams.get('ticket_id')
    const agentNameFromUrl = urlParams.get('agent_name')

    console.log('URL Parameters:', { ticketIdFromUrl, agentNameFromUrl })

    // Store ticket ID from URL
    if (ticketIdFromUrl) {
      setTicketId(ticketIdFromUrl)
    }

    // Initialize Zendesk ZAF Client
    const client = window.ZAFClient?.init()
    setZafClient(client)

    if (client) {
      // Fetch ticket/request information
      client.get(['ticket']).then(async (data) => {
        const ticketData = data['ticket']
        const ticketId = ticketData.id

        console.log('Ticket data:', ticketData)

        try {
          // Fetch the full request details including assignee from API
          const requestResponse = await client.request({
            url: `/api/v2/requests/${ticketId}.json`,
            type: 'GET'
          })

          const requestData = JSON.parse(requestResponse.responseText)
          const request = requestData.request
          const assigneeId = request.assignee_id

          console.log('Request data:', request)
          console.log('Assignee ID:', assigneeId)

          if (assigneeId) {
            // Fetch assignee user details
            const userResponse = await client.request({
              url: `/api/v2/users/${assigneeId}.json`,
              type: 'GET'
            })

            const userData = JSON.parse(userResponse.responseText)
            const user = userData.user

            console.log('Assignee user data:', user)
            console.log('User fields RAW:', JSON.stringify(user.user_fields, null, 2))
            console.log('User notes:', user.notes)

            setAgent({
              name: user.name || 'Agent',
              email: user.email || '',
              avatarUrl: user.photo?.content_url || ''
            })

            // Check for Lightning address in user fields or notes
            // Zendesk user_fields can be an object with field IDs as keys
            let fromUserField = null

            // Try multiple ways to access the field
            if (user.user_fields) {
              // Try direct property access (if field name is used)
              fromUserField = user.user_fields.lightning_address

              console.log('Direct access lightning_address:', fromUserField)

              // If not found, search through all fields for a lightning address value
              if (!fromUserField) {
                const fieldEntries = Object.entries(user.user_fields || {})
                console.log('All user field entries:', fieldEntries)

                for (const [key, value] of fieldEntries) {
                  console.log(`Checking field ${key}:`, value)
                  if (typeof value === 'string' && value.includes('@') && value.includes('.')) {
                    fromUserField = value
                    console.log('Found lightning address in field:', key, '=', value)
                    break
                  }
                }
              }
            }

            const fromNotes = user.notes?.match(/lightning:\s*(\S+@\S+)/i)?.[1]

            console.log('Lightning address from user field:', fromUserField)
            console.log('Lightning address from notes:', fromNotes)

            const agentLightningAddress = fromUserField || fromNotes

            if (!agentLightningAddress) {
              console.error('No Lightning address found for agent:', user.name)
              setAgentError(`No Lightning address configured for agent ${user.name}. Please add a Lightning address to their profile.`)
              setLoading(false)
              return
            }

            console.log('Final Lightning address:', agentLightningAddress)
            setLightningAddress(agentLightningAddress)
          } else {
            // No assignee yet - show error
            console.warn('No agent assigned to this ticket')
            setAgentError('No agent is currently assigned to this ticket. Tips can only be sent to assigned agents.')
          }

          setLoading(false)
        } catch (error) {
          console.error('Error fetching agent info:', error)
          // Show error instead of falling back to defaults
          setAgentError('Unable to fetch agent information. Please try refreshing the page.')
          setLoading(false)
        }
      }).catch((error) => {
        console.error('Error fetching ticket:', error)
        setAgentError('Unable to load ticket information. Please try refreshing the page.')
        setLoading(false)
      })

      // Resize iframe
      client.invoke('resize', { width: '100%', height: '700px' })
    } else {
      // No ZAF client - iframe mode, fetch agent info from API
      if (ticketIdFromUrl) {
        console.log('[Iframe Mode] Fetching agent info from API for ticket:', ticketIdFromUrl)

        // Fetch agent Lightning address from our API
        fetch(`${GET_AGENT_LIGHTNING_API}?ticketId=${ticketIdFromUrl}`)
          .then(response => response.json())
          .then(data => {
            if (data.success && data.agent) {
              console.log('[Iframe Mode] Agent data received:', data.agent)

              setAgent({
                name: data.agent.name,
                email: data.agent.email,
                avatarUrl: data.agent.avatarUrl
              })

              setLightningAddress(data.agent.lightningAddress)
              setLoading(false)
            } else {
              console.error('[Iframe Mode] Failed to get agent info:', data)
              setAgentError(data.message || 'Unable to fetch agent information')
              setLoading(false)
            }
          })
          .catch(error => {
            console.error('[Iframe Mode] Error fetching agent info:', error)
            setAgentError('Unable to fetch agent information. Please try refreshing the page.')
            setLoading(false)
          })
      } else {
        // No ticket ID available - show error
        console.warn('No ZAF client and no ticket ID in URL')
        setAgentError('This widget must be used within a Zendesk ticket with an assigned agent.')
        setLoading(false)
      }
    }
  }, [])

  // Generate QR code when sat amount or lightning address changes
  useEffect(() => {
    const generateQR = async () => {
      // Don't generate QR if there's an agent error
      if (agentError || !lightningAddress) return

      setQrLoading(true)
      setQrError(null)

      try {
        console.log(`Generating QR for ${selectedSats} sats to ${lightningAddress}`)
        const { qrDataUrl, lnurlString } = await generateLightningQR(
          lightningAddress,
          selectedSats
        )
        setQrData(qrDataUrl)
        console.log('QR code generated successfully')
      } catch (error) {
        console.error('Failed to generate QR:', error)
        setQrError(error.message || 'Failed to generate QR code')
      } finally {
        setQrLoading(false)
      }
    }

    generateQR()
  }, [selectedSats, lightningAddress, retryCount])

  const handleSatSelection = (sats) => {
    setSelectedSats(sats)
  }

  const handleSubmit = async () => {
    if (!ticketId) {
      setModalContent({
        title: 'Error',
        message: 'Ticket ID not found. Please refresh the page.',
        type: 'error'
      })
      setShowModal(true)
      return
    }

    setSubmitting(true)

    try {
      // Call our serverless API to post the comment to Zendesk
      console.log('[Submit] Posting to API:', POST_COMMENT_API)
      const response = await fetch(POST_COMMENT_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ticketId: ticketId,
          message: message,
          sats: selectedSats,
          agentName: agent?.name
        })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setModalContent({
          title: 'Tip Recorded Successfully!',
          message: 'Thank you! Your tip has been recorded and a public comment has been added to the ticket.',
          type: 'success'
        })
        setShowModal(true)
        setMessage('')
      } else {
        console.error('API error:', data)
        setModalContent({
          title: 'Failed to Post Comment',
          message: data.error || 'Unknown error occurred. Please try again.',
          type: 'error'
        })
        setShowModal(true)
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
      setModalContent({
        title: 'Connection Error',
        message: 'Failed to post comment. Please check your connection and try again.',
        type: 'error'
      })
      setShowModal(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading...</p>
      </div>
    )
  }

  // Show error state if there's an agent error
  if (agentError) {
    return (
      <div className="app-container">
        <div className="content">
          <h2 className="subtitle">
            <img src={logoSvg} alt="Zapdesk" className="logo-icon" />
            Tip Your Support Agent
          </h2>

          <div className="agent-error-container">
            <div className="error-icon">⚠️</div>
            <h3 className="error-title">Unable to Process Tip</h3>
            <p className="error-message">{agentError}</p>
            <button
              className="refresh-button"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </button>
          </div>

          <div className="branding">
            Powered by <a href="https://knowall.ai" target="_blank" rel="noopener noreferrer">Zapdesk from KnowAll AI</a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app-container">
      <div className="content">
        <h2 className="subtitle">
          <img src={logoSvg} alt="Zapdesk" className="logo-icon" />
          Tip {agent.name} with Bitcoin Lightning
        </h2>

        <div className="agent-info">
          <div className="agent-avatar">
            {agent.avatarUrl ? (
              <img src={agent.avatarUrl} alt={agent.name} />
            ) : (
              <div className="avatar-placeholder">{agent.name.charAt(0)}</div>
            )}
          </div>
          <div className="agent-details">
            <div className="agent-name">{agent.name}</div>
            <div className="agent-label">Your support agent</div>
          </div>
        </div>

        <div className="sat-buttons">
          <button
            className={`sat-button ${selectedSats === 100 ? 'active' : ''}`}
            onClick={() => handleSatSelection(100)}
          >
            100 sats
          </button>
          <button
            className={`sat-button ${selectedSats === 1000 ? 'active' : ''}`}
            onClick={() => handleSatSelection(1000)}
          >
            1,000 sats
          </button>
          <button
            className={`sat-button ${selectedSats === 10000 ? 'active' : ''}`}
            onClick={() => handleSatSelection(10000)}
          >
            10,000 sats
          </button>
        </div>

        <div className="qr-code-container">
          {qrLoading && (
            <div className="qr-loading">
              <div className="spinner"></div>
              <p>Generating invoice...</p>
            </div>
          )}
          {qrError && (
            <div className="qr-error">
              <p>⚠️ {qrError}</p>
              <button onClick={() => setRetryCount(prev => prev + 1)}>Retry</button>
            </div>
          )}
          {qrData && !qrLoading && !qrError && (
            <img
              src={qrData}
              alt="Lightning Invoice QR Code"
              className="qr-code"
            />
          )}
        </div>

        <div className="message-section">
          <label className="message-label">Add a message (optional)</label>
          <textarea
            className="message-input"
            placeholder="Thank you for your help"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        <button
          className="submit-button"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Processing...' : 'Mark as Paid'}
        </button>

        <div className="footer-text">
          Scan the QR code with your Lightning wallet to send the tip. Click 'Mark as Paid' after payment is complete.
        </div>

        <div className="branding">
          Powered by <a href="https://knowall.ai" target="_blank" rel="noopener noreferrer">Zapdesk from KnowAll AI</a>
        </div>
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-icon ${modalContent.type}`}>
              {modalContent.type === 'success' ? '✓' : '⚠'}
            </div>
            <h3 className="modal-title">{modalContent.title}</h3>
            <p className="modal-message">{modalContent.message}</p>
            <button className="modal-button" onClick={() => setShowModal(false)}>
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
