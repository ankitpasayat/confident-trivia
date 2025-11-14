import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { log, logger } from '@/lib/logger';

describe('Logger', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'info');
    vi.spyOn(logger, 'error');
    vi.spyOn(logger, 'warn');
    vi.spyOn(logger, 'debug');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('info', () => {
    it('should log info messages', () => {
      log.info('Test info message');
      expect(logger.info).toHaveBeenCalledWith('Test info message');
    });

    it('should log info messages with data', () => {
      log.info('Test with data', { key: 'value' });
      expect(logger.info).toHaveBeenCalledWith('Test with data {\n  "key": "value"\n}');
    });
  });

  describe('error', () => {
    it('should log error messages', () => {
      log.error('Test error');
      expect(logger.error).toHaveBeenCalledWith('Test error', { stack: undefined });
    });

    it('should log error with Error object', () => {
      const error = new Error('Test error');
      log.error('Error occurred', error);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Error occurred Test error'),
        expect.objectContaining({ stack: error.stack })
      );
    });

    it('should log error with plain object', () => {
      log.error('Error with object', { code: 500 });
      expect(logger.error).toHaveBeenCalledWith(
        'Error with object {\n  "code": 500\n}',
        { stack: undefined }
      );
    });
  });

  describe('warn', () => {
    it('should log warning messages', () => {
      log.warn('Test warning');
      expect(logger.warn).toHaveBeenCalledWith('Test warning');
    });

    it('should log warning with data', () => {
      log.warn('Warning with data', { status: 'deprecated' });
      expect(logger.warn).toHaveBeenCalledWith('Warning with data {\n  "status": "deprecated"\n}');
    });
  });

  describe('debug', () => {
    it('should log debug messages', () => {
      log.debug('Test debug');
      expect(logger.debug).toHaveBeenCalledWith('Test debug');
    });

    it('should log debug with data', () => {
      log.debug('Debug with data', { details: 'verbose' });
      expect(logger.debug).toHaveBeenCalledWith('Debug with data {\n  "details": "verbose"\n}');
    });
  });
});
