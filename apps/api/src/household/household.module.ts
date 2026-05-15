import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { HouseholdService } from './household.service';
import { PersonService } from './person.service';

@Module({
  imports: [DatabaseModule],
  providers: [HouseholdService, PersonService],
  exports: [HouseholdService, PersonService],
})
export class HouseholdModule {}
