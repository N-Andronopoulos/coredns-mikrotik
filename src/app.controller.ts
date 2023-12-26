import { Body, Controller, Get, Logger, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { type DNSZone } from 'dns-zonefile';
import fs from 'fs';
import path from 'path';
import { ZoneUpdateReq } from './dtos/zoneUpdateReq';
import { DNSTypes } from './dtos/DNSTypes';
import { ApiKeyGuard } from './api-key.guard';

@UseGuards(ApiKeyGuard)
@Controller('zones')
export class AppController {
  private readonly logger = new Logger(AppController.name);
  private static ZONE_DIR = process.env.ZONE_DIR || path.join(__dirname, '../samples/');
  private zoneParse!: (zoneFile: string) => DNSZone;
  private zoneGenerate!: (dnsZone: DNSZone) => string;

  constructor() {
    // Hack because this is an ES module
    import('dns-zonefile').then(m => {
      this.zoneParse = m.default.parse;
      this.zoneGenerate = m.default.generate;
    });
  }

  @Get()
  public getAllZones(): DNSZone[] {
    this.logger.log('Get ALL request');
    return this.getDNSZones();
  }

  @Get(':zoneName')
  public getZone(@Param('zoneName') zoneName: string): DNSZone {
    this.logger.log(`Get ${zoneName} request`);
    return this.getDNSZone(zoneName);
  }

  @Post(':zoneName')
  public updateZone(
    @Param('zoneName') zoneName: string,
    @Body() req: ZoneUpdateReq,
  ): void {
    this.logger.log(`Updating on zone: ${zoneName} ${req.action} ${req.type}:${req.name} to ${req.ip} for ${req.ttl | -1} sec`);
    const zoneData = this.getDNSZone(zoneName);
    switch (req.type) {
      case DNSTypes.aaaa:
      case DNSTypes.a: {
        const records = zoneData.a;
        if (req.action === 'remove') {
          const find = records.find(r => r.ip === req.ip);
          if (!find) {
            throw new NotFoundException(`Record with ip ${req.ip} not found!`);
          }
          records.splice(records.indexOf(find), 1);
        } else {
          records.push({
            name: req.name,
            ip: req.ip,
            ttl: req.ttl,
          });
        }
        this.updateDNSZone(zoneName, zoneData);
      }
    }
  }

  /**
   * Gets all the zone files from the directory.
   * @private
   */
  private getDNSZones(): DNSZone[] {
    return fs.readdirSync(AppController.ZONE_DIR)
      .filter(file => /.*\.db$/g.test(file))
      .map(file => fs.readFileSync(path.join(AppController.ZONE_DIR, file), { encoding: 'utf-8' }))
      .map(contents => this.zoneParse(contents));
  }

  /**
   * Reads the specified zone file.
   * @param zone The file name of the zone file (without .db).
   * @private
   */
  private getDNSZone(zone: string): DNSZone {
    const zoneFilePath = path.join(AppController.ZONE_DIR, zone + '.db');
    const contents = fs.readFileSync(zoneFilePath, { encoding: 'utf-8' });
    return this.zoneParse(contents);
  }

  /**
   * Update the .db file of this zone
   * @param zone The file name (without .db).
   * @param data The {@link DNSZone}.
   * @private
   */
  private updateDNSZone(zone: string, data: DNSZone): void {
    data.soa.serial += 1;
    const contents = this.zoneGenerate(data);
    const zoneFilePath = path.join(AppController.ZONE_DIR, zone + '.db');
    fs.writeFileSync(zoneFilePath, contents, { encoding: 'utf-8' });
  }
}
