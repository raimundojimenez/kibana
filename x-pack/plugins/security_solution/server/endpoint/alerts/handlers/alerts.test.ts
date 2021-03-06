/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { ILegacyClusterClient, IRouter, ILegacyScopedClusterClient } from 'kibana/server';
import {
  elasticsearchServiceMock,
  httpServiceMock,
  loggingSystemMock,
} from '../../../../../../../src/core/server/mocks';
import { registerAlertRoutes } from '../routes';
import { alertingIndexGetQuerySchema } from '../../../../common/endpoint_alerts/schema/alert_index';
import { createMockEndpointAppContextServiceStartContract } from '../../mocks';
import { EndpointAppContextService } from '../../endpoint_app_context_services';
import { createMockConfig } from '../../../lib/detection_engine/routes/__mocks__';

describe('test alerts route', () => {
  let routerMock: jest.Mocked<IRouter>;
  let mockClusterClient: jest.Mocked<ILegacyClusterClient>;
  let mockScopedClient: jest.Mocked<ILegacyScopedClusterClient>;
  let endpointAppContextService: EndpointAppContextService;

  beforeEach(() => {
    mockClusterClient = elasticsearchServiceMock.createClusterClient();
    mockScopedClient = elasticsearchServiceMock.createScopedClusterClient();
    mockClusterClient.asScoped.mockReturnValue(mockScopedClient);
    routerMock = httpServiceMock.createRouter();

    endpointAppContextService = new EndpointAppContextService();
    endpointAppContextService.start(createMockEndpointAppContextServiceStartContract());

    registerAlertRoutes(routerMock, {
      logFactory: loggingSystemMock.create(),
      service: endpointAppContextService,
      config: () => Promise.resolve(createMockConfig()),
    });
  });

  afterEach(() => endpointAppContextService.stop());

  it('should fail to validate when `page_size` is not a number', async () => {
    const validate = () => {
      alertingIndexGetQuerySchema.validate({
        page_size: 'abc',
      });
    };
    expect(validate).toThrow();
  });

  it('should validate when `page_size` is a number', async () => {
    const validate = () => {
      alertingIndexGetQuerySchema.validate({
        page_size: 25,
      });
    };
    expect(validate).not.toThrow();
  });

  it('should validate when `page_size` can be converted to a number', async () => {
    const validate = () => {
      alertingIndexGetQuerySchema.validate({
        page_size: '50',
      });
    };
    expect(validate).not.toThrow();
  });

  it('should allow either `page_index` or `after`, but not both', async () => {
    const validate = () => {
      alertingIndexGetQuerySchema.validate({
        page_index: 1,
        after: [123, 345],
      });
    };
    expect(validate).toThrow();
  });

  it('should allow either `page_index` or `before`, but not both', async () => {
    const validate = () => {
      alertingIndexGetQuerySchema.validate({
        page_index: 1,
        before: 'abc',
      });
    };
    expect(validate).toThrow();
  });

  it('should allow either `before` or `after`, but not both', async () => {
    const validate = () => {
      alertingIndexGetQuerySchema.validate({
        before: ['abc', 'def'],
        after: [123, 345],
      });
    };
    expect(validate).toThrow();
  });
});
