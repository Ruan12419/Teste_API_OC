const STATUS_PAGAMENTO = Object.freeze({
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  EXPIRED: "expired",
  FAILED: "failed",
  REFUNDED: "refunded",
  CHARGED_BACK: "charged_back",
  CANCELED: "canceled"
});

module.exports = STATUS_PAGAMENTO;
