import mongodb from 'mongodb'

const username = 'UserDbReadWrite';
const password = 'ef4c19d1-0cc3-4daf-885d-7e57bae6ef08';
const mongoUri = `mongodb://${username}:${password}@127.0.0.1:27017/UserDb`;
const mongoClient = mongodb.MongoClient;

let dbConn = null;

// Get a connection to the User Database in Mongo.  If a connection already exists
// simply return that connection handle.
const getConnection = async function () {
    if (!dbConn) {
        const client = new mongoClient(mongoUri, { useUnifiedTopology: true });
        await client.connect();
        dbConn = client.db();
    }

    return dbConn;
}

// Get a link to the Mongo collection specified.
const getCollection = async function (collection) {
    const connection = await getConnection();

    return connection.collection(collection);
}

export default { getConnection, getCollection };