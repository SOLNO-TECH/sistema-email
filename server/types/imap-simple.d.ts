declare module 'imap-simple' {
  export interface ImapSimpleOptions {
    imap: {
      user: string;
      password: string;
      host: string;
      port: number;
      tls?: boolean;
      tlsOptions?: any;
      authTimeout?: number;
      connTimeout?: number;
      keepalive?: any;
    };
  }

  export interface ImapMessage {
    attributes: {
      uid: number;
      flags?: string[];
      date?: Date;
      struct?: any;
    };
    parts: Array<{
      which: string;
      size: number;
      body: string | Buffer;
    }>;
  }

  export interface ImapPart {
    which: string;
    size: number;
    [key: string]: any;
  }

  export interface ImapSimple {
    connect(options: ImapSimpleOptions): Promise<ImapSimple>;
    openBox(boxName: string, readOnly?: boolean): Promise<any>;
    search(criteria: any[], options?: any): Promise<number[]>;
    fetch(source: any, options: any): Promise<ImapMessage[]>;
    getPartData(message: ImapMessage, part: ImapPart): Promise<Buffer>;
    addFlags(uid: number, flags: string[]): Promise<void>;
    delFlags(uid: number, flags: string[]): Promise<void>;
    end(): void;
    on(event: string, callback: Function): void;
  }

  export function getParts(struct: any): ImapPart[];

  const imaps: {
    connect(options: ImapSimpleOptions): Promise<ImapSimple>;
    getParts(struct: any): ImapPart[];
  };

  export default imaps;
}

