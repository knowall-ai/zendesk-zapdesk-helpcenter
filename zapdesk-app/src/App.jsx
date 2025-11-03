import React, { useState, useEffect } from 'react'
import TipButton from './components/TipButton'
import PaymentModal from './components/PaymentModal'
import { generateLNURL } from './utils/lnurl'

function App({ config }) {
  const [showModal, setShowModal] = useState(false)
  const [lnurl, setLnurl] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const {
    apiBase = '',
    lnurlEndpoint = '',
    brandColor = '#F7931A',
    placement = 'article_footer',
    articleId = null
  } = config

  useEffect(() => {
    // Apply brand color to CSS variables
    if (brandColor) {
      document.documentElement.style.setProperty('--zapdesk-brand-color', brandColor)
    }
  }, [brandColor])

  const handleTipClick = async (amount) => {
    setLoading(true)
    setError(null)

    try {
      // Generate LNURL-pay request
      const lnurlData = await generateLNURL({
        apiBase,
        lnurlEndpoint,
        amount,
        articleId,
        placement
      })

      setLnurl(lnurlData)
      setShowModal(true)
    } catch (err) {
      console.error('Zapdesk: Failed to generate LNURL', err)
      setError('Failed to generate payment request. Please try again.')
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
          <h3>Support with Lightning</h3>
          <p>Send a tip with Bitcoin Lightning Network</p>
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
