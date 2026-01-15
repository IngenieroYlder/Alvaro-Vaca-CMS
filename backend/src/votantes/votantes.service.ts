import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Votante } from './entities/votante.entity';
import { CreateVotanteDto } from './dto/create-votante.dto';
import { UpdateVotanteDto } from './dto/update-votante.dto';

@Injectable()
export class VotantesService {
  constructor(
    @InjectRepository(Votante)
    private votantesRepository: Repository<Votante>,
  ) {}

  async create(createVotanteDto: CreateVotanteDto, liderId: string) {
    const votante = this.votantesRepository.create({
      ...createVotanteDto,
      liderId,
    });
    return this.votantesRepository.save(votante);
  }

  async findAll(liderId: string) {
    return this.votantesRepository.find({
      where: { liderId },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: string, liderId: string) {
    const votante = await this.votantesRepository.findOne({
      where: { id, liderId },
    });
    if (!votante) throw new NotFoundException('Votante no encontrado');
    return votante;
  }

  async update(id: string, updateVotanteDto: UpdateVotanteDto, liderId: string) {
    const votante = await this.findOne(id, liderId);
    Object.assign(votante, updateVotanteDto);
    return this.votantesRepository.save(votante);
  }

  async remove(id: string, liderId: string) {
    const votante = await this.findOne(id, liderId);
    return this.votantesRepository.remove(votante);
  }

  async importFromAttendees(attendeeIds: string[], liderId: string, asistentesRepository: Repository<any>) {
      // Find attendees by IDs (and ensure they belong to meetings of this leader if we want strict check, but usually ID check is enough if valid)
      // Since Asistente entity is in another module, we might need to inject it or handle it in controller/service differently. 
      // For now assuming we have access to them or pass the data.
      
      // Better approach: In module, import ReunionesModule or TypeOrm for Asistente
      // But to avoid circular deps, let's just query Asistentes here if imported.
      
      // Wait, I need to inject Asistente repository here.
      // I will update module definition to import TypeOrmModule.forFeature([Votante, Asistente])
      
      const asistentes = await asistentesRepository.findByIds(attendeeIds);
      
      const createdVtc = [];
      for (const asistente of asistentes) {
          // Check if already exists? (Maybe by documento)
          const exists = await this.votantesRepository.findOne({ where: { documento: asistente.documento, liderId }});
          
          if (!exists) {
              const newVotante = this.votantesRepository.create({
                  nombre: asistente.nombre,
                  apellido: asistente.apellido,
                  documento: asistente.documento,
                  telefono: asistente.telefono,
                  direccion: asistente.direccion || '',
                  // Need to get Dept/Muni from somewhere. Asistente might not have it directly on entity? 
                  // Wait, Asistente does NOT have dept/muni on entity, only on Reunion?
                  // Let's check Asistente entity again.
                  // It has no dept/muni. It has relationships? No, just Reunion.
                  // So we take it from Reunion? Yes.
                  departamento: asistente.reunion?.departamento || 'Meta',
                  municipio: asistente.reunion?.municipio || 'Villavicencio',
                  liderId: liderId
              });
              createdVtc.push(await this.votantesRepository.save(newVotante));
          }
      }
      return createdVtc;
  }
}
