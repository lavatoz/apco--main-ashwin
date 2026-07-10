interface WhatsAppOptions {
  message: string;
  source?: string;
}

/**
 * Builds a WhatsApp URL with a pre-filled message and optional tracking source.
 * Returns null if VITE_WHATSAPP_NUMBER is not set or empty.
 */
export const buildWhatsAppUrl = (options: WhatsAppOptions): string | null => {
  const whatsappNumber = import.meta.env.VITE_WHATSAPP_NUMBER;
  
  if (!whatsappNumber || whatsappNumber.trim() === '') {
    if (import.meta.env.DEV) {
      console.warn(
        "[WhatsApp Utility] Missing environment variable VITE_WHATSAPP_NUMBER. " +
        "WhatsApp URL cannot be constructed. Please configure VITE_WHATSAPP_NUMBER."
      );
    }
    return null;
  }

  const { message, source } = options;
  let finalMessage = message;
  
  if (source && source.trim() !== '') {
    finalMessage = `${message}\n\nSource: ${source}`;
  }

  return `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(finalMessage)}`;
};

/**
 * Safely opens a pre-filled WhatsApp URL in a new browser tab.
 * Fails gracefully and logs a warning in development if the phone number config is missing.
 */
export const openWhatsApp = (options: WhatsAppOptions): void => {
  const url = buildWhatsAppUrl(options);
  
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer');
  } else {
    if (import.meta.env.DEV) {
      console.error(
        "[WhatsApp Utility] Failed to open WhatsApp tab. VITE_WHATSAPP_NUMBER is missing."
      );
    }
  }
};
