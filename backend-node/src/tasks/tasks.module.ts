import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { ReceiptsModule } from '../receipts/receipts.module';
import { LogCleanupTask } from './log-cleanup.task';


@Module({
  imports: [
    ReceiptsModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, LogCleanupTask],
  exports: [TasksService],
})
export class TasksModule {}
