import type { MemberAccessInvitationTokenDigest } from '../domain';

export interface MemberAccessInvitationTokenGenerator {
  generate(): string;
}

export interface MemberAccessInvitationTokenDigester {
  digest(rawToken: string): MemberAccessInvitationTokenDigest;
}
