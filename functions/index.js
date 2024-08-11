const functions = require('firebase-functions');
const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

admin.initializeApp();
const db = admin.firestore();

const app = express();
app.use(express.json());
app.use(cors());

// Your API routes (same as previously defined)
app.get('/books', async (req, res) => {
  try {
    const booksSnapshot = await db.collection('books').get();
    const books = booksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.get('/books/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const bookref = db.collection('books').doc(id);
    const bookDoc = await bookref.get();

    if (!bookDoc.exists) {
      return res.status(404).json({ error: 'Book not found' });
    }

    // Fetch comments
    const commentsRef = bookref.collection('comments');
    const commentSnapshot = await commentsRef.get();

    let comments = [];
    if (!commentSnapshot.empty) {
      comments = commentSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    }

    res.status(200).json({ id: bookDoc.id, ...bookDoc.data(), comments: comments });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});


app.post('/books', async (req, res) => {
  const { name, author, genre, description, imageUrl } = req.body;
  try {
    const newBookRef = db.collection('books').doc();
    await newBookRef.set({
      name,
      author,
      genre,
      description,
      imageUrl,
    });
    res.status(201).json({ id: newBookRef.id, name, author, genre, description, imageUrl });
  } catch (error) {
    res.status(500).json({ error: 'Failed to add book' });
  }
});

app.post('/books/:id/comments', async (req, res) => {
  const { id } = req.params;
  const { username, comment } = req.body;
  try {
    const bookRef = db.collection('books').doc(id);
    const bookDoc = await bookRef.get();
    if (!bookDoc.exists) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const commentsRef = bookRef.collection('comments').doc();
    await commentsRef.set({
      username,
      comment,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(201).json({ message: 'Comment added successfully' });
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Export the app as a Firebase Cloud Function
exports.api = functions.https.onRequest(app);
