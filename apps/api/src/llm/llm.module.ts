import { Module } from '@nestjs/common';
import { GroqLLMProvider } from './groq.llm-provider';
import { LLM_PROVIDER } from './llm-provider.interface';
import { LLMService } from './llm.service';

@Module({
  providers: [
    GroqLLMProvider,
    LLMService,
    {
      provide: LLM_PROVIDER,
      useClass: GroqLLMProvider,
    },
  ],
  exports: [LLMService],
})
export class LlmModule {}
