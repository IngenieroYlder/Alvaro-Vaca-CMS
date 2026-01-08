import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rol } from './entities/rol.entity';
import { CrearRolDto, ActualizarRolDto } from './dto/rol.dto';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(
    @InjectRepository(Rol)
    private rolRepository: Repository<Rol>,
  ) {}

  async create(crearRolDto: CrearRolDto) {
    const rol = this.rolRepository.create(crearRolDto);
    return await this.rolRepository.save(rol);
  }

  async findAll() {
    return await this.rolRepository.find();
  }

  async findOne(id: string) {
    return await this.rolRepository.findOne({ where: { id } });
  }

  async findByName(nombre: string) {
    return await this.rolRepository.findOne({ where: { nombre } });
  }

  async update(id: string, actualizarRolDto: ActualizarRolDto) {
    const rol = await this.findOne(id);
    if (!rol) throw new Error('Role not found');
    const updated = Object.assign(rol, actualizarRolDto);
    return await this.rolRepository.save(updated);
  }

  async remove(id: string) {
    return await this.rolRepository.delete(id);
  }

  async onModuleInit() {
    // Seed Default Roles
    const roles = [
      {
        nombre: 'admin',
        permisos: [
          'dashboard',
          'catalogo',
          'medios',
          'usuarios',
          'roles',
          'temas',
          'negocio',
          'paginas',
          'contactos',
          'menus',
          'configuracion',
        ],
        icono: 'Crown',
      },
      { nombre: 'usuario', permisos: ['dashboard', 'catalogo'], icono: 'User' },
    ];

    for (const r of roles) {
      const exists = await this.findByName(r.nombre);
      if (!exists) {
        console.log(`Seeding role: ${r.nombre}`);
        await this.rolRepository.save(this.rolRepository.create(r));
      }
    }
  }
}
