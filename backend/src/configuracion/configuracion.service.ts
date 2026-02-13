import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuracion } from './entities/configuracion.entity';

@Injectable()
export class ConfiguracionService {
  private cacheVersionMemory: string | null = null;

  constructor(
    @InjectRepository(Configuracion)
    private configRepo: Repository<Configuracion>,
  ) {}

  async getCacheVersion(): Promise<string> {
    // Return memory cache if available for performance
    if (this.cacheVersionMemory) {
      return this.cacheVersionMemory;
    }

    let config = await this.configRepo.findOne({ where: { clave: 'CACHE_VERSION' } });

    if (!config) {
      config = this.configRepo.create({
        clave: 'CACHE_VERSION',
        valor: Date.now().toString(),
      });
      await this.configRepo.save(config);
    }

    this.cacheVersionMemory = config.valor;
    return config.valor;
  }

  async updateCacheVersion(): Promise<string> {
    const newVal = Date.now().toString();
    
    let config = await this.configRepo.findOne({ where: { clave: 'CACHE_VERSION' } });
    if (!config) {
      config = this.configRepo.create({ clave: 'CACHE_VERSION', valor: newVal });
    } else {
      config.valor = newVal;
    }
    
    await this.configRepo.save(config);
    this.cacheVersionMemory = newVal;
    return newVal;
  }
}
