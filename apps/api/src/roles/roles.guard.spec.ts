import { describe, expect, it, jest } from '@jest/globals';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from './role.enum';

describe('RolesGuard', () => {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector);

  function createMockContext(user: any): ExecutionContext {
    return {
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access when no roles are required on the route', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const context = createMockContext({ id: 'u1', roles: ['PLAYER'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access when user has the required PLAYER role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.PLAYER]);

    const context = createMockContext({ id: 'u1', roles: ['PLAYER'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when a standard PLAYER tries to access ADMIN endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockContext({ id: 'u1', roles: ['PLAYER'] });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should deny access when a standard PLAYER tries to access VENUE_OWNER endpoint', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.VENUE_OWNER]);

    const context = createMockContext({ id: 'u1', roles: ['PLAYER'] });
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should allow access when user has ADMIN role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const context = createMockContext({ id: 'u2', roles: ['ADMIN'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny access when user has no roles or request has no user', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.PLAYER]);

    const context = createMockContext(null);
    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
