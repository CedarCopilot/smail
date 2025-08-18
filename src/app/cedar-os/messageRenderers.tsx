import {
  MessageRenderer,
  CustomMessage,
  MastraStreamedResponse,
  ActionMessageFor,
  Message,
} from 'cedar-os';

type SearchPersonToolResultPayload = {
  toolCallId: string;
  toolName: string;
  result: {
    name: string;
    role: string;
    emailStyleSummary: string;
    notes: string[];
  };
};

type CheckCalendarToolResultPayload = {
  toolCallId: string;
  toolName: string;
  result: {
    availableTimes: string[];
  };
};

type CustomToolMessage = CustomMessage<
  'tool-result',
  MastraStreamedResponse & {
    type: 'tool-result';
    payload: SearchPersonToolResultPayload | CheckCalendarToolResultPayload;
  }
>;

type PersonResult = SearchPersonToolResultPayload['result'];
type CalendarResult = CheckCalendarToolResultPayload['result'];

function isCalendarResult(
  result: PersonResult | CalendarResult | undefined,
): result is CalendarResult {
  return !!result && Array.isArray((result as CalendarResult).availableTimes);
}

function isPersonResult(result: PersonResult | CalendarResult | undefined): result is PersonResult {
  return !!result && typeof (result as PersonResult).emailStyleSummary === 'string';
}

export const toolResultMessageRenderer: MessageRenderer<CustomToolMessage> = {
  type: 'tool-result',
  render: (message) => {
    const toolPayload = (message as CustomToolMessage).payload;
    const toolName: string | undefined = (toolPayload as SearchPersonToolResultPayload)?.toolName;
    const result = (toolPayload as SearchPersonToolResultPayload)?.result;

    console.log('message', result);
    if (isCalendarResult(result)) {
      // Calendar tool result
      return (
        <div className="text-sm space-y-2">
          <div className="font-medium">Available times</div>
          <ul className="list-disc pl-5 space-y-1">
            {result.availableTimes.map((t: string, idx: number) => (
              <li key={idx}>{t}</li>
            ))}
          </ul>
          {toolName && <div className="text-xs text-gray-500">Source: {toolName}</div>}
        </div>
      );
    }

    if (isPersonResult(result)) {
      // Person search tool result
      return (
        <div className="text-sm space-y-2">
          {result.name && (
            <div>
              <span className="font-medium">Name: </span>
              <span>{result.name}</span>
            </div>
          )}
          {result.role && (
            <div>
              <span className="font-medium">Role: </span>
              <span>{result.role}</span>
            </div>
          )}
          {result.emailStyleSummary && (
            <div>
              <span className="font-medium">Email style: </span>
              <span>{result.emailStyleSummary}</span>
            </div>
          )}
          {Array.isArray(result.notes) && result.notes.length > 0 && (
            <div>
              <div className="font-medium mb-1">Notes</div>
              <ul className="list-disc pl-5 space-y-1">
                {result.notes.map((n: string, idx: number) => (
                  <li key={idx}>{n}</li>
                ))}
              </ul>
            </div>
          )}
          {toolName && <div className="text-xs text-gray-500">Source: {toolName}</div>}
        </div>
      );
    }

    // Fallback: show raw content/payload
    return (
      <div className="text-sm">
        <pre className="whitespace-pre-wrap">
          {typeof message.content === 'string'
            ? message.content
            : JSON.stringify(message.payload, null, 2)}
        </pre>
      </div>
    );
  },
};

export type ActionResultMessage = ActionMessageFor<'emailDraft', 'draftReply', [string]>;

export const actionResultMessageRenderer: MessageRenderer<ActionResultMessage> = {
  type: 'action',
  render: (message) => {
    return <div>Drafted email: {message.args[0]}</div>;
  },
};

export const messageRenderers = [
  toolResultMessageRenderer,
  actionResultMessageRenderer,
] as MessageRenderer<Message>[];
