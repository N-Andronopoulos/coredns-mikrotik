import { DNSTypes } from './DNSTypes';

export class ZoneUpdateReq {
  public ip: string;
  public name: string;
  public type: DNSTypes = DNSTypes.a;
  public action: ZoneAction;
  public ttl?: number;
  public tag?: string;
}

export enum ZoneAction {
  add = 'add',
  remove = 'remove',
}
