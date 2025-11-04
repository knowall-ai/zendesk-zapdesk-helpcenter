import React, { useState, useEffect } from 'react'

function PaymentModal({ lnurl, onClose }) {
  const [copied, setCopied] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState('')

  useEffect(() => {
    // Generate QR code URL using a QR code API
    if (lnurl?.paymentRequest) {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(lnurl.paymentRequest)}`
      setQrCodeUrl(qrUrl)
    }
  }, [lnurl])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(lnurl.paymentRequest)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="zapdesk-modal-backdrop" onClick={handleBackdropClick}>
      <div className="zapdesk-modal">
        <div className="zapdesk-modal-header">
          <h3>⚡ Lightning Payment</h3>
          <button
            className="zapdesk-modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="zapdesk-modal-body">
          <div className="zapdesk-qr-container">
            {qrCodeUrl && (
              <img
                src={qrCodeUrl}
                alt="Lightning payment QR code"
                className="zapdesk-qr-code"
              />
            )}
          </div>

          {lnurl.recipient && (
            <div className="zapdesk-payment-info" style={{marginBottom: '1rem'}}>
              <p className="zapdesk-payment-label">Recipient</p>
              <p className="zapdesk-payment-value" style={{color: '#84CC16', fontWeight: 600}}>
                {lnurl.recipient}
              </p>
            </div>
          )}

          <div className="zapdesk-payment-info">
            <p className="zapdesk-payment-label">Amount</p>
            <p className="zapdesk-payment-amount">
              {lnurl.amount} sats
            </p>
          </div>

          {lnurl.description && (
            <div className="zapdesk-payment-info" style={{marginTop: '0.5rem'}}>
              <p className="zapdesk-payment-label">Description</p>
              <p className="zapdesk-payment-value" style={{fontSize: '0.9rem', color: '#9CA3AF'}}>
                {lnurl.description}
              </p>
            </div>
          )}

          <div className="zapdesk-invoice-container">
            <p className="zapdesk-payment-label">Lightning Invoice</p>
            <div className="zapdesk-invoice">
              <code>{lnurl.paymentRequest}</code>
            </div>
            <button
              className="zapdesk-copy-button"
              onClick={handleCopy}
            >
              {copied ? '✓ Copied!' : '📋 Copy Invoice'}
            </button>
          </div>

          <div className="zapdesk-instructions">
            <h4>How to pay:</h4>
            <ol>
              <li>Open your Lightning wallet app (Phoenix, Wallet of Satoshi, Muun, etc.)</li>
              <li>Scan the QR code above or paste the invoice below</li>
              <li>Verify the amount and recipient</li>
              <li>Confirm the payment</li>
            </ol>
            {lnurl.note && (
              <p style={{marginTop: '1rem', padding: '0.75rem', background: '#1F2937', borderRadius: '6px', fontSize: '0.85rem', color: '#D1D5DB'}}>
                ℹ️ {lnurl.note}
              </p>
            )}
          </div>
        </div>

        <div className="zapdesk-modal-footer">
          <button className="zapdesk-button-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default PaymentModal
