declare module 'pg' {
  export class Pool {
    constructor(config?: {
      connectionString?: string;
      max?: number;
      idleTimeoutMillis?: number;
      connectionTimeoutMillis?: number;
    });
    query(text: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }>;
    connect(): Promise<any>;
    end(): Promise<void>;
  }
}