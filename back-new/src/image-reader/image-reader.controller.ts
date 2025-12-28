import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import { Body, Controller, HttpStatus, Post } from '@nestjs/common'
import { ImageReaderService } from './image-reader.service'
import { ReadImageRequestDto } from './dto/read-image-request.dto'
import { ReadImageResponseDto } from './dto/read-image-response.dto'
import { ZodResponse } from 'nestjs-zod'

@ApiTags('Image Reader')
@Controller('image')
export class ImageReaderController {
  constructor(private readonly imageReaderService: ImageReaderService) {}

  @Post('read')
  @ApiOperation({
    summary: 'Read Catan board from image',
    description:
      'Analyzes an image of a Catan board and returns the resources and numbers on each hexagon using ML prediction.',
  })
  @ZodResponse({
    description: 'Successfully read and analyzed the board image',
    status: HttpStatus.OK,
    type: ReadImageResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request parameters',
  })
  async readImage(@Body() requestDto: ReadImageRequestDto): Promise<ReadImageResponseDto> {
    return this.imageReaderService.readImage(requestDto)
  }
}
