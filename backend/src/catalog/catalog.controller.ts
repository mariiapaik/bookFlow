import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CreateServiceDto, UpdateServiceDto } from './catalog.dto';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../auth/user.entity';

@Controller('services')
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  /** Public: customers browse only active services. */
  @Get()
  list() {
    return this.catalog.findAll(true);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.catalog.findOne(id);
  }

  // ---- Admin-only management below ----

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('admin/all')
  listAll() {
    return this.catalog.findAll(false);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Post()
  create(@Body() dto: CreateServiceDto) {
    return this.catalog.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateServiceDto) {
    return this.catalog.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.OWNER)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.catalog.remove(id);
  }
}
