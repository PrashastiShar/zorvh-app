// src/user/user.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { User } from './user.entity'; // Import the User entity
import { UserService } from './user.service'; 
import { UserResolver } from './user.resolver';

// We will add UserService and UserResolver here later
// import { UserService } from './user.service';
// import { UserResolver } from './user.resolver';


@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // Register the User entity for this module
  ],
  providers: [UserService,UserResolver], 
  exports: [UserService],
})
export class UserModule {}