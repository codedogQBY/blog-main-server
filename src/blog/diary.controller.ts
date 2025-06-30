import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DiaryService } from './diary.service';
import {
  CreateDiaryNoteDto,
  UpdateDiaryNoteDto,
  GetDiaryNotesDto,
  CreateDiarySignatureDto,
  UpdateDiarySignatureDto,
  CreateDiaryWeatherConfigDto,
  UpdateDiaryWeatherConfigDto,
} from './dto/diary.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { Permissions } from '../common/permissions.decorator';

@Controller('diary')
export class DiaryController {
  constructor(private readonly diaryService: DiaryService) {}

  // ======= 随记管理 - 公开接口 =======
  @Public()
  @Get('notes')
  findAllNotes(@Query() query: GetDiaryNotesDto) {
    return this.diaryService.findAllNotes(query);
  }

  @Public()
  @Get('notes/:id')
  findOneNote(@Param('id') id: string) {
    return this.diaryService.findOneNote(id);
  }

  @Public()
  @Get('stats')
  getStats() {
    return this.diaryService.getStats();
  }

  @Public()
  @Get('signature')
  getActiveSignature() {
    return this.diaryService.getActiveSignature();
  }

  @Public()
  @Get('weather-configs')
  getWeatherConfigs() {
    return this.diaryService.getWeatherConfigs();
  }

  // ======= 随记管理 - 管理员接口 =======
  @UseGuards(JwtAuthGuard)
  @Permissions('diary:create')
  @Post('admin/notes')
  createNote(@Body() createDiaryNoteDto: CreateDiaryNoteDto) {
    return this.diaryService.createNote(createDiaryNoteDto);
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('diary:admin_list')
  @Get('admin/notes')
  findAllNotesForAdmin(@Query() query: GetDiaryNotesDto) {
    return this.diaryService.findAllNotesForAdmin(query);
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('diary:admin_stats')
  @Get('admin/stats')
  getAdminStats() {
    return this.diaryService.getAdminStats();
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('diary:update')
  @Patch('admin/notes/:id')
  updateNote(@Param('id') id: string, @Body() updateDiaryNoteDto: UpdateDiaryNoteDto) {
    return this.diaryService.updateNote(id, updateDiaryNoteDto);
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('diary:delete')
  @Delete('admin/notes/:id')
  removeNote(@Param('id') id: string) {
    return this.diaryService.removeNote(id);
  }

  // ======= 签名管理 =======
  @UseGuards(JwtAuthGuard)
  @Permissions('diary:signature_list')
  @Get('admin/signatures')
  getSignatures() {
    return this.diaryService.getSignatures();
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('diary:signature_create')
  @Post('admin/signatures')
  createSignature(@Body() createSignatureDto: CreateDiarySignatureDto) {
    return this.diaryService.createSignature(createSignatureDto);
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('diary:signature_update')
  @Patch('admin/signatures/:id')
  updateSignature(
    @Param('id') id: string,
    @Body() updateSignatureDto: UpdateDiarySignatureDto,
  ) {
    return this.diaryService.updateSignature(id, updateSignatureDto);
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('diary:signature_delete')
  @Delete('admin/signatures/:id')
  removeSignature(@Param('id') id: string) {
    return this.diaryService.removeSignature(id);
  }

  // ======= 天气配置管理 =======
  @UseGuards(JwtAuthGuard)
  @Permissions('diary:weather_list')
  @Get('admin/weather-configs')
  getAllWeatherConfigs() {
    return this.diaryService.getAllWeatherConfigs();
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('diary:weather_create')
  @Post('admin/weather-configs')
  createWeatherConfig(@Body() createWeatherDto: CreateDiaryWeatherConfigDto) {
    return this.diaryService.createWeatherConfig(createWeatherDto);
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('diary:weather_update')
  @Patch('admin/weather-configs/:id')
  updateWeatherConfig(
    @Param('id') id: string,
    @Body() updateWeatherDto: UpdateDiaryWeatherConfigDto,
  ) {
    return this.diaryService.updateWeatherConfig(id, updateWeatherDto);
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('diary:weather_delete')
  @Delete('admin/weather-configs/:id')
  removeWeatherConfig(@Param('id') id: string) {
    return this.diaryService.removeWeatherConfig(id);
  }
} 