import React from 'react'

function TipButton({ amount, label, onClick, disabled }) {
  return (
    <button
      className="zapdesk-tip-button"
      onClick={onClick}
      disabled={disabled}
      aria-label={`Send ${label} tip`}
    >
      <span className="zapdesk-tip-amount">{label}</span>
    </button>
  )
}

export default TipButton
