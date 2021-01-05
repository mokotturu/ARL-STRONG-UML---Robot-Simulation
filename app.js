const express = require('express');
const dotenv = require('dotenv');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const connectDB = require('./config/db.js');
const path = require('path');

const app = express();

dotenv.config({path: './config/config.env'});

connectDB();

// app.use(express.urlencoded({ extended: false }));
// app.use(express.json({limit: '2MB'}));
app.use(bodyParser.urlencoded({ extended: true, limit: '50MB', parameterLimit: 1000000000000000}));
app.use(bodyParser.json({ extended: true, limit: '50MB' }));

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// handlebars
app.engine('.hbs', exphbs({defaultLayout: 'main', extname: '.hbs'}));
app.set('view engine', '.hbs');

// static folder
app.use(express.static(path.join(__dirname, 'public')));

// routes
app.use('/', require('./routes/index'));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`));
