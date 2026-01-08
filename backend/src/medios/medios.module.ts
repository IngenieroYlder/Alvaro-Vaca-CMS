import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MulterModule } from '@nestjs/platform-express';
import { MediosService } from './medios.service';
import { MediosController } from './medios.controller';
import { Medio } from './entities/medio.entity';
import { Carpeta } from './entities/carpeta.entity';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

@Module({
  imports: [
    TypeOrmModule.forFeature([Medio, Carpeta]),
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads', // Carpeta donde se guardan los archivos
        filename: (req, file, cb) => {
          const filename = uuidv4();
          const extension = path.extname(file.originalname);
          cb(null, `${filename}${extension}`);
        },
      }),
    }),
  ],
  controllers: [MediosController],
  providers: [MediosService],
  exports: [MediosService],
})
export class MediosModule {}
