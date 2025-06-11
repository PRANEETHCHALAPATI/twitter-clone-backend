const express = require('express')
const app = express()
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

let db = null
const dbPath = path.join(__dirname, 'db','twitterClone.db')
const initDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
const port = process.env.PORT || 3000
app.listen(port, () => {
  console.log(`Server is running at ${port}`)
})
  } catch (e) {
    console.log(`DB Error ${e}`)
    process.exit(1)
  }
}

app.post('/register/', async (request, response) => {
  const {username, password, name, gender} = request.body
  const selectQuery = `SELECT * FROM user WHERE username = ? ;`
  const dbUser = await db.get(selectQuery, [username])
  if (dbUser === undefined) {
    if (password.length < 6) {
      response.status(400)
      response.send('Password is too short')
    } else {
      const hashedPassword = await bcrypt.hash(password, 10)
      const insertQuery = `INSERT INTO user(name,username,password,gender) VALUES (?,?,?,?) ;`
      await db.run(insertQuery, [name, username, hashedPassword, gender])
      response.status(200)
      response.send('User created successfully')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

app.post('/login/', async (request, response) => {
  const {username, password} = request.body
  const selectQuery = `SELECT * FROM user WHERE username = ?;`
  const dbUser = await db.get(selectQuery, [username])
  if (dbUser === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password)
    if (isPasswordMatched === true) {
      const payload = {username: username}
      const jwtToken = await jwt.sign(payload, 'THE_SECRECT_KOOMB')
      response.send({jwtToken})
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

const axt = (request, response, next) => {
  let jwtToken
  const authHeader = request.headers['authorization']
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(' ')[1]
  }
  if (jwtToken === undefined) {
    response.status(401)
    response.send('Invalid JWT Token')
  } else {
    jwt.verify(jwtToken, 'THE_SECRECT_KOOMB', (error, payload) => {
      if (error) {
        response.status(401)
        response.send('Invalid JWT Token')
      } else {
        request.username = payload.username
        next()
      }
    })
  }
}

const getUserIdFromUsername = async username => {
  const query = `SELECT user_id FROM user WHERE username = ?`
  const user = await db.get(query, [username])
  return user.user_id
}

app.get('/user/tweets/feed/', axt, async (request, response) => {
  const {username} = request
  const userid = await getUserIdFromUsername(username)
  const query = `SELECT user.username,tweet,tweet.date_time as dateTime 
	FROM follower 
	JOIN tweet ON follower.following_user_id = tweet.user_id
	JOIN user ON tweet.user_id = user.user_id
	WHERE follower.follower_user_id = ?
	ORDER BY tweet.date_time DESC 
	LIMIT 4`
  const tweetList = await db.all(query, [userid])
  response.send(tweetList)
})

app.get('/user/following/', axt, async (request, response) => {
  const {username} = request
  const userid = await getUserIdFromUsername(username)
  const query = `
   SELECT user.name FROM follower
   JOIN user ON follower.following_user_id = user.user_id
   WHERE follower.follower_user_id = ?`
  const userList = await db.all(query, [userid])
  response.send(userList)
})

app.get('/user/followers/', axt, async (request, response) => {
  const {username} = request
  const userid = await getUserIdFromUsername(username)
  const query = `
   SELECT user.name FROM follower
   JOIN user ON follower.follower_user_id = user.user_id
   WHERE follower.following_user_id = ?`
  const userList = await db.all(query, [userid])
  response.send(userList)
})

app.get('/tweets/:tweetId/', axt, async (request, response) => {
  const {tweetId} = request.params
  const userId = await getUserIdFromUsername(request.username)
  const accessQuery = `
    SELECT * FROM tweet 
    JOIN follower ON tweet.user_id = follower.following_user_id
    WHERE tweet.tweet_id = ? AND follower.follower_user_id = ?`
  const canView = await db.get(accessQuery, [tweetId, userId])
  if (canView === undefined) {
    response.status(401)
    response.send('Invalid Request')
  } else {
    const tweetQuery = `
    SELECT tweet, 
      (SELECT COUNT(*) FROM like WHERE tweet_id = ?) AS likes,
      (SELECT COUNT(*) FROM reply WHERE tweet_id = ?) AS replies,
      date_time AS dateTime
    FROM tweet WHERE tweet_id = ?`
    const result = await db.get(tweetQuery, [tweetId, tweetId, tweetId])
    response.send(result)
  }
})

app.get('/tweets/:tweetId/likes/', axt, async (request, response) => {
  const {tweetId} = request.params
  const userId = await getUserIdFromUsername(request.username)
  const accessQuery = `
    SELECT * FROM tweet 
    JOIN follower ON tweet.user_id = follower.following_user_id
    WHERE tweet.tweet_id = ? AND follower.follower_user_id = ?`
  const canView = await db.get(accessQuery, [tweetId, userId])
  if (canView === undefined) {
    response.status(401)
    response.send('Invalid Request')
  } else {
    const likeQuery = `
    SELECT username FROM user
    JOIN like ON user.user_id = like.user_id
    WHERE like.tweet_id = ?`
    const likes = await db.all(likeQuery, [tweetId])
    response.send({likes: likes.map(x => x.username)})
  }
})

app.get('/tweets/:tweetId/replies/', axt, async (request, response) => {
  const {tweetId} = request.params
  const userId = await getUserIdFromUsername(request.username)
  const accessQuery = `
    SELECT * FROM tweet 
    JOIN follower ON tweet.user_id = follower.following_user_id
    WHERE tweet.tweet_id = ? AND follower.follower_user_id = ?`
  const canView = await db.get(accessQuery, [tweetId, userId])
  if (canView === undefined) {
    response.status(401)
    response.send('Invalid Request')
  } else {
    const replyQuery = `
    SELECT name, reply FROM reply
    JOIN user ON reply.user_id = user.user_id
    WHERE tweet_id = ?`
    const replies = await db.all(replyQuery, [tweetId])
    response.send({replies})
  }
})

app.get('/user/tweets/', axt, async (request, response) => {
  const userid = await getUserIdFromUsername(request.username)
  const query = `
    SELECT tweet, 
      (SELECT COUNT(*) FROM like WHERE tweet_id = tweet.tweet_id) AS likes,
      (SELECT COUNT(*) FROM reply WHERE tweet_id = tweet.tweet_id) AS replies,
      date_time AS dateTime
    FROM tweet WHERE user_id = ?`
  const tweets = await db.all(query, [userid])
  response.send(tweets)
})

app.post('/user/tweets/', axt, async (req, res) => {
  const {tweet} = req.body
  const userId = await getUserIdFromUsername(req.username)
  const dateTime = new Date().toISOString().replace('T', ' ').split('.')[0]
  const query = `INSERT INTO tweet (tweet, user_id, date_time) VALUES (?, ?, ?)`
  await db.run(query, [tweet, userId, dateTime])
  res.send('Created a Tweet')
})

app.delete('/tweets/:tweetId/', axt, async (req, res) => {
  const {tweetId} = req.params
  const userId = await getUserIdFromUsername(req.username)
  const tweet = await db.get(`SELECT * FROM tweet WHERE tweet_id = ?`, [
    tweetId,
  ])

  if (!tweet || tweet.user_id !== userId) {
    res.status(401).send('Invalid Request')
  } else {
    await db.run(`DELETE FROM tweet WHERE tweet_id = ?`, [tweetId])
    res.send('Tweet Removed')
  }
})

initDBAndServer()
module.exports = app
