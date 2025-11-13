import { MongoClient } from 'mongodb'

const uri = process.env.MONGODB_URI || ''
let client: MongoClient | null = null

const clientPromise = (async () => {
  if (!client) {
    if (!uri) {
      throw new Error('Please define MONGODB_URI in environment variables')
    }
    client = new MongoClient(uri, {
      retryWrites: true,
      w: 'majority',
    })
    await client.connect()
  }
  return client
})()

export default clientPromise
