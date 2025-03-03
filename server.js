require('dotenv').config();

const express = require('express');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const fetch = require('node-fetch');
const router = express.Router();
const sharp = require('sharp');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

// 앱 초기화
const app = express();
const PORT = process.env.PORT || 1999;

// 미들웨어 설정
app.use(bodyParser.json({ limit: '200mb' }));
app.use(bodyParser.urlencoded({ limit: '200mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Google OAuth 설정 추가
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// 사용자 직렬화 및 역직렬화
passport.serializeUser((user, done) => {
    done(null, user.user_id);
  });
  
  passport.deserializeUser((id, done) => {
    db.get('SELECT * FROM users WHERE user_id = ?', [id], (err, user) => {
      done(err, user);
    });
  });

// 세션 설정
app.use(session({
    store: new SQLiteStore({
      db: 'sessions.db',
      dir: __dirname
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000 // 24시간
    }
  }));

// Passport 초기화
app.use(passport.initialize());
app.use(passport.session());

// 데이터베이스 연결
const db = new sqlite3.Database('./ez2ranking.db', (err) => {
  if (err) {
    console.error('데이터베이스 연결 오류:', err.message);
  } else {
    console.log('SQLite 데이터베이스에 연결되었습니다.');
    
    initializeDatabase()
      .then(() => {
        console.log('Database initialization complete');
      })
      .catch(err => {
        console.error('데이터베이스 초기화 오류:', err);
        process.exit(1);
      });
  }
});

// 데이터베이스 초기화 함수 (사용자 테이블만 생성)
function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Create users table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      user_id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      email TEXT UNIQUE,
      display_name TEXT,
      profile_image TEXT,
      registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME,
      is_social_login BOOLEAN DEFAULT 0
    )`, (err) => {
      if (err) return reject(err);
      
      // Create songs table
      db.run(`CREATE TABLE IF NOT EXISTS songs (
        song_id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        artist TEXT,
        bpm INTEGER,
        duration TEXT
      )`, (err) => {
        if (err) return reject(err);
        
        // Create difficulties table
        db.run(`CREATE TABLE IF NOT EXISTS difficulties (
          difficulty_id INTEGER PRIMARY KEY AUTOINCREMENT,
          song_id INTEGER,
          difficulty_name TEXT NOT NULL,
          difficulty_level INTEGER,
          mode_name TEXT,
          FOREIGN KEY (song_id) REFERENCES songs(song_id)
        )`, (err) => {
          if (err) return reject(err);
          
          // Create records table
          db.run(`CREATE TABLE IF NOT EXISTS records (
            record_id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            difficulty_id INTEGER,
            score INTEGER NOT NULL,
            grade TEXT,
            accuracy REAL,
            combo INTEGER,
            play_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            image_url TEXT,
            FOREIGN KEY (user_id) REFERENCES users(user_id),
            FOREIGN KEY (difficulty_id) REFERENCES difficulties(difficulty_id)
          )`, (err) => {
            if (err) return reject(err);
            
            // Create rankings table
            db.run(`CREATE TABLE IF NOT EXISTS rankings (
              ranking_id INTEGER PRIMARY KEY AUTOINCREMENT,
              difficulty_id INTEGER,
              user_id INTEGER,
              score INTEGER,
              rank INTEGER,
              last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
              FOREIGN KEY (difficulty_id) REFERENCES difficulties(difficulty_id),
              FOREIGN KEY (user_id) REFERENCES users(user_id)
            )`, (err) => {
              if (err) return reject(err);
              
              // Create indexes
              db.run('CREATE INDEX IF NOT EXISTS idx_records_user ON records(user_id)', (err) => {
                if (err) return reject(err);
                
                db.run('CREATE INDEX IF NOT EXISTS idx_records_difficulty ON records(difficulty_id)', (err) => {
                  if (err) return reject(err);
                  
                  db.run('CREATE INDEX IF NOT EXISTS idx_rankings_difficulty ON rankings(difficulty_id)', (err) => {
                    if (err) return reject(err);
                    
                    db.run('CREATE INDEX IF NOT EXISTS idx_rankings_user ON rankings(user_id)', (err) => {
                      if (err) return reject(err);
                      
                      console.log('All tables and indexes created successfully');
                      resolve();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}

// 회원가입 API
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, displayName } = req.body;

  // 기본 유효성 검사
  if (!username || !email || !password) {
    return res.status(400).json({ error: '필수 필드를 모두 입력해주세요.' });
  }

  try {
    // 사용자명 중복 확인
    db.get('SELECT username FROM users WHERE username = ?', [username], async (err, row) => {
      if (err) {
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
      }
      
      if (row) {
        return res.status(400).json({ error: '이미 사용 중인 아이디입니다.' });
      }

      // 이메일 중복 확인
      db.get('SELECT email FROM users WHERE email = ?', [email], async (err, row) => {
        if (err) {
          return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
        
        if (row) {
          return res.status(400).json({ error: '이미 사용 중인 이메일입니다.' });
        }

        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10);

        // 사용자 등록
        db.run(
          'INSERT INTO users (username, email, password, display_name) VALUES (?, ?, ?, ?)',
          [username, email, hashedPassword, displayName || username],
          function(err) {
            if (err) {
              return res.status(500).json({ error: '사용자 등록 중 오류가 발생했습니다.' });
            }

            res.status(201).json({ 
              message: '회원가입이 완료되었습니다.',
              userId: this.lastID 
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

// 로그인 API
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;

  // 기본 유효성 검사
  if (!username || !password) {
    return res.status(400).json({ error: '아이디와 비밀번호를 모두 입력해주세요.' });
  }

  // 사용자 조회
  db.get(
    'SELECT user_id, username, password, display_name, profile_image FROM users WHERE username = ?',
    [username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
      }

      if (!user) {
        return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      }

      // 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: '아이디 또는 비밀번호가 올바르지 않습니다.' });
      }

      // 마지막 로그인 시간 업데이트
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE user_id = ?', [user.user_id]);

      // 세션에 사용자 정보 저장
      req.session.userId = user.user_id;
      req.session.username = user.username;
      req.session.displayName = user.display_name;

      res.json({
        user_id: user.user_id,
        username: user.username,
        display_name: user.display_name,
        profile_image: user.profile_image
      });
    }
  );
});

// Google 전략 설정
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL,
    scope: ['profile', 'email']
  },
  (accessToken, refreshToken, profile, done) => {
    // 이메일 정보 확인
    const email = profile.emails[0].value;
    
    // 기존 이메일로 가입된 사용자 확인
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err) return done(err);
      
      // 사용자가 존재하면 로그인 처리
      if (user) {
        return done(null, user);
      }
      
      // 새 사용자 생성
      try {
        // Google ID를 기반으로 username 생성
        const username = `google_${profile.id}`;
        const displayName = profile.displayName || email.split('@')[0];
        
        // 가상 비밀번호 생성 (소셜 로그인 사용자는 비밀번호로 로그인 불가)
        const randomPassword = Math.random().toString(36).slice(-10);
        const hashedPassword = await bcrypt.hash(randomPassword, 10);
        
        // 프로필 이미지 URL
        const profileImage = profile.photos && profile.photos.length > 0 
                           ? profile.photos[0].value 
                           : null;
        
        db.run(
            'INSERT INTO users (username, email, password, display_name, profile_image, is_social_login) VALUES (?, ?, ?, ?, ?, ?)',
            [username, email, hashedPassword, displayName, profileImage, 1], // is_social_login = 1
            function(err) {
                if (err) return done(err);
                              
                // 새로 생성된 사용자 조회
                db.get('SELECT * FROM users WHERE user_id = ?', [this.lastID], (err, newUser) => {
                    return done(null, newUser);
                });
            }
        );
      } catch (error) {
        return done(error);
      }
    });
  }
));

// Google 로그인 라우트
app.get('/auth/google',
    passport.authenticate('google', { scope: ['profile', 'email'] })
  );
  
  // Google 로그인 콜백
  app.get('/auth/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login.html' }),
    (req, res) => {
      // 세션에 사용자 정보 저장
      req.session.userId = req.user.user_id;
      req.session.username = req.user.username;
      req.session.displayName = req.user.display_name;
      
      // 로그인 성공 후 홈페이지로 리다이렉트
      res.redirect('/');
    }
  );

// 로그아웃 API
app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: '로그아웃 중 오류가 발생했습니다.' });
    }
    res.json({ message: '로그아웃되었습니다.' });
  });
});

// 현재 로그인한 사용자 정보 조회 API
app.get('/api/auth/me', (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: '로그인이 필요합니다.' });
    }
  
    db.get(
      'SELECT user_id, username, email, display_name, profile_image, registration_date FROM users WHERE user_id = ?',
      [req.session.userId],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
  
        if (!user) {
          return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
  
        // 필드 이름을 명확하게 유지하여 응답
        res.json({
          user_id: user.user_id,
          username: user.username,
          email: user.email,
          display_name: user.display_name,
          profile_image: user.profile_image,
          registration_date: user.registration_date
        });
      }
    );
  });

// 비밀번호 찾기 API (실제 이메일 발송은 구현하지 않음)
app.post('/api/auth/forgot-password', (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: '이메일을 입력해주세요.' });
  }

  db.get('SELECT user_id FROM users WHERE email = ?', [email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }

    // 실제 사용자가 있는지 여부와 상관없이 성공 응답 (보안 목적)
    res.json({ message: '비밀번호 재설정 링크가 이메일로 전송되었습니다.' });
  });
});

// 프로필 이미지 업로드 설정
const uploadDir = path.join(__dirname, 'public', 'uploads', 'profiles');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.session.userId;
    const fileExt = path.extname(file.originalname);
    const fileName = `profile_${userId}_${Date.now()}${fileExt}`;
    cb(null, fileName);
  }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
    cb(null, true);
  }
});

// 사용자 인증 확인 미들웨어
function checkAuthenticated(req, res, next) {
    if (req.session && req.session.userId) {
      return next();
    }
    res.status(401).json({ error: '로그인이 필요합니다.' });
  }

// 프로필 이미지 업로드 API
app.post('/api/profile/upload-image', checkAuthenticated, profileUpload.single('profileImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
  }

  // 이미지 URL 생성 (상대 경로)
  const imageUrl = `/uploads/profiles/${req.file.filename}`;
  
  res.json({
    message: '이미지가 성공적으로 업로드되었습니다.',
    imageUrl
  });
});

// 프로필 업데이트 API
app.post('/api/profile/update', checkAuthenticated, async (req, res) => {
    const { displayName, newPassword, profileImage } = req.body;
    const userId = req.session.userId;
  
    try {
      // 현재 사용자 정보 조회
      db.get('SELECT * FROM users WHERE user_id = ?', [userId], async (err, user) => {
        if (err) {
          return res.status(500).json({ error: '서버 오류가 발생했습니다.' });
        }
  
        if (!user) {
          return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
  
        // 소셜 로그인 사용자인지 확인
        const isSocialLogin = user.is_social_login === 1;
  
        // 업데이트할 필드 설정
        const updateFields = [];
        const updateValues = [];
  
        if (displayName) {
          updateFields.push('display_name = ?');
          updateValues.push(displayName);
        }
  
        if (profileImage) {
          updateFields.push('profile_image = ?');
          updateValues.push(profileImage);
        }
  
        // 소셜 로그인이 아닌 경우에만 비밀번호 변경 가능
        if (!isSocialLogin && newPassword) {
          const hashedPassword = await bcrypt.hash(newPassword, 10);
          updateFields.push('password = ?');
          updateValues.push(hashedPassword);
        }
  
        // 업데이트할 필드가 없으면 바로 성공 응답
        if (updateFields.length === 0) {
          return res.json({
            message: '변경된 내용이 없습니다.',
            userId: user.user_id
          });
        }
  
        // 사용자 정보 업데이트
        updateValues.push(userId); // WHERE 절의 user_id 값
        
        db.run(
          `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`,
          updateValues,
          function(err) {
            if (err) {
              console.error('프로필 업데이트 오류:', err);
              return res.status(500).json({ error: '프로필 업데이트 중 오류가 발생했습니다.' });
            }
  
            // 세션에 표시 이름 업데이트 (변경된 경우)
            if (displayName) {
              req.session.displayName = displayName;
            }
  
            // 업데이트된 사용자 정보 조회
            db.get(
              'SELECT user_id, username, email, display_name, profile_image, is_social_login FROM users WHERE user_id = ?',
              [userId],
              (err, updatedUser) => {
                if (err) {
                  return res.status(500).json({ error: '업데이트된 사용자 정보를 불러오는 중 오류가 발생했습니다.' });
                }
  
                res.json({
                  message: '프로필이 성공적으로 업데이트되었습니다.',
                  user: updatedUser
                });
              }
            );
          }
        );
      });
    } catch (error) {
      console.error('프로필 업데이트 처리 오류:', error);
      res.status(500).json({ error: '서버 오류가 발생했습니다.' });
    }
  });

// 기록 및 이미지 업로드 디렉토리 설정
const recordsUploadDir = path.join(__dirname, 'public', 'uploads', 'records');
if (!fs.existsSync(recordsUploadDir)) {
  fs.mkdirSync(recordsUploadDir, { recursive: true });
}

// 기록 이미지 업로드 설정
const recordStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, recordsUploadDir);
  },
  filename: (req, file, cb) => {
    const userId = req.session.userId;
    const fileExt = path.extname(file.originalname);
    const fileName = `record_${userId}_${Date.now()}${fileExt}`;
    cb(null, fileName);
  }
});

const recordUpload = multer({
  storage: recordStorage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB 제한
  fileFilter: (req, file, cb) => {
    // 이미지 파일만 허용
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('이미지 파일만 업로드 가능합니다.'), false);
    }
    cb(null, true);
  }
});

// Base64 이미지 데이터를 파일로 저장하는 함수
function saveBase64Image(base64Data, userId) {
  return new Promise((resolve, reject) => {
    try {
      // Base64 데이터에서 MIME 타입과 실제 데이터 부분 분리
      const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (!matches || matches.length !== 3) {
        return reject(new Error('잘못된 이미지 데이터 형식입니다.'));
      }
      
      const type = matches[1];
      const data = matches[2];
      const buffer = Buffer.from(data, 'base64');
      
      // 파일 확장자 결정
      let ext = '.jpg'; // 기본값
      if (type === 'image/png') ext = '.png';
      if (type === 'image/gif') ext = '.gif';
      
      // 파일명 생성
      const fileName = `record_${userId}_${Date.now()}${ext}`;
      const filePath = path.join(recordsUploadDir, fileName);
      
      // 파일 저장
      fs.writeFile(filePath, buffer, (err) => {
        if (err) return reject(err);
        
        // 상대 경로 반환
        resolve(`/uploads/records/${fileName}`);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// 이미지 업로드 API (Base64)
app.post('/api/records/upload-image', checkAuthenticated, async (req, res) => {
  try {
    // Base64 이미지 데이터 확인
    const { imageData } = req.body;
    
    if (!imageData) {
      return res.status(400).json({ error: '이미지 데이터가 필요합니다.' });
    }
    
    // 이미지 저장
    const imageUrl = await saveBase64Image(imageData, req.session.userId);
    
    res.json({
      message: '이미지가 성공적으로 업로드되었습니다.',
      imageUrl
    });
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    res.status(500).json({ error: '이미지 업로드 중 오류가 발생했습니다.' });
  }
});

// 이미지 업로드 API (Form Data)
app.post('/api/records/upload-file', checkAuthenticated, recordUpload.single('recordImage'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '이미지 파일이 필요합니다.' });
  }

  // 이미지 URL 생성 (상대 경로)
  const imageUrl = `/uploads/records/${req.file.filename}`;
  
  res.json({
    message: '이미지가 성공적으로 업로드되었습니다.',
    imageUrl
  });
});

// 곡 정보 조회 또는 생성 함수
function getOrCreateSong(songTitle, artist = null, callback) {
  // 곡 검색
  db.get('SELECT song_id FROM songs WHERE title = ?', [songTitle], (err, song) => {
    if (err) return callback(err);
    
    if (song) {
      // 기존 곡 반환
      return callback(null, song.song_id);
    }
    
    // 새로운 곡 생성
    db.run('INSERT INTO songs (title, artist) VALUES (?, ?)', [songTitle, artist], function(err) {
      if (err) return callback(err);
      
      callback(null, this.lastID);
    });
  });
}

// 난이도 정보 조회 또는 생성 함수
function getOrCreateDifficulty(songId, difficultyName, difficultyLevel, modeName, callback) {
  // 난이도와 모드 이름 모두 일치하는 레코드 검색
  db.get(
    'SELECT difficulty_id FROM difficulties WHERE song_id = ? AND difficulty_name = ? AND mode_name = ?',
    [songId, difficultyName, modeName],
    (err, difficulty) => {
      if (err) return callback(err);
      
      if (difficulty) {
        return callback(null, difficulty.difficulty_id);
      }
      
      // 클라이언트에서 받은 difficultyLevel 사용
      db.run(
        'INSERT INTO difficulties (song_id, difficulty_name, difficulty_level, mode_name) VALUES (?, ?, ?, ?)',
        [songId, difficultyName, difficultyLevel, modeName],
        function(err) {
          if (err) return callback(err);
          callback(null, this.lastID);
        }
      );
    }
  );
}

// 기록 등록 API
app.post('/api/records/submit', checkAuthenticated, async (req, res) => {
  // difficultyLevel 추가
  const { songTitle, difficulty, difficultyLevel, modeName, score, grade, accuracy, combo, imageUrl } = req.body;
  const userId = req.session.userId;
  
  // 필수 필드 확인 (difficultyLevel 포함)
  if (!songTitle || !difficulty || !difficultyLevel || !modeName || !score) {
    return res.status(400).json({ error: '필수 정보가 누락되었습니다.' });
  }
  
  // 곡 정보 조회 또는 생성
  getOrCreateSong(songTitle, null, (err, songId) => {
    if (err) {
      console.error('곡 정보 처리 오류:', err);
      return res.status(500).json({ error: '곡 정보 처리 중 오류가 발생했습니다.' });
    }
    
    // 수정된 getOrCreateDifficulty 함수 사용: difficultyLevel을 인자로 전달
    getOrCreateDifficulty(songId, difficulty, difficultyLevel, modeName, (err, difficultyId) => {
      if (err) {
        console.error('난이도 정보 처리 오류:', err);
        return res.status(500).json({ error: '난이도 정보 처리 중 오류가 발생했습니다.' });
      }
      
      // 기록 저장
      db.run(
        `INSERT INTO records 
         (user_id, difficulty_id, score, grade, accuracy, combo, image_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [userId, difficultyId, score, grade, accuracy, combo, imageUrl],
        function(err) {
          if (err) {
            console.error('기록 저장 오류:', err);
            return res.status(500).json({ error: '기록 저장 중 오류가 발생했습니다.' });
          }
          
          const recordId = this.lastID;
          updateRanking(userId, difficultyId, score);
          
          res.status(201).json({
            message: '기록이 성공적으로 등록되었습니다.',
            recordId
          });
        }
      );
    });
  });
});

