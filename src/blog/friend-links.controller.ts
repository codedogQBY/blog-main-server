import { Controller, Get, Post, Body, Put, Param, Delete, Query, ParseIntPipe } from '@nestjs/common'
import { FriendLinksService } from './friend-links.service'
import { CreateFriendLinkDto, UpdateFriendLinkDto } from './dto/friend-link.dto'
import { Permissions } from '../common/permissions.decorator'

@Controller('friend-links/admin')
@Permissions('friend_link')
export class FriendLinksController {
  constructor(private readonly friendLinksService: FriendLinksService) {}

  @Post()
  @Permissions('friend_link.create')
  create(@Body() createFriendLinkDto: CreateFriendLinkDto) {
    return this.friendLinksService.create(createFriendLinkDto)
  }

  @Get()
  @Permissions('friend_link.read')
  findAll(
    @Query('page', ParseIntPipe) page: number,
    @Query('pageSize', ParseIntPipe) pageSize: number,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.friendLinksService.findAll({
      skip: (page - 1) * pageSize,
      take: pageSize,
      status: status ? parseInt(status) : undefined,
      search
    })
  }

  @Get(':id')
  @Permissions('friend_link.read')
  findOne(@Param('id') id: string) {
    return this.friendLinksService.findOne(id)
  }

  @Put(':id')
  @Permissions('friend_link.update')
  update(
    @Param('id') id: string,
    @Body() updateFriendLinkDto: UpdateFriendLinkDto
  ) {
    return this.friendLinksService.update(id, updateFriendLinkDto)
  }

  @Delete(':id')
  @Permissions('friend_link.delete')
  remove(@Param('id') id: string) {
    return this.friendLinksService.remove(id)
  }

  @Put(':id/order')
  @Permissions('friend_link.update')
  updateOrder(
    @Param('id') id: string,
    @Body('order', ParseIntPipe) order: number
  ) {
    return this.friendLinksService.updateOrder(id, order)
  }

  @Put(':id/status')
  @Permissions('friend_link.update')
  updateStatus(
    @Param('id') id: string,
    @Body('status', ParseIntPipe) status: number
  ) {
    return this.friendLinksService.updateStatus(id, status)
  }
} 