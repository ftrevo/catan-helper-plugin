import { Module } from '@nestjs/common'
import { ImageReaderController } from './image-reader.controller'
import { ImageReaderService } from './image-reader.service'
import { PredictorService } from './predictor.service'

@Module({
  controllers: [ImageReaderController],
  providers: [ImageReaderService, PredictorService],
  exports: [ImageReaderService],
})
export class ImageReaderModule {}
