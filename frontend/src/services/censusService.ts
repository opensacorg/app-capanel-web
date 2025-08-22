import { OpenAPI } from '../client/core/OpenAPI';
import { request as __request } from '../client/core/request';
import type { CancelablePromise } from '../client/core/CancelablePromise';

export interface CensusData {
  total_enr: number;
  // Add other census fields as they become available
  [key: string]: any;
}

export interface CensusDataResponse {
  data: CensusData;
  status: string;
}

export class CensusService {
  /**
   * Get Census Data
   * Retrieve census data including total enrollment.
   * @returns CensusDataResponse Successful Response
   * @throws ApiError
   */
  public static getCensusData(): CancelablePromise<CensusDataResponse> {
    return __request(OpenAPI, {
      method: 'GET',
      url: '/api/v1/censusdata',
      errors: {
        404: 'Census data not found',
        422: 'Validation Error',
        500: 'Internal Server Error',
      },
    });
  }
}