// 사용자 기록 조회 API
app.get('/api/records/user', checkAuthenticated, (req, res) => {
  const userId = req.session.userId;
  
  db.all(`
    SELECT 
      r.record_id, 
      s.title AS song_title, 
      d.difficulty_name, 
      d.mode_name,
      r.score, 
      r.grade, 
      r.accuracy,
      r.combo,
      r.play_date,
      r.image_url
    FROM records r
    JOIN difficulties d ON r.difficulty_id = d.difficulty_id
    JOIN songs s ON d.song_id = s.song_id
    WHERE r.user_id = ?
    ORDER BY r.play_date DESC
  `, [userId], (err, records) => {
    if (err) {
      console.error('기록 조회 오류:', err);
      return res.status(500).json({ error: '기록 조회 중 오류가 발생했습니다.' });
    }
    
    res.json(records);
  });
});

// Modify the API endpoint at GET /api/records/:recordId
app.get('/api/records/:recordId', checkAuthenticated, (req, res) => {
  const recordId = req.params.recordId;
  const userId = req.session.userId;
  
  db.get(`
    SELECT 
      r.record_id, 
      s.title AS song_title, 
      d.difficulty_name, 
      d.mode_name,
      r.score, 
      r.grade, 
      r.accuracy,
      r.combo,
      r.play_date,
      r.image_url,
      r.user_id
    FROM records r
    JOIN difficulties d ON r.difficulty_id = d.difficulty_id
    JOIN songs s ON d.song_id = s.song_id
    WHERE r.record_id = ?
  `, [recordId], (err, record) => {
    if (err) {
      console.error('기록 조회 오류:', err);
      return res.status(500).json({ error: '기록 조회 중 오류가 발생했습니다.' });
    }
    
    if (!record) {
      return res.status(404).json({ error: '기록을 찾을 수 없습니다.' });
    }
    
    // 본인의 기록이 아니면 접근 거부
    if (record.user_id !== userId) {
      return res.status(403).json({ error: '다른 사용자의 기록에 접근할 수 없습니다.' });
    }
    
    res.json(record);
  });
});

