CREATE TABLE user (
  user_id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT,
  username TEXT UNIQUE,
  password TEXT,
  gender TEXT
);

CREATE TABLE tweet (
  tweet_id INTEGER PRIMARY KEY AUTOINCREMENT,
  tweet TEXT,
  user_id INTEGER,
  date_time TEXT,
  FOREIGN KEY (user_id) REFERENCES user(user_id)
);

CREATE TABLE follower (
  follower_id INTEGER PRIMARY KEY AUTOINCREMENT,
  follower_user_id INTEGER,
  following_user_id INTEGER,
  FOREIGN KEY (follower_user_id) REFERENCES user(user_id),
  FOREIGN KEY (following_user_id) REFERENCES user(user_id)
);

CREATE TABLE reply (
  reply_id INTEGER PRIMARY KEY AUTOINCREMENT,
  tweet_id INTEGER,
  user_id INTEGER,
  reply TEXT,
  FOREIGN KEY (tweet_id) REFERENCES tweet(tweet_id),
  FOREIGN KEY (user_id) REFERENCES user(user_id)
);

CREATE TABLE like (
  like_id INTEGER PRIMARY KEY AUTOINCREMENT,
  tweet_id INTEGER,
  user_id INTEGER,
  FOREIGN KEY (tweet_id) REFERENCES tweet(tweet_id),
  FOREIGN KEY (user_id) REFERENCES user(user_id)
);
