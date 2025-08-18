import { registerApiRoute } from '@mastra/core/server';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { createSSEStream, streamJSONEvent } from '../utils/streamUtils';
import { OpenAIVoice } from '@mastra/voice-openai';
import { Readable } from 'stream';
import { emailWorkflow, ChatInputSchema, ChatOutput } from './workflows/emailWorkflow';
// Note: Context type will be inferred from parameter usage

// Shared voice provider instance
const voiceProvider = new OpenAIVoice({
  speechModel: { apiKey: process.env.OPENAI_API_KEY!, name: 'tts-1' },
  listeningModel: { apiKey: process.env.OPENAI_API_KEY!, name: 'whisper-1' },
});

// Helper function to convert Zod schema to OpenAPI schema
function toOpenApiSchema(schema: Parameters<typeof zodToJsonSchema>[0]) {
  return zodToJsonSchema(schema) as Record<string, unknown>;
}

// Register API routes to reach your Mastra server
export const apiRoutes = [
  registerApiRoute('/chat', {
    method: 'POST',
    openapi: {
      requestBody: {
        content: {
          'application/json': {
            schema: toOpenApiSchema(ChatInputSchema),
          },
        },
      },
    },
    handler: async (c) => {
      try {
        const body = await c.req.json();
        const {
          prompt,
          temperature,
          maxTokens,
          systemPrompt,
          resourceId,
          threadId,
          additionalContext,
        } = ChatInputSchema.parse(body);

        const run = await emailWorkflow.createRunAsync();
        const result = await run.start({
          inputData: {
            prompt,
            temperature,
            maxTokens,
            systemPrompt,
            resourceId,
            threadId,
            additionalContext,
          },
        });

        if (result.status === 'success') {
          // Simply forward the workflow response to the frontend
          console.log('Sending response', JSON.stringify(result.result, null, 2));
          return c.json<ChatOutput>(result.result);
        }
      } catch (error) {
        console.error(error);
        return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500);
      }
    },
  }),
  // Voice transcription to chat workflow (non-streaming)
  registerApiRoute('/voice', {
    method: 'POST',
    handler: async (c) => {
      try {
        const form = await c.req.formData();
        const audioFile = form.get('audio') as File;
        const additionalContext = form.get('context') as string | null;
        if (!audioFile) return c.json({ error: 'audio required' }, 400);

        const buf = Buffer.from(await audioFile.arrayBuffer());
        const transcription = await voiceProvider.listen(Readable.from(buf), { filetype: 'webm' });

        const prompt = additionalContext
          ? `${transcription}\n\nAdditional context: ${additionalContext}`
          : transcription;

        const run = await emailWorkflow.createRunAsync();
        const result = await run.start({
          inputData: { prompt },
        });

        if (result.status === 'success') {
          // Generate audio from the workflow response text
          const responseText = result.result.content;
          const speechStream = await voiceProvider.speak(responseText, {
            voice: 'alloy', // Default voice
            speed: 1.0,
          });

          // Convert stream to buffer for response
          const chunks: Buffer[] = [];
          for await (const chunk of speechStream) {
            chunks.push(Buffer.from(chunk));
          }
          const audioResponse = Buffer.concat(chunks);

          // Return response with audio data
          return c.json({
            transcription,
            text: responseText,
            usage: result.result.usage,
            object: result.result.object,
            audioData: audioResponse.toString('base64'),
            audioFormat: 'audio/mpeg',
          });
        }
        throw new Error(`Workflow failed: ${result.status}`);
      } catch (error) {
        console.error(error);
        return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500);
      }
    },
  }),
  registerApiRoute('/chat/stream', {
    method: 'POST',
    openapi: {
      requestBody: {
        content: {
          'application/json': {
            schema: toOpenApiSchema(ChatInputSchema),
          },
        },
      },
    },
    handler: async (c) => {
      try {
        console.log('=== chat/stream API route called ===');
        const body = await c.req.json();
        const {
          prompt,
          temperature,
          maxTokens,
          systemPrompt,
          resourceId,
          threadId,
          additionalContext,
        } = ChatInputSchema.parse(body);

        return createSSEStream(async (controller) => {
          const run = await emailWorkflow.createRunAsync();
          const result = await run.start({
            inputData: {
              prompt,
              temperature,
              maxTokens,
              systemPrompt,
              additionalContext,
              streamController: controller,
              resourceId,
              threadId,
            },
          });

          if (result.status !== 'success') {
            throw new Error(`Workflow failed: ${result.status}`);
          }
        });
      } catch (error) {
        console.error(error);
        return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500);
      }
    },
  }),
  // Voice transcription to chat workflow (streaming)
  registerApiRoute('/voice/stream', {
    method: 'POST',
    handler: async (c) => {
      try {
        const form = await c.req.formData();
        const audioFile = form.get('audio') as File;
        const additionalContext = form.get('additionalContext') as string | null;
        if (!audioFile) return c.json({ error: 'audio required' }, 400);

        const buf = Buffer.from(await audioFile.arrayBuffer());
        const transcription = await voiceProvider.listen(Readable.from(buf), { filetype: 'webm' });

        return createSSEStream(async (controller) => {
          // Emit the transcription at the beginning of the stream
          streamJSONEvent(controller, {
            type: 'transcription',
            transcription,
          });

          const prompt = additionalContext
            ? `${transcription}\n\nAdditional context: ${additionalContext}`
            : transcription;

          const run = await emailWorkflow.createRunAsync();
          const result = await run.start({
            inputData: { prompt, streamController: controller },
          });
          if (result.status !== 'success') {
            throw new Error(`Workflow failed: ${result.status}`);
          }
        });
      } catch (error) {
        console.error(error);
        return c.json({ error: error instanceof Error ? error.message : 'Internal error' }, 500);
      }
    },
  }),
];