// 임시 파일 저장을 위한 multer 설정
const dngStorage = multer.diskStorage({
  destination: function(req, file, cb) {
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    cb(null, tempDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'dng-upload-' + uniqueSuffix + ext);
  }
});

const dngUpload = multer({ 
  storage: dngStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB 제한
  fileFilter: (req, file, cb) => {
    // DNG 파일인지 확인
    if (file.originalname.toLowerCase().endsWith('.dng')) {
      cb(null, true);
    } else {
      cb(new Error('DNG 파일만 업로드 가능합니다.'), false);
    }
  }
});

// DNG to JPG 변환 엔드포인트
app.post('/api/convert/dng-to-jpg', dngUpload.single('dngFile'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'DNG 파일이 제공되지 않았습니다.' });
  }

  try {
    const inputPath = req.file.path;
    const outputPath = path.join(path.dirname(inputPath), `${path.basename(inputPath, path.extname(inputPath))}.jpg`);
    
    // Sharp 라이브러리를 사용하여 DNG를 JPG로 변환
    try {
      await sharp(inputPath)
        .toFormat('jpeg', { quality: 20 }) // 20% 품질로 JPG 변환
        .toFile(outputPath);
    } catch (sharpError) {
      console.error('Sharp 변환 실패:', sharpError);
      
      return res.status(500).json({ 
        error: 'DNG 파일을 JPG로 변환하는 중 오류가 발생했습니다.',
        details: sharpError.message
      });
    }
    
    // 변환된 JPG 파일을 Base64로 읽기
    const jpgData = fs.readFileSync(outputPath);
    const base64Data = `data:image/jpeg;base64,${jpgData.toString('base64')}`;
    
    // 임시 파일 삭제
    fs.unlinkSync(inputPath); // DNG 파일 삭제
    fs.unlinkSync(outputPath); // JPG 파일 삭제
    
    res.json({
      message: 'DNG 파일이 성공적으로 JPG로 변환되었습니다.',
      jpgDataUrl: base64Data
    });
    
  } catch (error) {
    console.error('DNG 변환 오류:', error);
    
    // 임시 파일 정리 시도
    try {
      if (req.file && req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    } catch (cleanupError) {
      console.error('임시 파일 정리 오류:', cleanupError);
    }
    
    res.status(500).json({ 
      error: 'DNG 파일 변환 중 오류가 발생했습니다.',
      details: error.message
    });
  }
});

