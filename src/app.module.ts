import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppService } from './app.service';
import { RbacModule } from './rbac/rbac.module';

@Module({
  imports: [UsersModule, AuthModule, RbacModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
