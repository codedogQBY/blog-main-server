import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppService } from './app.service';
import { RbacModule } from './rbac/rbac.module';
import { BlogModule } from './blog/blog.module';
import { FilesModule } from './files/files.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [UsersModule, AuthModule, RbacModule, BlogModule, FilesModule],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
