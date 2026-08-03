/**
 * API client barrel — 도메인은 `@/lib/users` 등으로도 import 가능.
 * 기존 `@/lib/api` import 호환 유지.
 */
export * from './auth';
export * from './friends';
export * from './recommendations';
export * from './savedCards';
export * from './savedLyrics';
export * from './support';
export * from './users';

export type { WithdrawResult } from './apiTypes';
