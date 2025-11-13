import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI
let client: MongoClient | null = null

const clientPromise = (async () => {
  if (!uri) {
    throw new Error('Please define MONGODB_URI environment variable')
  }

  if (!client) {
    client = new MongoClient(uri, {
      retryWrites: true,
      w: 'majority',
    })
    await client.connect()
  }
  return client
})()

export default clientPromise
