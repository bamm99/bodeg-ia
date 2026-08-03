import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Response, NextFunction } from 'express';
import { idempotencyMiddleware, clearIdempotencyCache } from '../middleware/idempotencyMiddleware';
import { AuthRequest } from '../middleware/auth';

describe('Middleware de Idempotencia (idempotencyMiddleware)', () => {
  let mockReq: Partial<AuthRequest>;
  let mockRes: any;
  let nextFunction: NextFunction;

  beforeEach(() => {
    clearIdempotencyCache();
    mockReq = {
      method: 'POST',
      headers: {},
      user: {
        userId: 'user-123',
        email: 'op@bodegia.cl',
        companyId: 'company-123',
        roleCode: 'WAREHOUSE_OPERATOR',
        permissions: ['inventory:write'],
      },
    };

    mockRes = {
      statusCode: 200,
      headers: {},
      setHeader(key: string, val: string) {
        this.headers[key] = val;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json: vi.fn(function (data: any) {
        return data;
      }),
    };

    nextFunction = vi.fn();
  });

  it('debe continuar normalmente si no se incluye la cabecera x-idempotency-key', () => {
    idempotencyMiddleware(mockReq as AuthRequest, mockRes as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('debe procesar el primer request y cachear la respuesta exitosa', () => {
    mockReq.headers = { 'x-idempotency-key': 'uuid-key-001' };

    idempotencyMiddleware(mockReq as AuthRequest, mockRes as Response, nextFunction);
    expect(nextFunction).toHaveBeenCalled();

    // Simular que el controlador responde con HTTP 201 y un payload
    const responsePayload = { success: true, movementId: 'mov-1' };
    mockRes.status(201).json(responsePayload);

    // Enviar una segunda petición duplicada con la misma clave de idempotencia
    const secondReq: Partial<AuthRequest> = {
      method: 'POST',
      headers: { 'x-idempotency-key': 'uuid-key-001' },
      user: mockReq.user,
    };
    const secondRes: any = {
      statusCode: 200,
      headers: {},
      setHeader(key: string, val: string) {
        this.headers[key] = val;
      },
      status(code: number) {
        this.statusCode = code;
        return this;
      },
      json: vi.fn(),
    };
    const secondNext = vi.fn();

    idempotencyMiddleware(secondReq as AuthRequest, secondRes as Response, secondNext);

    // No debe llamar al controlador next() porque fue interceptado por la cache
    expect(secondNext).not.toHaveBeenCalled();
    expect(secondRes.headers['x-cache-hit']).toBe('true');
    expect(secondRes.json).toHaveBeenCalledWith(responsePayload);
  });
});
