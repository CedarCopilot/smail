// ---------------------------------------------
// Workflows are a Mastra primitive to orchestrate agents and complex sequences of tasks
// Docs: https://mastra.ai/en/docs/workflows/overview
// ---------------------------------------------

import { createWorkflow, createStep } from '@mastra/core/workflows';
import { z } from 'zod';
import { productRoadmapAgent } from '../agents/productRoadmapAgent';
import { streamJSONEvent } from '../../utils/streamUtils';
import { ExecuteFunctionResponseSchema, ActionResponseSchema } from './chatWorkflowTypes';

export const ChatInputSchema = z.object({
  prompt: z.string(),
  temperature: z.number().optional(),
  maxTokens: z.number().optional(),
  systemPrompt: z.string().optional(),
  streamController: z.any().optional(),
  // For structured output
  output: z.any().optional(),
});

export const ChatOutputSchema = z.object({
  content: z.string(),
  object: ActionResponseSchema.optional(),
  usage: z.any().optional(),
});

export type ChatOutput = z.infer<typeof ChatOutputSchema>;

// 1. fetchContext – passthrough (placeholder)
const fetchContext = createStep({
  id: 'fetchContext',
  description: 'Placeholder step – you might want to fetch some information for your agent here',
  inputSchema: ChatInputSchema,
  outputSchema: ChatInputSchema.extend({
    context: z.any().optional(),
  }),
  execute: async ({ inputData }) => {
    console.log('Chat workflow received input data', inputData);
    // [STEP 5] (Backend): If the user adds a node via @mention then sends a message, the agent will receive it here in the user prompt field.
    // [STEP 6] (Backend): If you call the subscribeInputContext hook on the frontend, the agent will receive that state as context, formatted in the way you specified.
    const frontendContext = inputData.prompt;

    // Merge, filter, or modify the frontend context as needed
    const unifiedContext = frontendContext;

    const result = { ...inputData, prompt: unifiedContext };

    return result;
  },
});

// 2. buildAgentContext – build message array
const buildAgentContext = createStep({
  id: 'buildAgentContext',
  description: 'Combine fetched information and build LLM messages',
  inputSchema: fetchContext.outputSchema,
  outputSchema: ChatInputSchema.extend({
    messages: z.array(
      z.object({
        role: z.enum(['system', 'user', 'assistant']),
        content: z.string(),
      }),
    ),
  }),
  execute: async ({ inputData }) => {
    const { prompt, temperature, maxTokens, streamController } = inputData;

    const messages = [{ role: 'user' as const, content: prompt }];

    const result = { ...inputData, messages, temperature, maxTokens, streamController };

    return result;
  },
});

// 3. callAgent – invoke chatAgent
const callAgent = createStep({
  id: 'callAgent',
  description: 'Invoke the chat agent with options',
  inputSchema: buildAgentContext.outputSchema,
  outputSchema: ChatOutputSchema,
  execute: async ({ inputData }) => {
    const { messages, temperature, maxTokens, streamController, systemPrompt } = inputData;

    if (streamController) {
      streamJSONEvent(streamController, {
        type: 'stage_update',
        status: 'update_begin',
        message: 'Generating response...',
      });
    }

    const response = await productRoadmapAgent.generate(messages, {
      // If system prompt is provided, overwrite the default system prompt for this agent
      ...(systemPrompt ? ({ instructions: systemPrompt } as const) : {}),
      temperature,
      maxTokens,
      experimental_output: ExecuteFunctionResponseSchema,
    });

    // `response.object` is guaranteed to match ExecuteFunctionResponseSchema
    const { content, action } = response.object ?? {
      content: response.text,
    };

    const result: ChatOutput = {
      content,
      object: action,
      usage: response.usage,
    };

    console.log('Chat workflow result', result);
    if (streamController) {
      streamJSONEvent(streamController, result);
    }

    if (streamController) {
      streamJSONEvent(streamController, {
        type: 'stage_update',
        status: 'update_complete',
        message: 'Response generated',
      });
    }

    return result;
  },
});

export const chatWorkflow = createWorkflow({
  id: 'chatWorkflow',
  description:
    'Chat workflow that replicates the old /chat/execute-function endpoint behaviour with optional streaming',
  inputSchema: ChatInputSchema,
  outputSchema: ChatOutputSchema,
})
  .then(fetchContext)
  .then(buildAgentContext)
  .then(callAgent)
  .commit();
