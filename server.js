const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to Neon PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

// Initialize database
async function init() {
    try {
        // Create table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS restaurants (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                votes INTEGER DEFAULT 0
            )
        `);

        // Check if table is empty
        const result = await pool.query('SELECT COUNT(*) FROM restaurants');
        if (result.rows[0].count === '0') {
            // Add restaurants
            const restaurants = [
                'Revelry',
                'Cross The Road Chicken Co.',
                'MAP Brewing Company',
                'Ale Works',
                'Roost Fried Chicken'
            ];
            
            for (const name of restaurants) {
                await pool.query('INSERT INTO restaurants (name, votes) VALUES ($1, 0)', [name]);
            }
            console.log('✅ Added restaurants to database');
        }

        console.log('✅ Connected to Neon database');
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Get all restaurants
app.get('/api/restaurants', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM restaurants ORDER BY votes DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a vote
app.post('/api/vote', async (req, res) => {
    try {
        const { restaurantId } = req.body;
        
        // Increase vote count
        await pool.query('UPDATE restaurants SET votes = votes + 1 WHERE id = $1', [restaurantId]);
        
        // Get updated list
        const result = await pool.query('SELECT * FROM restaurants ORDER BY votes DESC');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Start server
const PORT = process.env.PORT || 3001;
init();
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
