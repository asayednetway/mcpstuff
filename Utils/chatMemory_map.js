export function formatChatMemory(message) {
  if (!message) return '';
  // If already an array of messages with type/text
  if (Array.isArray(message)) {
    return message.map((m, i) => {
      if (m.type === 'human') return `Human: ${m.text}`;
      if (m.type === 'ai') return `AI: ${m.text}`;
      return m.text;
    }).join('\n');
  } else {
    // Single message object
    return JSON.stringify({ type: 'ai', text: message });
  }
}
