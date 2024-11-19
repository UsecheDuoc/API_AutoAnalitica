const express = require("express");
const mongoose = require("mongoose");
const { machineResulConnection } = require("../db"); // Importar la conexión desde db.js
const router = express.Router();

// Definir el esquema y modelo de la colección
const analisisCategoriasSchema = new mongoose.Schema({}, { strict: false });
const AnalisisCategorias = machineResulConnection.model(
  "analisis_categorias",
  analisisCategoriasSchema
);

// Endpoint para obtener el último registro de la colección `analisis_categorias`
router.get("/ultimo", async (req, res) => {
  try {
    const ultimoRegistro = await AnalisisCategorias.find()
      .sort({ _id: -1 })
      .limit(1);
    if (ultimoRegistro.length > 0) {
      res.json(ultimoRegistro[0]);
    } else {
      res.status(404).send("No se encontraron datos.");
    }
  } catch (error) {
    console.error("Error al obtener datos:", error);
    res.status(500).send("Error al procesar la solicitud.");
  }
});

module.exports = router;
