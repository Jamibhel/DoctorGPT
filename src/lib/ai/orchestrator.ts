import { AIProvider } from "./provider-interface";
import { MockAIProvider } from "./mock-provider";
import { GeminiAIProvider } from "./gemini-provider";

class AIOrchestrator {
  private currentProvider: AIProvider;
  private mockProvider = new MockAIProvider();
  private geminiProvider = new GeminiAIProvider();

  constructor() {
    // If Gemini API key is supplied, use it; otherwise default to Mock
    if (this.geminiProvider.isAvailable) {
      this.currentProvider = this.geminiProvider;
    } else {
      this.currentProvider = this.mockProvider;
    }
  }

  getProvider(): AIProvider {
    return this.currentProvider;
  }

  setProviderType(type: 'mock' | 'gemini', apiKey?: string) {
    if (type === 'gemini') {
      this.geminiProvider = new GeminiAIProvider(apiKey);
      if (this.geminiProvider.isAvailable) {
        this.currentProvider = this.geminiProvider;
      } else {
        this.currentProvider = this.mockProvider;
      }
    } else {
      this.currentProvider = this.mockProvider;
    }
  }

  getProviderName(): string {
    return this.currentProvider.name;
  }
}

export const aiOrchestrator = new AIOrchestrator();
