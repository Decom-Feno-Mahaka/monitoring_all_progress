import { Module } from '@nestjs/common';
import { ProjectsGateway } from './projects.gateway';

@Module({
  providers: [ProjectsGateway],
  exports: [ProjectsGateway],
})
export class RealtimeModule {}
