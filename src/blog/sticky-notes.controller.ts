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
import { StickyNotesService } from './sticky-notes.service';
import { CreateStickyNoteDto, UpdateStickyNoteDto, GetStickyNotesDto } from './dto/sticky-note.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../auth/public.decorator';
import { Permissions } from '../common/permissions.decorator';

@Controller('sticky-notes')
export class StickyNotesController {
  constructor(private readonly stickyNotesService: StickyNotesService) {}

  @Public()
  @Post()
  create(@Body() createStickyNoteDto: CreateStickyNoteDto) {
    return this.stickyNotesService.create(createStickyNoteDto);
  }

  @Public()
  @Get()
  findAll(@Query() query: GetStickyNotesDto) {
    return this.stickyNotesService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('sticky_note:admin_list')
  @Get('admin/list')
  findAllForAdmin(@Query() query: GetStickyNotesDto) {
    return this.stickyNotesService.findAllForAdmin(query);
  }

  @Public()
  @Get('categories')
  getCategories() {
    return this.stickyNotesService.getCategories();
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('sticky_note:stats')
  @Get('stats')
  getStats() {
    return this.stickyNotesService.getStats();
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('sticky_note:admin_stats')
  @Get('admin/stats')
  getAdminStats() {
    return this.stickyNotesService.getAdminStats();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stickyNotesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('sticky_note:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateStickyNoteDto: UpdateStickyNoteDto) {
    return this.stickyNotesService.update(id, updateStickyNoteDto);
  }

  @UseGuards(JwtAuthGuard)
  @Permissions('sticky_note:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.stickyNotesService.remove(id);
  }
} 