const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');

const app = express();
const db = new sqlite3.Database('./database.db');

app.use(bodyParser.urlencoded({ extended: true}));
app.use(express.static('public'));

// Configure Multer For Image File Uploads
const storage = multer.diskStorage({
    destination: './public/uploads/',
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});
const upload = multer({ storage });

// Initialize Database
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        category TEXT,
        content TEXT NOT NULL,
        image TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// posts
app.get('/posts', (req, res) => {
    db.all('SELECT * FROM posts ORDER BY created_at DESC', [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

app.get('/post/:title', (req, res) => {
    const postTitle = req.params.title.replace(/-/g, '').trim();
    db.get(
        'SELECT * FROM posts WHERE TRIM(LOWER(title)) =?',
        [postTitle.toLowerCase()],
        (err, row) => {
            if (err) {
                res.status(500).json({ error: 'Database error' });
                return;
            }
            if (!row) {
                res.status(404).json({ error: 'Post Not Found' });
                return;
            }
            res.json(row);
        }
    );
});

app.get('/post-details/:title', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'post-details.html'));
});

app.post('/add', (req, res) => {
    const { title, category, content, image } = req.body;

    console.log("Received data:", { title, category, content, image }); // Debugging

    db.run(
        'INSERT INTO posts (title, category, content, image, created_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [title, category, content, image],
        (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Error adding post');
            }
            console.log('Post added successfully');
            res.redirect('/');
        }
    );
});

// Delete Route
app.post('/delete/:id', (req, res) => {
    const id = req.params.id;
    db.run('DELETE FROM posts WHERE id = ?', id, (err) => {
        if (err) {
            console.log(err.message);
            return res.status(500).send({ message: "Failed to delete post" });
        }
        res.status(200).send({ message: "Post deleted successfully" });
    });
});

app.get('/add', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'add.html'));
});


app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'admin.html'));
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});