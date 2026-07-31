import { describe, it, expect, vi } from 'vitest';
import { sendSuccess, sendPaginated, sendError } from '../utils/response.js';
import { Response } from 'express';

describe('Utils de Respuestas HTTP (response.ts)', () => {
  const createMockResponse = () => {
    const res: any = {};
    res.status = vi.fn().mockReturnValue(res);
    res.json = vi.fn().mockReturnValue(res);
    return res as Response;
  };

  it('sendSuccess debe formatear la respuesta con success: true', () => {
    const res = createMockResponse();
    sendSuccess(res, { foo: 'bar' }, 201, 'Registro creado');

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: 'Registro creado',
      data: { foo: 'bar' },
    });
  });

  it('sendPaginated debe formatear adecuadamente los metadatos de paginación', () => {
    const res = createMockResponse();
    sendPaginated(res, [1, 2, 3], { page: 1, limit: 10, total: 3, totalPages: 1 });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: [1, 2, 3],
      meta: { page: 1, limit: 10, total: 3, totalPages: 1 },
    });
  });

  it('sendError debe formatear errores con success: false', () => {
    const res = createMockResponse();
    sendError(res, 'Acceso denegado', 403, [{ detail: 'Sin permiso' }]);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: 'Acceso denegado',
      details: [{ detail: 'Sin permiso' }],
    });
  });
});