// 기록 수정 API
app.put('/api/records/:recordId', checkAuthenticated, (req, res) => {
  const recordId = req.params.recordId;
  const userId = req.session.userId;
  const { score, grade, accuracy, combo, imageUrl } = req.body;
  
  // 먼저 기록이 사용자의 것인지 확인
  db.get('SELECT user_id, difficulty_id FROM records WHERE record_id = ?', [recordId], (err, record) => {
    if (err) {
      console.error('기록 조회 오류:', err);
      return res.status(500).json({ error: '기록 조회 중 오류가 발생했습니다.' });
    }
    
    if (!record) {
      return res.status(404).json({ error: '기록을 찾을 수 없습니다.' });
    }
    
    // 본인의 기록이 아니면 접근 거부
    if (record.user_id !== userId) {
      return res.status(403).json({ error: '다른 사용자의 기록을 수정할 수 없습니다.' });
    }
    
    // 수정할 필드 설정
    const updateFields = [];
    const updateValues = [];
    
    if (score !== undefined) {
      updateFields.push('score = ?');
      updateValues.push(score);
    }
    
    if (grade !== undefined) {
      updateFields.push('grade = ?');
      updateValues.push(grade);
    }
    
    if (accuracy !== undefined) {
      updateFields.push('accuracy = ?');
      updateValues.push(accuracy);
    }
    
    if (combo !== undefined) {
      updateFields.push('combo = ?');
      updateValues.push(combo);
    }
    
    if (imageUrl) {
      updateFields.push('image_url = ?');
      updateValues.push(imageUrl);
    }
    
    // 수정할 필드가 없으면 바로 성공 응답
    if (updateFields.length === 0) {
      return res.json({
        message: '변경된 내용이 없습니다.',
        recordId
      });
    }
    
    // 기록 업데이트
    updateValues.push(recordId);
    
    db.run(
      `UPDATE records SET ${updateFields.join(', ')} WHERE record_id = ?`,
      updateValues,
      function(err) {
        if (err) {
          console.error('기록 수정 오류:', err);
          return res.status(500).json({ error: '기록 수정 중 오류가 발생했습니다.' });
        }
        
        // 점수가 변경되었으면 랭킹 업데이트
        if (score !== undefined) {
          updateRanking(userId, record.difficulty_id, score);
        }
        
        res.json({
          message: '기록이 성공적으로 수정되었습니다.',
          recordId
        });
      }
    );
  });
});

