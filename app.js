const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');

const app = express();
const port = 80;

// MySQL configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE,
};

// Create a MySQL connection pool
const pool = mysql.createPool(dbConfig);

// Middleware to parse incoming request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/gps', (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error establishing connection to MySQL:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    const selectQuery = 'SELECT data FROM data ORDER BY timestamp ASC';
    connection.query(selectQuery, (err, results) => {
      connection.release();
      if (err) {
        console.error('Error executing MySQL query:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'GPS data not found' });
      }

      const gpsDataArray = results.map(row => row.data.trim());
      return res.status(200).json({ gpsDataArray });
    });
  });
});

// POST route to handle data logging
app.post('/gps', (req, res) => {
  const dataToLog = req.body.data;
  const queryKey = req.query.access;

  // Check if the query parameter "key" is present and has the value "verySecret"
  if (queryKey !== process.env.GPS_ACCESS_KEY) {
    return res.status(403).json({ error: 'You shall not pass!!!' });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Error establishing connection to MySQL:', err);
      return res.status(500).json({ error: err });
    }

    const insertQuery = 'INSERT INTO data (data) VALUES (?)';
    connection.query(insertQuery, [dataToLog], (err, result) => {
      connection.release();
      if (err) {
        console.error('Error executing MySQL query:', err);
        return res.status(500).json({ error: err });
      }

      console.log('Data logged successfully:', result);
      return res.status(200).json({ message: 'Data logged successfully' });
    });
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running`);
});
