const express = require('express')
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl:{
        rejectUnauthorized: false
    }
})

app.get('/api/projects', async (req, res) => {
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = 6;
        const offset = (page - 1) * limit;

        const result = await pool.query("SELECT * FROM projects WHERE type = 'project' ORDER BY created_at DESC LIMIT $1 OFFSET $2", [limit, offset]);
        
        const totalCount = await pool.query('SELECT COUNT(*) FROM projects');
        const totalPages = Math.ceil(parseInt(totalCount.rows[0].count) / limit);

        res.json({
            projects: projects.rows,
            totalPages: totalPages,
            currentPage: page
        });

    }catch (err){
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.get('/api/projects/category/:cat', async (req, res) => {
  try {
    const { cat } = req.params;
    const result = await pool.query('SELECT * FROM projects WHERE category = $1', [cat]);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

app.get('/api/products', async (req, res) =>{
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const offset = (page - 1) * limit;
        
        const productsQuery = await pool.query(
            "SELECT * FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2",
            [limit, offset]
        );

        const countQuery = await pool.query("SELECT COUNT(*) FROM products");
        const totalCount = parseInt(countQuery.rows[0].count);
        const totalPages = Math.ceil(totalCount / limit);

        res.json({
            products: productsQuery.rows,
            totalPages: totalPages,
            currentPage: page,
            totalItems: totalCount
        });
        
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

app.post('/api/upload_project', async (req, res) => {
    try {
        const { 
            name, 
            description, 
            image_url, 
            github_url, 
            tech_stack, 
            type, 
            category 
        } = req.body;

        const queryText = `
            INSERT INTO projects (
                name, description, image_url, github_url, tech_stack, type, category
            ) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *;
        `;

        const values = [
            name, 
            description, 
            image_url, 
            github_url, 
            tech_stack,
            type, 
            category
        ];

        const response = await pool.query(queryText, values);

        res.status(201).json({
            message: "Project uploaded successfully",
            project: response.rows[0]
        });

    } catch (err) {
        console.error("Database Error:", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

app.post('/api/upload_product', async (req, res) => {
    try{
        const {
            name,
            description,
            image_url,
            product_url,
            downloads,
        } = req.body;

        const query_text = `
            INSERT INTO products (name, description, image_url, product_url, downloads)
            VALUES($1, $2, $3, $4, $5)
        `
        const values = [name, description, image_url, product_url, downloads];
        const response = await pool.query(query_text, values);

        res.status(201).json({
            message: "Product uploaded successfully",
            product: response.rows[0]
        });
    } catch (err){
        console.error("Database Error: ", err.message);
        res.status(500).json({ error: "Internal Server Error" });
    }
});


app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});