// 기록 삭제 API
app.delete('/api/records/:recordId', checkAuthenticated, (req, res) => {
  const recordId = req.params.recordId;
  const userId = req.session.userId;
  
  // 먼저 기록이 사용자의 것인지 확인
  db.get('SELECT user_id, image_url FROM records WHERE record_id = ?', [recordId], (err, record) => {
    if (err) {
      console.error('기록 조회 오류:', err);
      return res.status(500).json({ error: '기록 조회 중 오류가 발생했습니다.' });
    }
    
    if (!record) {
      return res.status(404).json({ error: '기록을 찾을 수 없습니다.' });
    }
    
    // 본인의 기록이 아니면 접근 거부
    if (record.user_id !== userId) {
      return res.status(403).json({ error: '다른 사용자의 기록을 삭제할 수 없습니다.' });
    }
    
    // 기록 삭제
    db.run('DELETE FROM records WHERE record_id = ?', [recordId], function(err) {
      if (err) {
        console.error('기록 삭제 오류:', err);
        return res.status(500).json({ error: '기록 삭제 중 오류가 발생했습니다.' });
      }
      
      // 이미지 파일이 있으면 삭제
      if (record.image_url) {
        try {
          const imagePath = path.join(__dirname, 'public', record.image_url);
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        } catch (error) {
          console.error('이미지 파일 삭제 오류:', error);
          // 파일 삭제 실패해도 기록 삭제는 성공으로 처리
        }
      }
      
      res.json({
        message: '기록이 성공적으로 삭제되었습니다.'
      });
    });
  });
});

