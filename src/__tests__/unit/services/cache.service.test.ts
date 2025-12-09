// src/__tests__/unit/services/cache.service.test.ts
import cacheService from '../../../services/cache.service';

describe('CacheService', () => {
  describe('cuando Redis no está disponible (test unitario)', () => {
    it('debe retornar null al intentar obtener valor', async () => {
      const result = await cacheService.get('test-key');
      expect(result).toBeNull();
    });

    it('debe manejar set sin errores', async () => {
      await expect(
        cacheService.set('test-key', { data: 'value' })
      ).resolves. not.toThrow();
    });

    it('debe manejar del sin errores', async () => {
      await expect(cacheService.del('test-key')).resolves.not.toThrow();
    });

    it('debe manejar flush sin errores', async () => {
      await expect(cacheService. flush()).resolves.not.toThrow();
    });

    it('debe retornar false para exists', async () => {
      const result = await cacheService.exists('any-key');
      expect(result).toBe(false);
    });

    it('debe retornar 0 para incr', async () => {
      const result = await cacheService.incr('counter');
      expect(result).toBe(0);
    });

    it('debe retornar 0 para decr', async () => {
      const result = await cacheService.decr('counter');
      expect(result).toBe(0);
    });

    it('debe retornar -1 para ttl', async () => {
      const result = await cacheService. ttl('any-key');
      expect(result).toBe(-1);
    });

    it('debe retornar false para expire', async () => {
      const result = await cacheService.expire('any-key', 60);
      expect(result).toBe(false);
    });

    it('debe retornar false para ping', async () => {
      const result = await cacheService.ping();
      expect(result).toBe(false);
    });

    it('debe ejecutar función en getOrSet cuando Redis no disponible', async () => {
      const fetchFn = jest.fn(). mockResolvedValue({ data: 'computed' });
      
      const result = await cacheService.getOrSet('key', fetchFn);
      
      expect(result).toEqual({ data: 'computed' });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('debe retornar null para info', async () => {
      const result = await cacheService.info();
      expect(result).toBeNull();
    });

    it('debe retornar array vacío para keys', async () => {
      const result = await cacheService.keys('*');
      expect(result).toEqual([]);
    });

    it('debe manejar delPattern sin errores', async () => {
      await expect(cacheService.delPattern('test:*')).resolves.not. toThrow();
    });

    it('debe retornar stats correctos', () => {
      const stats = cacheService.getStats();
      
      expect(stats). toHaveProperty('available');
      expect(stats).toHaveProperty('status');
      expect(typeof stats.available).toBe('boolean');
      expect(typeof stats. status).toBe('string');
    });
  });

  describe('manejo de errores graceful', () => {
    it('debe manejar múltiples operaciones sin Redis', async () => {
      // Verificar que el servicio maneja múltiples operaciones sin fallar
      await cacheService.set('key1', 'value1');
      await cacheService.set('key2', 'value2');
      
      const val1 = await cacheService. get('key1');
      const val2 = await cacheService.get('key2');
      
      expect(val1).toBeNull();
      expect(val2).toBeNull();
      
      await cacheService.del('key1');
      await cacheService.delPattern('key*');
      
      // Todo debería completarse sin errores
      expect(true).toBe(true);
    });

    it('debe manejar operaciones de hash sin Redis', async () => {
      await expect(cacheService.hset('hash', 'field', 'value')).resolves.not.toThrow();
      
      const result = await cacheService.hget('hash', 'field');
      expect(result).toBeNull();
      
      const allFields = await cacheService.hgetall('hash');
      expect(allFields).toEqual({});
    });

    it('debe manejar operaciones de lista sin Redis', async () => {
      const pushResult = await cacheService.lpush('list', 'value1', 'value2');
      expect(pushResult).toBe(0);
      
      const rangeResult = await cacheService. lrange('list', 0, -1);
      expect(rangeResult).toEqual([]);
    });
  });
});