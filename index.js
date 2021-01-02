const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;

express()
.use(express.static(path.join(__dirname, 'public')))
.get('/', (req, res) => res.render(public/index))
.listen(PORT, () => console.log(`Server started on port ${PORT}`));