// 랭킹 업데이트 함수
function updateRanking(userId, difficultyId, newScore) {
  // 기존 랭킹 확인
  db.get(
    'SELECT ranking_id, score FROM rankings WHERE user_id = ? AND difficulty_id = ?',
    [userId, difficultyId],
    (err, ranking) => {
      if (err) {
        console.error('랭킹 조회 오류:', err);
        return;
      }

      if (ranking) {
        // 기존 기록보다 높은 점수면 업데이트
        if (newScore > ranking.score) {
          db.run(
            'UPDATE rankings SET score = ?, last_updated = CURRENT_TIMESTAMP WHERE ranking_id = ?',
            [newScore, ranking.ranking_id],
            err => {
              if (err) console.error('랭킹 업데이트 오류:', err);
              // 랭킹 순위 재계산
              recalculateRanks(difficultyId);
            }
          );
        }
      } else {
        // 랭킹 신규 등록
        db.run(
          'INSERT INTO rankings (user_id, difficulty_id, score, rank) VALUES (?, ?, ?, 9999)',
          [userId, difficultyId, newScore],
          err => {
            if (err) console.error('랭킹 등록 오류:', err);
            // 랭킹 순위 재계산
            recalculateRanks(difficultyId);
          }
        );
      }
    }
  );
}

// 랭킹 순위 재계산 함수
function recalculateRanks(difficultyId) {
  db.all(
    'SELECT ranking_id, score FROM rankings WHERE difficulty_id = ? ORDER BY score DESC',
    [difficultyId],
    (err, rankings) => {
      if (err) {
        console.error('랭킹 목록 조회 오류:', err);
        return;
      }

      // 트랜잭션 시작
      db.run('BEGIN TRANSACTION', err => {
        if (err) {
          console.error('트랜잭션 시작 오류:', err);
          return;
        }

        // 각 랭킹의 순위 업데이트
        let updatePromises = rankings.map((ranking, index) => {
          return new Promise((resolve, reject) => {
            db.run(
              'UPDATE rankings SET rank = ? WHERE ranking_id = ?',
              [index + 1, ranking.ranking_id],
              err => {
                if (err) reject(err);
                else resolve();
              }
            );
          });
        });

        // 모든 업데이트가 완료되면 트랜잭션 커밋
        Promise.all(updatePromises)
          .then(() => {
            db.run('COMMIT', err => {
              if (err) console.error('트랜잭션 커밋 오류:', err);
            });
          })
          .catch(err => {
            console.error('랭킹 순위 업데이트 오류:', err);
            db.run('ROLLBACK', err => {
              if (err) console.error('트랜잭션 롤백 오류:', err);
            });
          });
      });
    }
  );
}

// 랭킹 조회 API
app.get('/api/rankings', (req, res) => {
  const { songTitle, difficulty, modeName } = req.query;
  
  // 기본 쿼리
  let query = `
    SELECT 
      rk.ranking_id,
      rk.rank,
      rk.score,
      rk.last_updated,
      u.user_id,
      u.display_name,
      u.profile_image,
      s.title AS song_title,
      d.difficulty_name,
      d.mode_name,
      d.difficulty_level
    FROM rankings rk
    JOIN users u ON rk.user_id = u.user_id
    JOIN difficulties d ON rk.difficulty_id = d.difficulty_id
    JOIN songs s ON d.song_id = s.song_id
  `;
  
  const queryParams = [];
  
  // 검색 필터 적용
  if (songTitle || difficulty || modeName) {
    query += ' WHERE';
    
    let conditions = [];
    
    if (songTitle) {
      conditions.push(' s.title LIKE ?');
      queryParams.push(`%${songTitle}%`);
    }
    
    if (difficulty) {
      conditions.push(' d.difficulty_name = ?');
      queryParams.push(difficulty);
    }
    
    if (modeName) {
      conditions.push(' d.mode_name = ?');
      queryParams.push(modeName);
    }
    
    query += conditions.join(' AND');
  }
  
  // 정렬 및 제한
  query += ' ORDER BY rk.rank ASC LIMIT 100';
  
  db.all(query, queryParams, (err, rankings) => {
    if (err) {
      console.error('랭킹 조회 오류:', err);
      return res.status(500).json({ error: '랭킹 조회 중 오류가 발생했습니다.' });
    }
    
    res.json(rankings);
  });
});

// 특정 난이도의 랭킹 조회 API
app.get('/api/rankings/difficulty/:difficultyId', (req, res) => {
  const difficultyId = req.params.difficultyId;
  
  db.all(`
    SELECT 
      rk.ranking_id,
      rk.rank,
      rk.score,
      rk.last_updated,
      u.user_id,
      u.display_name,
      u.profile_image,
      s.title AS song_title,
      d.difficulty_name,
      d.difficulty_level,
      d.mode_name,
      r.grade
    FROM rankings rk
    JOIN users u ON rk.user_id = u.user_id
    JOIN difficulties d ON rk.difficulty_id = d.difficulty_id
    JOIN songs s ON d.song_id = s.song_id
    LEFT JOIN records r ON rk.user_id = r.user_id AND rk.difficulty_id = r.difficulty_id AND rk.score = r.score
    WHERE rk.difficulty_id = ?
    ORDER BY rk.rank ASC
    LIMIT 100
  `, [difficultyId], (err, rankings) => {
    if (err) {
      console.error('랭킹 조회 오류:', err);
      return res.status(500).json({ error: '랭킹 조회 중 오류가 발생했습니다.' });
    }
    
    res.json(rankings);
  });
});

