const express = require('express');
const mysql = require('mysql2/promise');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'customerdb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

app.post('/identify', async (req, res) => {
  try {
    const { email, phoneNumber } = req.body;

    if (!email && !phoneNumber) {
      return res.status(400).json({ error: 'Email or phoneNumber is required' });
    }

    const connection = await pool.getConnection();
    let linkedId = null;

    try {
      const [primaryContact] = await connection.query(
        'SELECT * FROM Contact WHERE email = ? OR phoneNumber = ? LIMIT 1',
        [email, phoneNumber]
      );

      if (primaryContact) {
        linkedId = primaryContact.id;
      } else {
        const [result] = await connection.query(
          'INSERT INTO Contact (phoneNumber, email, linkedId, linkPrecedence) VALUES (?, ?, ?, ?)',
          [phoneNumber, email, null, 'primary']
        );
        linkedId = result.insertId;
      }
    } finally {
      connection.release();
    }

    const secondaryContacts = await pool.query(
      'SELECT * FROM Contact WHERE (email = ? OR phoneNumber = ?) AND id != ?',
      [email, phoneNumber, linkedId]
    );

    const consolidatedContact = {
      id: linkedId,
      phoneNumber,
      email,
      linkedId: null,
      linkPrecedence: 'primary',
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null
    };

    res.status(200).json({ consolidatedContact, secondaryContactIds: secondaryContacts.map((contact: any) => contact.id) });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(5000, () => {
  console.log('Server is running on port 5000');
});