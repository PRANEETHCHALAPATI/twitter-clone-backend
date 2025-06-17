const express = require('express')
const app = express()
const cors = require("cors");
app.use(cors());
app.use(express.json())
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const insertDummyData = async () => {
  // Clear old data
  await db.run(`DELETE FROM reply`);
  await db.run(`DELETE FROM like`);
  await db.run(`DELETE FROM follower`);
  await db.run(`DELETE FROM tweet`);
  await db.run(`DELETE FROM user`);

  // Hash passwords
  const users = [
    { name: "John Doe", username: "john", password: "john123", gender: "male" },
    { name: "Jane Smith", username: "jane", password: "jane123", gender: "female" },
    { name: "Mark Lee", username: "mark", password: "mark123", gender: "male" },
    { name: "Alice Ray", username: "alice", password: "alice123", gender: "female" },
    { name: "Bob Stone", username: "bob", password: "bob123", gender: "male" },
    { name: "Cathy Liu", username: "cathy", password: "cathy123", gender: "female" },
  ];

  for (const u of users) {
    const hashedPwd = await bcrypt.hash(u.password, 10);
    await db.run(
      `INSERT INTO user (name, username, password, gender) VALUES (?, ?, ?, ?)`,
      [u.name, u.username, hashedPwd, u.gender]
    );
  }

  // Tweets
  const tweets = [
    [1, "Hey there! John's here."],
    [2, "Jane's first tweet!"],
    [3, "Mark checking in."],
    [4, "Alice says hello!"],
    [5, "Bob’s thoughts today."],
    [6, "Cathy is tweeting for the first time."],
    [1, "Loving this Twitter Clone!"],
    [2, "Beautiful day to code."],
    [3, "Learning backend stuff."],
    [4, "Frontend magic with CSS!"],
    [5, "Deploying my first app!"],
    [6, "Happy to connect here!"]
  ];

  for (const [uid, text] of tweets) {
    const dateTime = new Date(Date.now() - Math.floor(Math.random() * 100000000)).toISOString().replace('T', ' ').split('.')[0];
    await db.run(`INSERT INTO tweet (tweet, user_id, date_time) VALUES (?, ?, ?)`, [text, uid, dateTime]);
  }

  // Followers
  const followers = [
    [1, 2], [1, 3], [1, 4],
    [2, 1], [2, 3], [2, 5],
    [3, 1], [3, 2], [3, 6],
    [4, 5], [4, 6],
    [5, 1], [6, 2]
  ];
  for (const [follower, following] of followers) {
    await db.run(`INSERT INTO follower (follower_user_id, following_user_id) VALUES (?, ?)`, [follower, following]);
  }

  // Likes
  const likes = [
    [1, 2], [1, 3], [1, 4],
    [2, 1], [2, 5], [2, 6],
    [3, 1], [3, 2], [3, 9],
    [4, 3], [4, 7], [4, 8],
    [5, 6], [5, 10], [6, 1], [6, 11]
  ];
  for (const [uid, tweetId] of likes) {
    await db.run(`INSERT INTO like (user_id, tweet_id) VALUES (?, ?)`, [uid, tweetId]);
  }

  // Replies
  const replies = [
    [2, 1, "Welcome Jane!"],
    [3, 1, "Cool John!"],
    [4, 2, "Hello Jane!"],
    [5, 2, "Nice to see you!"],
    [6, 3, "Hey Mark!"],
    [1, 4, "Hi Alice!"],
    [2, 5, "Great point Bob!"],
    [3, 6, "Nice tweet Cathy!"],
    [4, 7, "Indeed, good app."],
    [5, 8, "Yes, sunny here too!"],
    [6, 9, "Same here!"],
    [1, 10, "Wow, stylish!"]
  ];
  for (const [uid, tid, comment] of replies) {
    await db.run(`INSERT INTO reply (tweet_id, user_id, reply) VALUES (?, ?, ?)`, [tid, uid, comment]);
  }

  console.log("✅ More dummy data inserted successfully.");
};

let db = null
const dbPath = path.join(__dirname, 'db','twitterClone.db')
const initDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
// await insertDummyData();
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
