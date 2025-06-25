/* eslint-disable */
/* tslint:disable */
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface GetRootData {
  status: 'ok'
}

export interface ReadCreatePayload {
  /** @minLength 1 */
  image: string
}

export interface ReadCreateData {
  /**
   * @maxItems 19
   * @minItems 19
   */
  resources: string[]
  /**
   * @maxItems 19
   * @minItems 19
   */
  numbers: string[]
}
