import express from 'express'
import cors from 'cors'
import admin from 'firebase-admin'

const app = express()

const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
credential: admin.credential.cert(serviceAccount),
databaseURL: "https://letsgohome-e9509.firebaseio.com"
});
  

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.post('/sessions', (req, res) => {
  res.send('Session created!')
})

app.get('/sessions/:id', (req, res) => {
  res.send('Session details!')
})

app.post('/sessions/:id', (req, res) => {
  res.send('Session updated with button click!')
})

app.listen(3000, () => {
  console.log('Server is running on port 3000')
})