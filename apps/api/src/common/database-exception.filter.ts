import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { getMessages } from '@family-os/shared';
import { Prisma } from '@prisma/client';
import { Response } from 'express';
import { env } from '../config/env';

@Catch()
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);
  private readonly messages = getMessages(env.LOCALE);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      response.status(status).json(
        typeof body === 'string' ? { statusCode: status, message: body } : body,
      );
      return;
    }

    if (this.isPrismaError(exception)) {
      this.logger.error('Database error', exception instanceof Error ? exception.stack : exception);
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: this.messages.databaseError(),
      });
      return;
    }

    if (exception instanceof Error) {
      this.logger.error('Unhandled error', exception.stack);
    } else {
      this.logger.error('Unhandled error', exception);
    }

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: this.messages.unexpectedError(),
    });
  }

  private isPrismaError(exception: unknown): boolean {
    return (
      exception instanceof Prisma.PrismaClientKnownRequestError ||
      exception instanceof Prisma.PrismaClientUnknownRequestError ||
      exception instanceof Prisma.PrismaClientRustPanicError ||
      exception instanceof Prisma.PrismaClientInitializationError ||
      exception instanceof Prisma.PrismaClientValidationError
    );
  }
}
