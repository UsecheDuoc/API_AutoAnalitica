// models/producto.js
const mongoose = require('mongoose');

const productoSchema = new mongoose.Schema({
    nombre: String,
    precio: Number,
    categoria: String,
    marca_modelo_vehiculo: String,
    descripcion: String,
    imagenUrl: String,
    LinkPagina: String,
    historial_precios: [
        {
            fecha: String,
            precio: Number
        }
    ],
    views: { type: Number, default: 0 }, // Campo para contar las vistas
}, { collection: 'productos_limpios' }); // Aquí especificas la colección

module.exports = mongoose.model('Producto', productoSchema);
