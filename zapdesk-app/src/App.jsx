import React, { useState, useEffect } from 'react'
import TipButton from './components/TipButton'
import PaymentModal from './components/PaymentModal'
import { generateLNURL } from './utils/lnurl'
import { fetchAgentLightningAddress } from './utils/zendesk'

function App({ config }) {
  const [showModal, setShowModal] = useState(false)
  const [lnurl, setLnurl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lightningAddress, setLightningAddress] = useState(null)
  const [fetchingAddress, setFetchingAddress] = useState(false)

  const {
    apiBase = '',
    lnurlEndpoint = '',
    brandColor = '#F7931A',
    placement = 'article_footer',
    articleId = null,
    requestId = null,
    agentName = null,
    agentEmail = null,
    agentLightningAddress = null,
    assigneeUserId = null
  } = config

  useEffect(() => {
    console.log('=== ZAPDESK APP INITIALIZED ===')
    console.log('Config received:', {
      apiBase,
      lnurlEndpoint,
      brandColor,
      placement,
      articleId,
      requestId,
      agentName,
      agentEmail,
      agentLightningAddress,
      assigneeUserId
    })
    console.log('Assignee User ID:', assigneeUserId || '⚠️ NOT SET')
    console.log('Agent Lightning Address (from config):', agentLightningAddress || '⚠️ NOT CONFIGURED')
    console.log('================================')

    // Apply brand color to CSS variables
    if (brandColor) {
      document.documentElement.style.setProperty('--zapdesk-brand-color', brandColor)
    }
  }, [brandColor])

  // Fetch Lightning address from Zendesk API
  useEffect(() => {
    async function loadLightningAddress() {
      // Skip if not on request page or no assignee
      if (placement !== 'request_page' || !assigneeUserId) {
        console.log('⚠️ Skipping Lightning address fetch (not request page or no assignee)')
        return
      }

      // If Lightning address already provided in config, use it
      if (agentLightningAddress) {
        console.log('✅ Using Lightning address from config:', agentLightningAddress)
        setLightningAddress(agentLightningAddress)
        return
      }

      console.log('🔄 Fetching Lightning address from Zendesk API...')
      setFetchingAddress(true)

      try {
        const address = await fetchAgentLightningAddress(assigneeUserId)

        if (address) {
          console.log('✅ Lightning address fetched:', address)
          setLightningAddress(address)
        } else {
          console.warn('⚠️ No Lightning address found for agent')
        }
      } catch (error) {
        console.error('❌ Error fetching Lightning address:', error)
      } finally {
        setFetchingAddress(false)
      }
    }

    loadLightningAddress()
  }, [assigneeUserId, placement, agentLightningAddress])

  const handleTipClick = async (amount) => {
    console.log('=== TIP BUTTON CLICKED ===')
    console.log('Amount requested:', amount)
    console.log('Request ID:', requestId)
    console.log('Agent Name:', agentName)
    console.log('Agent Email:', agentEmail)
    console.log('Agent Lightning Address (fetched):', lightningAddress)
    console.log('Agent Lightning Address (config):', agentLightningAddress)
    console.log('==========================')

    setLoading(true)
    setError(null)

    try {
      // Use fetched Lightning address, fallback to config
      const finalLightningAddress = lightningAddress || agentLightningAddress

      // Validate agent Lightning address if on request page
      if (placement === 'request_page' && !finalLightningAddress) {
        console.error('❌ Agent Lightning address not configured!')
        throw new Error('Agent Lightning address not configured. Please ask the agent to set their Lightning address in their Zendesk profile.')
      }

      console.log('✅ Using Lightning address:', finalLightningAddress)
      console.log('✅ Starting LNURL generation...')

      // Generate LNURL-pay request
      const lnurlData = await generateLNURL({
        apiBase,
        lnurlEndpoint,
        amount,
        articleId,
        requestId,
        placement,
        agentName,
        agentEmail,
        agentLightningAddress: finalLightningAddress
      })

      console.log('✅ LNURL generated successfully!')
      console.log('Payment data:', lnurlData)

      setLnurl(lnurlData)
      setShowModal(true)
    } catch (err) {
      console.error('❌ Failed to generate LNURL:', err)
      console.error('Error details:', err.message)
      setError(err.message || 'Failed to generate payment request. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setLnurl(null)
    setError(null)
  }

  return (
    <div className="zapdesk-app">
      <div className="zapdesk-header">
        <div className="zapdesk-icon">⚡</div>
        <div className="zapdesk-title">
          <h3>{placement === 'request_page' && agentName ? `Tip ${agentName}` : 'Support with Lightning'}</h3>
          <p>{placement === 'request_page' ? 'Show appreciation for great support' : 'Send a tip with Bitcoin Lightning Network'}</p>
          {fetchingAddress && (
            <p style={{fontSize: '0.85rem', color: '#9CA3AF', marginTop: '0.25rem'}}>
              🔄 Loading Lightning address...
            </p>
          )}
          {!fetchingAddress && placement === 'request_page' && lightningAddress && (
            <p style={{fontSize: '0.85rem', color: '#84CC16', marginTop: '0.25rem'}}>
              ✅ Lightning payments ready
            </p>
          )}
        </div>
      </div>

      <div className="zapdesk-tip-buttons">
        <TipButton
          amount={100}
          label="100 sats"
          onClick={() => handleTipClick(100)}
          disabled={loading}
        />
        <TipButton
          amount={500}
          label="500 sats"
          onClick={() => handleTipClick(500)}
          disabled={loading}
        />
        <TipButton
          amount={1000}
          label="1,000 sats"
          onClick={() => handleTipClick(1000)}
          disabled={loading}
        />
        <TipButton
          amount="custom"
          label="Custom"
          onClick={() => handleTipClick('custom')}
          disabled={loading}
        />
      </div>

      {error && (
        <div className="zapdesk-error">
          <span>⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {loading && (
        <div className="zapdesk-loading">
          <div className="zapdesk-spinner"></div>
          <p>Generating payment request...</p>
        </div>
      )}

      {showModal && lnurl && (
        <PaymentModal
          lnurl={lnurl}
          onClose={handleCloseModal}
        />
      )}

      <div className="zapdesk-footer">
        <p className="zapdesk-info">
          ⚡ Lightning Network payments are instant and have minimal fees
        </p>
      </div>
    </div>
  )
}

export default App
