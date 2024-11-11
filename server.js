// server.js o app.js
const express = require('express');
const mongoose = require('mongoose');
const productosRouter = require('./routes/productos');

const app = express();
app.use(express.json()); // Permite recibir JSON en las peticiones

const cors = require('cors');
app.use(cors({
    origin: '*' // Cambia esto según el puerto de tu frontend
}));

// Conexión a MongoDB
mongoose.connect('mongodb+srv://jucoronel:AivF1YaQSkx3NV4Q@autoanalitica.wh5c6.mongodb.net/autosanalitica', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Conectado a MongoDB'))
  .catch(err => console.log('Error al conectar', err));

// Usar las rutas de productos  
app.use('/api/productos', productosRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`));




//RUTA PARA CONECTAR A BD - NO BORRAR
//mongodb+srv://jucoronel:AivF1YaQSkx3NV4Q@autoanalitica.wh5c6.mongodb.net/autosanalitica'