// 사용자의 랭킹 조회 API
app.get('/api/rankings/user/:userId', (req, res) => {
  const targetUserId = req.params.userId;
  
  // 로그인 확인 (다른 사용자의 랭킹을 볼 때)
  if (targetUserId != req.session.userId && !req.session.userId) {
    return res.status(401).json({ error: '로그인이 필요합니다.' });
  }
  
  db.all(`
    SELECT 
      rk.ranking_id,
      rk.rank,
      rk.score,
      rk.last_updated,
      s.title AS song_title,
      d.difficulty_name,
      d.difficulty_level
    FROM rankings rk
    JOIN difficulties d ON rk.difficulty_id = d.difficulty_id
    JOIN songs s ON d.song_id = s.song_id
    WHERE rk.user_id = ?
    ORDER BY rk.rank ASC
  `, [targetUserId], (err, rankings) => {
    if (err) {
      console.error('랭킹 조회 오류:', err);
      return res.status(500).json({ error: '랭킹 조회 중 오류가 발생했습니다.' });
    }
    
    res.json(rankings);
  });
});

// 특정 곡의 랭킹 조회 API
app.get('/api/rankings/song/:songId', (req, res) => {
  const songId = req.params.songId;
  
  db.all(`
    SELECT 
      rk.ranking_id,
      rk.rank,
      rk.score,
      rk.last_updated,
      u.user_id,
      u.display_name,
      u.profile_image,
      d.difficulty_name,
      d.difficulty_level
    FROM rankings rk
    JOIN users u ON rk.user_id = u.user_id
    JOIN difficulties d ON rk.difficulty_id = d.difficulty_id
    WHERE d.song_id = ?
    ORDER BY d.difficulty_level ASC, rk.rank ASC
  `, [songId], (err, rankings) => {
    if (err) {
      console.error('랭킹 조회 오류:', err);
      return res.status(500).json({ error: '랭킹 조회 중 오류가 발생했습니다.' });
    }
    
    res.json(rankings);
  });
});

// 곡 목록 조회 API
app.get('/api/songs', (req, res) => {
  const { search } = req.query;
  
  let query = 'SELECT * FROM songs';
  const params = [];
  
  if (search) {
    query += ' WHERE title LIKE ?';
    params.push(`%${search}%`);
  }
  
  query += ' ORDER BY title ASC';
  
  db.all(query, params, (err, songs) => {
    if (err) {
      console.error('곡 목록 조회 오류:', err);
      return res.status(500).json({ error: '곡 목록을 불러오는 중 오류가 발생했습니다.' });
    }
    
    res.json(songs);
  });
});

// 특정 곡의 난이도 목록 조회 API
app.get('/api/songs/:songId/difficulties', (req, res) => {
  const songId = req.params.songId;
  
  db.all(`
    SELECT * FROM difficulties
    WHERE song_id = ?
    ORDER BY difficulty_level ASC
  `, [songId], (err, difficulties) => {
    if (err) {
      console.error('난이도 목록 조회 오류:', err);
      return res.status(500).json({ error: '난이도 목록을 불러오는 중 오류가 발생했습니다.' });
    }
    
    res.json(difficulties);
  });
});

// 랭킹 조회 API
app.get('/api/rankings', (req, res) => {
  const { songTitle, difficulty } = req.query;
  
  // 검색 조건이 없는 경우 전체 상위 랭킹 반환
  if (!songTitle && !difficulty) {
    db.all(`
      SELECT 
        rk.rank,
        u.display_name,
        u.profile_image,
        s.title AS song_title,
        d.difficulty_name,
        rk.score
      FROM rankings rk
      JOIN users u ON rk.user_id = u.user_id
      JOIN difficulties d ON rk.difficulty_id = d.difficulty_id
      JOIN songs s ON d.song_id = s.song_id
      ORDER BY rk.score DESC
      LIMIT 50
    `, [], (err, rankings) => {
      if (err) {
        console.error('랭킹 조회 오류:', err);
        return res.status(500).json({ error: '랭킹 조회 중 오류가 발생했습니다.' });
      }
      
      res.json(rankings);
    });
    return;
  }
  
  // 곡 또는 난이도 지정 검색
  let query = `
    SELECT 
      rk.rank,
      u.display_name,
      u.profile_image,
      s.title AS song_title,
      d.difficulty_name,
      rk.score
    FROM rankings rk
    JOIN users u ON rk.user_id = u.user_id
    JOIN difficulties d ON rk.difficulty_id = d.difficulty_id
    JOIN songs s ON d.song_id = s.song_id
    WHERE 1=1
  `;
  
  const params = [];
  
  if (songTitle) {
    query += ` AND s.title LIKE ?`;
    params.push(`%${songTitle}%`);
  }
  
  if (difficulty) {
    query += ` AND d.difficulty_name = ?`;
    params.push(difficulty);
  }
  
  query += ` ORDER BY rk.score DESC LIMIT 50`;
  
  db.all(query, params, (err, rankings) => {
    if (err) {
      console.error('랭킹 조회 오류:', err);
      return res.status(500).json({ error: '랭킹 조회 중 오류가 발생했습니다.' });
    }
    
    res.json(rankings);
  });
});

