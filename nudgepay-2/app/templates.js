// Curated, standalone email templates. Loaded directly by index.html.
window.NUDGEPAY_TEMPLATES = {
  "before": {
    "polite": {
      "subject": "Reminder: invoice {invoiceNumber} due {dueDateShort}",
      "body": "Hi {clientName},\n\nI hope your week is going well. Just a friendly heads-up that invoice {invoiceNumber} for {amount} is due on {dueDate}.\n{paymentLine}\nCould you arrange payment by that date? If you need anything from me before then, such as a copy of the invoice, just let me know.\n\nThanks so much,\n{yourName}"
    },
    "standard": {
      "subject": "Invoice {invoiceNumber} due {dueDateShort}",
      "body": "Hi {clientName},\n\nThis is a reminder that invoice {invoiceNumber} for {amount} is due on {dueDate}.\n{paymentLine}\nPlease schedule payment to arrive by the due date. Let me know if you need a copy of the invoice or anything else from me to process it.\n\nBest regards,\n{yourName}"
    },
    "firm": {
      "subject": "Payment due {dueDateShort}: invoice {invoiceNumber}",
      "body": "Hello {clientName},\n\nInvoice {invoiceNumber} for {amount} is due on {dueDate}.\n{paymentLine}\nPlease make sure payment is scheduled so that it arrives by that date. If there is an issue with the invoice, please tell me before the due date so we can resolve it.\n\nRegards,\n{yourName}"
    }
  },
  "due": {
    "polite": {
      "subject": "Quick reminder: invoice {invoiceNumber} is due today",
      "body": "Hi {clientName},\n\nI hope your week is going well. Just a quick note that invoice {invoiceNumber} for {amount} is due today, {dueDate}.\n{paymentLine}\nIf payment is not already on its way, could you send it today? If you need anything else from me, just let me know.\n\nThanks so much,\n{yourName}"
    },
    "standard": {
      "subject": "Invoice {invoiceNumber} due today",
      "body": "Hi {clientName},\n\nThis is a reminder that invoice {invoiceNumber} for {amount} is due today, {dueDate}.\n{paymentLine}\nPlease send payment today and let me know once it has been sent. If you have any questions about the invoice, I'm happy to help.\n\nBest regards,\n{yourName}"
    },
    "firm": {
      "subject": "Payment due today: invoice {invoiceNumber}",
      "body": "Hello {clientName},\n\nInvoice {invoiceNumber} for {amount} is due today, {dueDate}.\n{paymentLine}\nPlease make sure payment is sent by the end of the day and confirm by replying to this email. If there is an issue with the invoice, please tell me so we can resolve it.\n\nRegards,\n{yourName}"
    }
  },
  "late3": {
    "polite": {
      "subject": "Invoice {invoiceNumber} is now past due",
      "body": "Hi {clientName},\n\nI hope all is well. Invoice {invoiceNumber} for {amount} was due on {dueDate} and is now past due. These things are easy to miss, so I wanted to check in.\n{paymentLine}\nCould you arrange payment as soon as you can? If anything's holding it up, just let me know.\n\nThanks so much,\n{yourName}"
    },
    "standard": {
      "subject": "Invoice {invoiceNumber} is overdue",
      "body": "Hi {clientName},\n\nInvoice {invoiceNumber} for {amount} was due on {dueDate} and is now overdue.\n{paymentLine}\nPlease arrange payment at your earliest convenience and reply once it has been sent. If there's an issue with the invoice, let me know.\n\nThanks,\n{yourName}"
    },
    "firm": {
      "subject": "Overdue: invoice {invoiceNumber}",
      "body": "Hello {clientName},\n\nInvoice {invoiceNumber} for {amount} was due on {dueDate} and is now overdue.\n{paymentLine}\nPlease make payment as soon as possible and reply to confirm once it has been sent. If there is an issue with the invoice, please tell me now so we can resolve it.\n\nRegards,\n{yourName}"
    }
  },
  "late7": {
    "polite": {
      "subject": "Checking in on overdue invoice {invoiceNumber}",
      "body": "Hi {clientName},\n\nI'm checking in about invoice {invoiceNumber} for {amount}, which was due on {dueDate} and is still overdue.\n{paymentLine}\nCould you let me know when you expect to make the payment? If something is holding it up, I'm happy to talk it through.\n\nThanks so much,\n{yourName}"
    },
    "standard": {
      "subject": "Payment date for overdue invoice {invoiceNumber}",
      "body": "Hi {clientName},\n\nInvoice {invoiceNumber} for {amount} was due on {dueDate} and remains overdue.\n{paymentLine}\nPlease reply with the date when payment will be made. If there's a problem with the invoice, let me know so we can sort it out.\n\nThanks,\n{yourName}"
    },
    "firm": {
      "subject": "Overdue invoice {invoiceNumber}: payment date needed",
      "body": "Hello {clientName},\n\nInvoice {invoiceNumber} for {amount} was due on {dueDate} and remains overdue.\n{paymentLine}\nPlease make payment, or reply with a confirmed payment date, by {replyByDate}. If there is an issue with the invoice, please tell me by then so we can resolve it.\n\nRegards,\n{yourName}"
    }
  },
  "late14": {
    "polite": {
      "subject": "Invoice {invoiceNumber} is overdue: please reply",
      "body": "Hi {clientName},\n\nInvoice {invoiceNumber} for {amount} was due on {dueDate} and is still overdue, so I'd really appreciate your help settling it soon.\n{paymentLine}\nCould you arrange payment, or reply with a payment date, by {replyByDate}? If something is getting in the way, please let me know and we can work it out.\n\nThanks so much,\n{yourName}"
    },
    "standard": {
      "subject": "Overdue invoice {invoiceNumber}: reply needed",
      "body": "Hi {clientName},\n\nInvoice {invoiceNumber} for {amount} was due on {dueDate} and remains overdue.\n{paymentLine}\nPlease make payment, or reply with a firm payment date, by {replyByDate}. If there's an issue with the invoice, let me know before then.\n\nBest regards,\n{yourName}"
    },
    "firm": {
      "subject": "Final notice: invoice {invoiceNumber} is overdue",
      "body": "Hello {clientName},\n\nThis is a final notice regarding invoice {invoiceNumber} for {amount}, which was due on {dueDate} and remains overdue.\n{paymentLine}\nPlease make payment in full by {replyByDate}. If I have not received payment by then, I will need to put any further work on hold and consider next steps. If there is an issue with the invoice, please tell me before that date.\n\nRegards,\n{yourName}"
    }
  }
};
