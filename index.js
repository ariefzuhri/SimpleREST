const express = require('express');
const app = express(); 

app.get('/', (req, res) => { 
  res.send('Daily Money Tracker RESTful API');
}) 
app.listen(3000, () => console.log("Server running on http://localhost:3000"))

// Konfigurasi koneksi database dengan Sequelize
const Sequelize = require('sequelize');
const sequelize = new Sequelize('daily_money_tracker', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    }
});

// Model untuk merepresentasikan tabel record menjadi objek
const record = sequelize.define('record', {
    'id': {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    'category': Sequelize.STRING,
    'income': Sequelize.INTEGER,
    'expense': Sequelize.INTEGER,
    'date': Sequelize.STRING,
    'invoice': {
        type: Sequelize.STRING,
        // Set custom getter for book image using URL
        get(){
            const invoice = this.getDataValue('invoice');
            return "/img/"+invoice;
        }
    },
    'createdAt': {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },    
    'updatedAt': {
        type: Sequelize.DATE,
        defaultValue: Sequelize.NOW
    },   
    
}, {
    // Prevent sequelize transform table name into plural
    freezeTableName: true,
})

// CRUD Read -> GET: /record
app.get('/record/', (req, res) => {
    record.findAll().then(record => {
        res.json(record)
    })
})

/*
body-parser: middleware yang digunakan untuk mem-parsing request body
express-validator: digunakan untuk validasi input form
multer: middleware untuk menangani mulipart/form data (kita gunakan untuk upload gambar)
*/
const bodyParser = require('body-parser'); // Post body handler
const { check, validationResult } = require('express-validator/check'); // Form validation
const { matchedData, sanitize } = require('express-validator/filter'); // Sanitize form params
const multer  = require('multer'); // Multipar form-data
const path = require('path');
const crypto = require('crypto');

// Set body parser for HTTP post operation
app.use(bodyParser.json()); // Support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // Support encoded bodi

// Set static assets to public directory
app.use(express.static('public'));
const uploadDir = '/img/';
const storage = multer.diskStorage({
    destination: "./public"+uploadDir,
    filename: function (req, file, cb) {
      crypto.pseudoRandomBytes(16, function (err, raw) {
        if (err) return cb(err)  

        cb(null, raw.toString('hex') + path.extname(file.originalname))
      })
    }
})

const upload = multer({storage: storage, dest: uploadDir });

// CRUD Create -> POST: /record
app.post('/record/', [
    // File upload (karena pakai multer, tempatkan di posisi pertama agar membaca multipar form-data)
    upload.single('invoice'),

    // Set form validation rule
    check('category')
        .isLength({min: 3}),
    check('income')
        .isLength({min: 1, max:11})
        .isNumeric(),
    check('expense')
        .isLength({min: 1, max:11})
        .isNumeric(),
    check('date')
        .isLength({min: 10})
],(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.mapped() });
    }

    record.create({
        category: req.body.category,
        income: req.body.income,
        expense: req.body.expense,
        date: req.body.date,
        invoice: req.file === undefined ? "" : req.file.filename
    }).then(newRecord => {
        res.json({
            "status":"success",
            "message":"Record added",
            "data": newRecord
        })
    })
})

// CRUD Update -> PUT: /record/{id}
app.put('/record/:id', [
    // File upload (karena pakai multer, tempatkan di posisi pertama agar membaca multipar form-data)
    upload.single('invoice'),

    // Set form validation rule
    check('id')
        .isLength({ min: 1 })
        .isNumeric()
        .custom(value => {
            return record.findOne({where: {id: value}}).then(b => {
                if(!b){
                    throw new Error('Id not found');
                }            
            })
        }
    ),
    check('category')
        .isLength({min: 3}),
    check('income')
        .isLength({max:11})
        .isNumeric(),
    check('expense')
        .isLength({max:11})
        .isNumeric(),
    check('date')
        .isLength({min: 10})
],(req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.mapped() });
    }
    const update = {
        category: req.body.category,
        income: req.body.income,
        expense: req.body.expense,
        date: req.body.date,
        invoice: req.file === undefined ? "" : req.file.filename
    }
    record.update(update,{where: {id: req.params.id}})
        .then(affectedRow => {
            return record.findOne({where: {id: req.params.id}})      
        })
        .then(b => {
            res.json({
                "status": "success",
                "message": "Record updated",
                "data": b
            })
        })
})

// CRUD Delete -> DELETE: /record/{id}
app.delete('/record/:id',[
    // Set form validation rule
    check('id')
        .isLength({ min: 1 })
        .isNumeric()
        .custom(value => {
            return record.findOne({where: {id: value}}).then(b => {
                if(!b){
                    throw new Error('Id not found');
                }            
            })
        }
    ),
], (req, res) => {
    record.destroy({where: {id: req.params.id}})
        .then(affectedRow => {
            if(affectedRow){
                return {
                    "status":"success",
                    "message": "Record deleted",
                    "data": null
                } 
            }

            return {
                "status":"error",
                "message": "Failed",
                "data": null
            } 
        })
        .then(r => {
            res.json(r)
        })
})