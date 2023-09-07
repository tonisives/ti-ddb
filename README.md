DynamoDB documentClient batch helper functions

## Installation

```
yarn add @aws-sdk/lib-dynamodb @aws-sdk/client-dynamodb 'ti-ddb@tonisives/ti-ddb'
```

## Usage

```typescript
  import { ddbClient, batchScanAll } from 'ti-ddb' // default document client config
  let client = ddbClient
  let results = batchScanAll(client, {
    TableName: 'my-table',
    FilterExpression: 'attribute_exists(my-attribute)',
  })
```

### available functions
- batchGetAll
- batchPutAll
- batchScanAll