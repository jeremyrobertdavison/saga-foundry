
/**
 * Speech utility using the browser's native Web Speech API (speechSynthesis).
 * This provides offline functionality and avoids external API calls for text-to-speech.
 */

export async function speak(text: string): Promise<void> {
  if (!text || !text.trim()) return;

  if (!('speechSynthesis' in window)) {
    console.warn("Speech synthesis is not supported in this browser.");
    return;
  }

  return new Promise((resolve) => {
    // Cancel any currently speaking utterances to avoid queuing
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Function to set the best available voice
    const setVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Try to find a high-quality or specific language voice
      const preferredVoice = 
        voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Natural'))) ||
        voices.find(v => v.lang.startsWith('en')) ||
        voices[0];
      
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    };

    // Chrome/Some browsers load voices asynchronously
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        setVoice();
        window.speechSynthesis.speak(utterance);
      };
    } else {
      setVoice();
      window.speechSynthesis.speak(utterance);
    }

    utterance.onend = () => {
      resolve();
    };

    utterance.onerror = (event) => {
      console.error("SpeechSynthesisUtterance error", event);
      resolve(); // Resolve anyway to unlock UI state
    };
  });
}
