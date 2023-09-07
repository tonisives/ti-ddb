import { BatchGetCommandInput, DynamoDBDocumentClient, ScanCommandInput } from "@aws-sdk/lib-dynamodb";
/**
 * The maximum number of items that can be got in a single request.
 */
export declare const batchGetLimit = 100;
/**
 * The maximum number of items that can be put in a single request.
 */
export declare const batchWriteLimit = 25;
/**
 * The initial wait when backing off on request rate, in milliseconds.
 */
export declare let backoffInitial: number;
/**
 * The maximum wait when backing off on request rate, in milliseconds.
 */
export declare let backoffMax: number;
/**
 * The wait growth factor when repeatedly backing off.  When backing off
 * from an operation the first wait `backoff = backoffInitial`
 * and for each consecutive wait `backoff = Math.min(backoff * backoffFactor, backoffMax)`.
 */
export declare let backoffFactor: number;
/**
 * Configure module settings for: backoffInitial, backoffMax, backoffFactor.
 * See the module member for individual documentation.
 * @param options an object with optional values for the settings
 */
export declare function configure(options: {
    backoffInitial?: number;
    backoffMax?: number;
    backoffFactor?: number;
}): void;
/**
 * Batch get all items in the request.  Can handle more than 100 keys at once by making
 * multiple requests.  Reattempts UnprocessedKeys.
 * @param dynamodb
 * @param batchGetInput
 * @returns The stored objects.
 */
export declare function batchGetAll(dynamodb: DynamoDBDocumentClient, batchGetInput: BatchGetCommandInput): Promise<any[]>;
/**
 * Batch write all items in the request.  Can handle more than 25 objects at once
 * by making multiple requests.  Reattempts UnprocessedItems.
 * @param dynamodb
 */
export declare function batchPutAll(dynamodb: DynamoDBDocumentClient, table: string, items: object[], logCallback?: (log: string) => void): Promise<void>;
export declare const batchScanAll: (dynamodb: DynamoDBDocumentClient, input: ScanCommandInput) => Promise<any[]>;
