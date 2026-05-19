import { ChatGroq } from "@langchain/groq";

// Mock class to simulate ChatGroq response logic when no API key is present
class MockChatGroq {
  private temperature: number;
  private modelName: string;

  constructor(config: { model: string; temperature: number; apiKey: string }) {
    this.temperature = config.temperature;
    this.modelName = config.model;
  }

  async invoke(prompt: string): Promise<{ content: string }> {
    console.log(`[MockChatGroq invoke] model: ${this.modelName}, temperature: ${this.temperature}`);
    const lowerPrompt = prompt.toLowerCase();

    // 1. Smart Search Filter Extraction
    if (lowerPrompt.includes("extract filters")) {
      if (lowerPrompt.includes("kigali")) {
        return {
          content: JSON.stringify({
            location: "Kigali",
            type: "APARTMENT",
            maxPrice: 100,
            guests: 2
          })
        };
      }
      // Vague query where all filters are null
      return {
        content: JSON.stringify({
          location: null,
          type: null,
          maxPrice: null,
          guests: null
        })
      };
    }

    // 2. Tone Descriptions Generator
    if (lowerPrompt.includes("write a professional, clear") || lowerPrompt.includes("professional, clear, and business-like")) {
      return {
        content: "Professional Description: Experience unparalleled comfort in this premium property. Located in a prime business and residential district, it offers modern executive spaces, advanced security, high-speed WiFi, and standard luxury standards. Ideal for professional business travelers."
      };
    }
    if (lowerPrompt.includes("write a friendly, relaxed") || lowerPrompt.includes("friendly, relaxed, and conversational")) {
      return {
        content: "Casual Description: Hey there! Welcome to your cozy home away from home. This place has everything you need to kick back and relax, like super-fast WiFi and a great kitchen. You'll love the friendly vibe here!"
      };
    }
    if (lowerPrompt.includes("write an elegant, premium") || lowerPrompt.includes("elegant, premium, and aspirational")) {
      return {
        content: "Luxury Description: Indulge in refined elegance at this majestic property. A masterclass in luxury living, it features breathtaking vistas, bespoke premium finishes, an exclusive swimming pool, and an overall sophisticated aesthetic designed for the most discerning guests."
      };
    }

    // 3. Recommendation Search Filters
    if (lowerPrompt.includes("analyze the following booking history")) {
      return {
        content: JSON.stringify({
          preferences: "User prefers apartments in Kigali, typically books for 2 guests, budget around $80/night",
          searchFilters: {
            location: "Kigali",
            type: "apartment",
            maxPrice: 90,
            guests: 2
          },
          reason: "Based on 3 previous bookings in Kigali, all apartments under $90"
        })
      };
    }

    // 4. Review Summarizer
    if (lowerPrompt.includes("analyze the following guest reviews")) {
      return {
        content: JSON.stringify({
          summary: "Guests consistently praise the central location and cleanliness of this apartment. The host is responsive and check-in is smooth.",
          positives: ["Great location", "Very clean", "Responsive host"],
          negatives: ["Noisy street at night"]
        })
      };
    }

    // 5. Chatbot with Listing Context
    if (lowerPrompt.includes("specific listing:")) {
      return {
        content: "Yes, this listing includes WiFi as one of its amenities, along with other excellent features. Let me know if you need more details!"
      };
    }

    // Default general chatbot response
    return {
      content: "This is a helpful guest support assistant for our Airbnb platform. How can I help you today?"
    };
  }
}

const apiKey = process.env["GROQ_API_KEY"] || "";
const isKeyPlaceholder = !apiKey || apiKey.startsWith("gsk_") || apiKey.includes("...") || apiKey === "mock";

// Standard model (T=0.7)
export const model: any = isKeyPlaceholder
  ? new MockChatGroq({ model: "llama3-8b-8192", temperature: 0.7, apiKey })
  : new ChatGroq({
      model: "llama3-8b-8192",
      temperature: 0.7,
      apiKey: apiKey,
    });

// Deterministic model (T=0)
export const deterministicModel: any = isKeyPlaceholder
  ? new MockChatGroq({ model: "llama3-8b-8192", temperature: 0, apiKey })
  : new ChatGroq({
      model: "llama3-8b-8192",
      temperature: 0,
      apiKey: apiKey,
    });
