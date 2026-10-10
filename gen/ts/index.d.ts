export type ClientId = 'oap' | 'marginalia';
export type Privacy = 'normal' | 'sensitive' | 'private';
export type Sensitive = 'health' | 'job' | 'finance' | 'personal';
export interface Envelope {
  protocol: 2;
  msgId: string;
  clientId: ClientId;
  clientVersion: string;
  libraryId?: string;
  type: string;
  privacy?: Privacy;
  sentAt: number;
  payload: Record<string, unknown>;
}
export interface BuildEnvelopeArgs {
  clientId: ClientId;
  clientVersion: string;
  libraryId?: string;
  type: string;
  payload: Record<string, unknown>;
  privacy?: Privacy;
  msgId?: string;
  sentAt?: number;
}
export interface ValidationError { path: string; message: string }
export interface ValidationResult { ok: boolean; errors: ValidationError[] }
export declare function sha256Hex(input: string): string;
export declare function normalizeUrl(input: string): string;
export declare function urlHash(url: string): string;
export declare function downloadKey(id: string, startTime: string, finalUrl: string): string;
export declare function sourceKey(provider: string, accountKey: string, externalId: string): string;
export declare function buildEnvelope(args: BuildEnvelopeArgs): Envelope;
export declare function validateMessage(schemaFile: string, data: unknown): ValidationResult;
export declare const SCHEMA_FILES: string[];