async function uploadRecord(recordData) {
  try {
      showLoading();
      
      // FormData 객체 생성 및 이미지 처리
      const imageFile = recordData.imageFile;
      let imageUrl = null;
      
      // 이미지 파일이 있는 경우 먼저 업로드
      if (imageFile) {
          const imageFormData = new FormData();
          imageFormData.append('recordImage', imageFile);
          
          const imageResponse = await fetch('/api/records/upload-file', {
              method: 'POST',
              body: imageFormData
          });
          
          if (!imageResponse.ok) {
              throw new Error('이미지 업로드에 실패했습니다.');
          }
          
          const imageData = await imageResponse.json();
          imageUrl = imageData.imageUrl;
      }
      
      // 기록 데이터 준비
      const recordSubmitData = {
          songTitle: recordData.songTitle,
          difficulty: recordData.difficulty,
          modeName: recordData.modeName, // 모드 이름 추가 (5k only, 5k ruby 등)
          score: parseInt(recordData.score),
          grade: recordData.grade || null,
          accuracy: recordData.accuracy ? parseFloat(recordData.accuracy) : null,
          combo: recordData.combo ? parseInt(recordData.combo) : null,
          imageUrl: imageUrl
      };
      
      // 기록 업로드 API 호출
      const response = await fetch('/api/records/submit', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify(recordSubmitData)
      });
      
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || '기록 업로드에 실패했습니다.');
      }
      
      const data = await response.json();
      return {
          success: true,
          message: data.message,
          recordId: data.recordId
      };
      
  } catch (error) {
      console.error('기록 업로드 오류:', error);
      return {
          success: false,
          message: error.message
      };
  } finally {
      hideLoading();
  }
}

// Gemini API integration for image analysis
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Configure the Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Gemini API integration for image analysis
app.post('/api/records/analyze-image', checkAuthenticated, async (req, res) => {
  try {
    const { imageUrl } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({ error: '이미지 URL이 필요합니다.' });
    }
    
    // Get the full path to the image
    const imagePath = path.join(__dirname, 'public', imageUrl);
    
    // Check if the file exists
    if (!fs.existsSync(imagePath)) {
      return res.status(404).json({ error: '이미지 파일을 찾을 수 없습니다.' });
    }
    
    // Read the image file as base64
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    // Create a Gemini model instance with specific configuration
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash",
      generationConfig: {
        temperature: 0.1,  // 낮은 온도로 더 결정적인 응답 생성
        maxOutputTokens: 2048,
      }
    });
    
    // Gemini API에 직접 요청 - generateContent 사용
    try {
      const result = await model.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              { text: "Analyze this EZ2DJ gameplay result and extract the following information in JSON format: song name, mode name (e.g. 5K ONLY, STANDARD), difficulty type (NM, HD, SHD, EX) - Remove any MIX text after it, difficulty level, rank/grade, score, accuracy if visible." },
              { 
                inlineData: { 
                  mimeType: "image/jpeg",
                  data: imageBase64
                }
              }
            ]
          }
        ]
      });
      
      const response = result.response;
      const responseText = response.text();
      
      console.log("Gemini API raw response:", responseText);
      
      // JSON 응답 추출 시도
      try {
        // JSON 형식 패턴 찾기
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        let analysisData;
        
        if (jsonMatch) {
          // 원본 데이터 파싱
          const rawData = JSON.parse(jsonMatch[0]);
          console.log("Parsed analysis data:", rawData);
          
          // 클라이언트가 기대하는 형식으로 변환
          analysisData = {
            songName: rawData.song_name || "",
            modeName: rawData.mode_name || "",
            difficultyType: rawData.difficulty_type || "",
            difficultyLevel: parseInt(rawData.difficulty_level) || 0,
            rank: rawData["rank/grade"] || rawData.rank || "",
            score: parseInt(String(rawData.score).replace(/^0+/, '')) || 0, // 앞의 0 제거
            maxCombo: rawData.max_combo || rawData.combo || 0,
            accuracy: parseFloat(String(rawData.accuracy).replace('%', '')) || 0 // % 제거
          };
        } else {
          console.log("Could not find JSON in response");
          analysisData = {
            songName: "",
            modeName: "",
            difficultyType: "",
            difficultyLevel: 0,
            rank: "",
            score: 0
          };
        }
        
        return res.json(analysisData);
      } catch (parseError) {
        console.error('JSON 파싱 오류:', parseError);
        return res.status(500).json({ 
          error: 'API 응답 파싱 오류', 
          rawResponse: responseText 
        });
      }
    } catch (geminiError) {
      console.error('Gemini API 호출 오류:', geminiError);
      return res.status(500).json({ 
        error: '이미지 분석 API 호출 중 오류가 발생했습니다.', 
        details: geminiError.message 
      });
    }
  } catch (error) {
    console.error('이미지 분석 전체 오류:', error);
    return res.status(500).json({ error: '이미지 분석 중 오류가 발생했습니다.' });
  }
});

// HTML 파일 제공 (SPA를 위한 폴백 라우트)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 시작
app.listen(PORT, () => {
  console.log(`서버가 포트 ${PORT}에서 실행 중입니다.`);
});

// 프로세스 종료 시 데이터베이스 연결 종료
process.on('SIGINT', () => {
  db.close();
  console.log('데이터베이스 연결이 종료되었습니다.');
  process.exit(0);
});
