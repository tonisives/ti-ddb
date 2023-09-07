import { BatchGetCommand, BatchWriteCommand, ScanCommand, } from "@aws-sdk/lib-dynamodb";
let Logger = {
    debug: (message) => { }
};
/**
 * The maximum number of items that can be got in a single request.
 */
export const batchGetLimit = 100;
/**
 * The maximum number of items that can be put in a single request.
 */
export const batchWriteLimit = 25;
/**
 * The initial wait when backing off on request rate, in milliseconds.
 */
export let backoffInitial = 1000;
/**
 * The maximum wait when backing off on request rate, in milliseconds.
 */
export let backoffMax = 30000;
/**
 * The wait growth factor when repeatedly backing off.  When backing off
 * from an operation the first wait `backoff = backoffInitial`
 * and for each consecutive wait `backoff = Math.min(backoff * backoffFactor, backoffMax)`.
 */
export let backoffFactor = 2;
/**
 * Configure module settings for: backoffInitial, backoffMax, backoffFactor.
 * See the module member for individual documentation.
 * @param options an object with optional values for the settings
 */
export function configure(options) {
    if (typeof options.backoffInitial === "number") {
        backoffInitial = options.backoffInitial;
    }
    if (typeof options.backoffMax === "number") {
        backoffMax = options.backoffMax;
    }
    if (typeof options.backoffFactor === "number") {
        backoffFactor = options.backoffFactor;
    }
}
/**
 * Batch get all items in the request.  Can handle more than 100 keys at once by making
 * multiple requests.  Reattempts UnprocessedKeys.
 * @param dynamodb
 * @param batchGetInput
 * @returns The stored objects.
 */
export async function batchGetAll(dynamodb, batchGetInput) {
    if (!batchGetInput.RequestItems) {
        Logger.debug("No get items");
        return [];
    }
    Logger.debug("starting batch ");
    const requestItemsTables = Object.keys(batchGetInput.RequestItems);
    if (requestItemsTables.length !== 1) {
        throw new Error("Only batchGet from a single table at a time is supported in this method.");
    }
    const requestItemsTable = requestItemsTables[0];
    const unprocessedKeys = [...batchGetInput.RequestItems[requestItemsTable].Keys];
    let results = [];
    let backoff = backoffInitial;
    while (unprocessedKeys.length) {
        // Take values from the input but override the Keys we fetch.
        const request = {
            ...batchGetInput,
            RequestItems: {
                [requestItemsTable]: {
                    ...batchGetInput.RequestItems[requestItemsTable],
                    Keys: unprocessedKeys.splice(0, Math.min(unprocessedKeys.length, batchGetLimit)),
                },
            },
        };
        const response = await dynamodb.send(new BatchGetCommand(request));
        // const responseObjects = unwrapBatchGetOutput(response)
        let responseObjects = response.Responses[requestItemsTable];
        results = [...results, ...responseObjects];
        if (response.UnprocessedKeys &&
            response.UnprocessedKeys[requestItemsTable] &&
            response.UnprocessedKeys[requestItemsTable].Keys.length) {
            unprocessedKeys.unshift(...response.UnprocessedKeys[requestItemsTable].Keys);
            await wait(backoff);
            backoff = Math.min(backoff * backoffFactor, backoffMax);
        }
        else {
            backoff = backoffInitial;
        }
    }
    return results;
}
/**
 * Batch write all items in the request.  Can handle more than 25 objects at once
 * by making multiple requests.  Reattempts UnprocessedItems.
 * @param dynamodb
 */
export async function batchPutAll(dynamodb, table, items, logCallback) {
    logCallback?.("starting batch write");
    let input = {
        RequestItems: {
            [table]: items.map((it) => ({ PutRequest: { Item: it } })),
        }
    };
    const requestItemsTables = Object.keys(input.RequestItems);
    if (requestItemsTables.length !== 1) {
        throw new Error("Only batchWrite to a single table at a time is supported in this method.");
    }
    const requestItemsTable = requestItemsTables[0];
    const unprocessedItems = [...input.RequestItems[requestItemsTable]];
    let backoff = backoffInitial;
    while (unprocessedItems.length) {
        const request = {
            ...input,
            RequestItems: {
                [requestItemsTable]: unprocessedItems.splice(0, Math.min(unprocessedItems.length, batchWriteLimit)),
            },
        };
        if (logCallback)
            logCallback(unprocessedItems.length.toString());
        const response = await dynamodb
            .send(new BatchWriteCommand(request))
            .catch((e) => {
            const failedItems = request.RequestItems ? request.RequestItems[requestItemsTable] : [];
            const failedItemStrings = failedItems.map((it) => JSON.stringify(it).slice(0, 20)).join("\n");
            console.log(`Not writing ${failedItemStrings}\n > failed with ${e}`);
            return undefined;
        })
            .then((it) => it);
        if (response && // failed items are logged to console
            response.UnprocessedItems &&
            response.UnprocessedItems[requestItemsTable] &&
            response.UnprocessedItems[requestItemsTable].length) {
            unprocessedItems.unshift(...response.UnprocessedItems[requestItemsTable]);
            await wait(backoff);
            backoff = Math.min(backoff * backoffFactor, backoffMax);
        }
        else {
            backoff = backoffInitial;
        }
    }
}
async function wait(millis) {
    await new Promise((resolve) => setTimeout(resolve, millis));
}
export const batchScanAll = async (dynamodb, input) => {
    const results = [];
    // get all items for each of the tables
    console.log(`getting all items for ${input.TableName}`);
    var lastEvalKey = undefined;
    // var from = new Date()
    // from.setDate(from.getDate() - 1)
    do {
        // ignore items with higher timestamp than current tables lowest
        var input = {
            ...input,
            ...(lastEvalKey && { ExclusiveStartKey: lastEvalKey }),
        };
        const command = new ScanCommand(input);
        const result = await dynamodb.send(command);
        result.Items?.forEach((item) => {
            results.push(item);
        });
        console.log("got items", result.Items?.length);
        lastEvalKey = result.LastEvaluatedKey;
    } while (lastEvalKey !== undefined);
    console.log(`total items: ${results.length}`);
    return results;
};
//# sourceMappingURL=batchHelper.js.map