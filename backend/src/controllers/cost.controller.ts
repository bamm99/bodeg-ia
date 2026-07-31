import { Response } from 'express';
import { prisma } from '../db/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { AuthRequest } from '../middleware/auth.js';
import { calculateDailyStorageCost } from '../services/costCalculator.js';

export async function getCostProfiles(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const profiles = await prisma.cost_profiles.findMany({
    where: { company_id: companyId, deleted_at: null },
    include: { zones: true, racks: true, levels: true },
  });
  return sendSuccess(res, profiles);
}

export async function createCostProfile(req: AuthRequest, res: Response) {
  const companyId = req.user?.companyId;
  const {
    zone_id,
    rack_id,
    level_id,
    daily_base_cost,
    currency,
    turnover_multiplier,
    maintenance_cost_daily,
    energy_cost_daily,
    seasonal_factor,
    custom_formula_expression,
  } = req.body;

  const profile = await prisma.cost_profiles.create({
    data: {
      company_id: companyId!,
      zone_id: zone_id || null,
      rack_id: rack_id || null,
      level_id: level_id || null,
      daily_base_cost: daily_base_cost || 0.0,
      currency: currency || 'CLP',
      turnover_multiplier: turnover_multiplier || 1.0,
      maintenance_cost_daily: maintenance_cost_daily || 0.0,
      energy_cost_daily: energy_cost_daily || 0.0,
      seasonal_factor: seasonal_factor || 1.0,
      custom_formula_expression: custom_formula_expression || null,
    },
  });

  return sendSuccess(res, profile, 201, 'Perfil de costos creado exitosamente con arco exclusivo');
}

export async function updateCostProfile(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const userId = req.user?.userId;

  const currentProfile = await prisma.cost_profiles.findUnique({ where: { id } });
  if (!currentProfile) return sendError(res, 'Perfil de costo no encontrado', 404);

  const updatedProfile = await prisma.cost_profiles.update({
    where: { id },
    data: req.body,
  });

  // Registrar histórico de cambios auditorable si cambia el costo base
  if (req.body.daily_base_cost && req.body.daily_base_cost !== currentProfile.daily_base_cost) {
    await prisma.cost_history.create({
      data: {
        company_id: currentProfile.company_id,
        cost_profile_id: id,
        previous_cost: currentProfile.daily_base_cost,
        new_cost: req.body.daily_base_cost,
        currency: updatedProfile.currency,
        change_reason: req.body.change_reason || 'Actualización manual de tarifa',
        changed_by_user_id: userId,
      },
    });
  }

  return sendSuccess(res, updatedProfile, 200, 'Perfil de costo actualizado e histórico registrado');
}

export async function getCostHistory(req: AuthRequest, res: Response) {
  const { id } = req.params;
  const history = await prisma.cost_history.findMany({
    where: { cost_profile_id: id },
    include: { users: { select: { full_name: true, email: true } } },
    orderBy: { created_at: 'desc' },
  });
  return sendSuccess(res, history);
}

export async function simulateCost(req: AuthRequest, res: Response) {
  const {
    daily_base_cost,
    turnover_multiplier,
    maintenance_cost_daily,
    energy_cost_daily,
    seasonal_factor,
    occupied_volume_m3,
    total_volume_m3,
    custom_formula_expression,
  } = req.body;

  const totalVol = Number(total_volume_m3 || 1.0);
  const occVol = Number(occupied_volume_m3 || 0.0);
  const occRatio = totalVol > 0 ? occVol / totalVol : 0.0;

  const result = calculateDailyStorageCost(
    {
      daily_base_cost: Number(daily_base_cost || 0),
      turnover_multiplier: Number(turnover_multiplier || 1.0),
      maintenance_cost_daily: Number(maintenance_cost_daily || 0),
      energy_cost_daily: Number(energy_cost_daily || 0),
      seasonal_factor: Number(seasonal_factor || 1.0),
      occupied_volume_m3: occVol,
      total_volume_m3: totalVol,
      occupancy_ratio: occRatio,
    },
    custom_formula_expression
  );

  return sendSuccess(res, {
    totalDailyCost: result.totalDailyCost,
    isCustomFormulaUsed: result.isCustomFormulaUsed,
    occupancyPct: Number((occRatio * 100).toFixed(1)),
  });
}
