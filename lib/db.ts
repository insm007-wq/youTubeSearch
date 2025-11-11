import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Please define MONGODB_URI in .env.local')
}

const uri = process.env.MONGODB_URI
let client: MongoClient | null = null

const clientPromise = (async () => {
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
