declare module 'mailparser' {
  export interface ParsedMail {
    subject?: string;
    from?: {
      value: Array<{
        address: string;
        name?: string;
      }>;
      text: string;
    };
    to?: {
      value: Array<{
        address: string;
        name?: string;
      }>;
      text: string;
    };
    text?: string;
    html?: string;
    attachments?: Array<{
      filename?: string;
      contentType?: string;
      size?: number;
      content?: Buffer;
      cid?: string;
    }>;
    date?: Date;
    messageId?: string;
    inReplyTo?: string;
    references?: string | string[];
    priority?: string;
  }

  export function simpleParser(source: string | Buffer | NodeJS.ReadableStream): Promise<ParsedMail>;
}

