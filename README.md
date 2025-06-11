# twitterApplication
This project is a Twitter Clone built using Node.js, Express.js, and SQLite. It replicates the core functionalities of Twitter, allowing users to register, login, follow others, post tweets, and interact through likes and replies.  Currently, the backend is complete and being integrated with a frontend to make it a full-stack web application.
🔧 _**Backend Features**_
✅ User Management
Register: New users can register with username, name, password (hashed using bcrypt), and gender.

Login: Authenticated via JWT tokens; generates a secure token on successful login.

🔐 Authentication
All private routes are protected using middleware (axt) that verifies JWT tokens from the Authorization header.

🧵 Tweet System
Post Tweet: Authenticated users can post tweets.

Delete Tweet: Users can delete their own tweets.

Feed: Users can view the latest 4 tweets from people they follow.

View Tweet Details: Users can see tweet content, likes count, replies count, and timestamp.

❤️ Like & 💬 Reply System
Likes: View users who liked a specific tweet.

Replies: View replies and who replied to a specific tweet.

👥 Social Interactions
Following List: View users that the current user is following.

Followers List: View users that follow the current user.

🗃 Database
Database: SQLite

Tables:

user: Stores user info (name, username, password, gender)

tweet: Stores tweets with user_id and datetime

follower: Stores follower-following relationships

like: Maps users to liked tweets

reply: Stores replies from users to tweets

🛠 Technologies Used
Backend: Node.js, Express.js

Authentication: JWT (JSON Web Tokens)

Password Security: bcrypt

Database: SQLite

Deployment Target: Render (backend), Vercel or Netlify (frontend, upcoming)

Planned Frontend: HTML, CSS, JavaScript (or React.js)

_**🌐 API Highlights (All secured routes use JWT)**_
Endpoint	Method	Description
/register/	POST	Register a new user

/login/	POST	Authenticate user

/user/tweets/feed/	GET	Get 4 latest tweets from followed users

/user/tweets/	GET	Get tweets posted by logged-in user

/user/following/	GET	List of users the current user follows

/user/followers/	GET	List of users following the current user

/tweets/:tweetId/	GET	Get tweet details if followed

/tweets/:tweetId/likes/	GET	List of users who liked the tweet

/tweets/:tweetId/replies/	GET	List of replies for the tweet

/user/tweets/	POST	Create a new tweet

/tweets/:tweetId/	DELETE	Delete a tweet (if owned by user)

🧩 Future Plans
🌐 Frontend UI with:

Tweet timeline

Login/Register forms

Like/Reply interactions

🎨 Improved styling with Tailwind CSS or Bootstrap

🔁 State management (if using React) for better performance

📱 Mobile responsive layout

🧪 Basic test coverage using Jest or Moc
