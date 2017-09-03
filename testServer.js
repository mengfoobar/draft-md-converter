const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors')

const app = express();


app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.use('/test',  require('./routes/test.js'));

app.listen(3003);