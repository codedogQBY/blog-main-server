import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { AppService } from './app.service';
import { RbacModule } from './rbac/rbac.module';
import { BlogModule } from './blog/blog.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [UsersModule, AuthModule, RbacModule, BlogModule, FilesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
