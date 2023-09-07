import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
export const dbClient = DynamoDBDocumentClient.from(new DynamoDBClient({}));
//# sourceMappingURL=config.js.map