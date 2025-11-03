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

          <div className="zapdesk-payment-info">
            <p className="zapdesk-payment-label">Amount</p>
            <p className="zapdesk-payment-amount">
              {lnurl.amount} sats
            </p>
          </div>

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
              <li>Open your Lightning wallet app</li>
              <li>Scan the QR code or paste the invoice</li>
              <li>Confirm the payment</li>
            </ol>
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
