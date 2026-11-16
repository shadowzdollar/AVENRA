import { createChat } from '@shadcn/helpers/ai-sdk';
import type { UIMessage } from 'ai';

type Tools = {
  scanDocument: {
    input: { documentName: string; type: string };
    output: {
      documentId: string;
      pages: number;
      hash: string;
      extractedFields: Record<string, string | number>;
    };
  };
  evaluateRules: {
    input: { workId: string; targetDoc: string };
    output: {
      checksPassed: number;
      checksFailed: number;
      exceptions: Array<{ rule: string; field: string; message: string }>;
    };
  };
};

/** The message shape for Avenra Work Execution Agent (typed tools, no data parts). */
export type DemoUIMessage = UIMessage<unknown, Record<string, never>, Tools>;

export const demoChat = createChat<DemoUIMessage>()
  .user('Avenra, analyze the uploaded tax intake pack for Northwind Legal and verify line items against the W-2.')
  .sleep(500)
  .assistant(({ writer }) => {
    writer.reasoning(
      'Examining uploaded document bundle. Running high-precision OCR extraction on Form-1040-2025.pdf and matching employer identification numbers and reported income against W-2 statements.'
    );
    writer
      .tool('scanDocument', {
        title: 'Parsing Form-1040-2025.pdf',
        input: { documentName: 'Form-1040-2025.pdf', type: 'TAX_RETURN_US_1040' }
      })
      .sleep(900)
      .output({
        documentId: 'doc_1040_northwind',
        pages: 4,
        hash: 'sha256:8f2a1b9c7e4d...',
        extractedFields: {
          taxYear: '2025',
          ein: '12-9847192',
          wages: 184500,
          scheduleCNet: 42100
        }
      });
    writer.sleep(400);
    writer
      .tool('evaluateRules', {
        title: 'Running Verification Rules',
        input: { workId: 'work_onb_419', targetDoc: 'Form-1040-2025.pdf' }
      })
      .sleep(700)
      .output({
        checksPassed: 5,
        checksFailed: 1,
        exceptions: [
          {
            rule: 'RECONCILE_W2_WITHHOLDING',
            field: 'box12_deferral',
            message: 'Box 12 ($4,200) does not match Schedule C Line 31 deduction.'
          }
        ]
      });
    writer.text(
      'Document bundle processed and verified against IRS guidelines. 5 verification rules passed (TIN verified, digital signatures intact, employer withholding reconciled). '
    );
    writer.text(
      '⚠️ Detected 1 exception: Box 12 deferral ($4,200) does not match Schedule C Line 31. Would you like to dispatch an automated clarification link to the client or override with human approval?'
    );
  })
  .user('Dispatch a one-click magic link to the client requesting clarification on Box 12.')
  .sleep(500)
  .assistant(({ writer }) => {
    writer.reasoning(
      'Generating tokenized client request link per ADR-020. Expiry: 7 days. Setting automated follow-up sequence at 48h and 96h.'
    );
    writer.text(
      '✓ Magic link generated and dispatched to cfo@northwindlegal.com with secure fragment token.\n• Automatic reminder sequence scheduled (+48h, +96h).\n• Work item #ONB-419 transitioned to AWAITING_CLIENT_RESPONSE.'
    );
  });

/** Empty initial transcript — the demo streams as the user presses Send. */
export const initialMessages = demoChat.get(0);

/** Local transport that streams the scripted responses through `useChat`. */
export const chatTransport = demoChat.transport({ delayMs: 30 });

