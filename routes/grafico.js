const express = require("express");
const mongoose = require("mongoose");
const { machineResulConnection } = require("../db"); // Importar la conexión desde db.js
const router = express.Router();

// Definir el esquema y modelo de la colección
const analisisCategoriasSchema = new mongoose.Schema({}, { strict: false });
const AnalisisEmpresasSchema = new mongoose.Schema({}, { strict: false })
const AnalisisPreciosSchema = new mongoose.Schema({}, { strict: false })

//Coleccion de categorias
const AnalisisCategorias = machineResulConnection.model(
  "analisis_categorias",
  analisisCategoriasSchema
);

//coleccion de empresas
const AnalisisEmpresas = machineResulConnection.model(
  "analisis_empresa_procedencias",
  AnalisisEmpresasSchema
);
  
//Histograma de precios
const AnalisisPrecios = machineResulConnection.model(
    "Histograma_PreciosActuales", // Reemplaza con el nombre real de la colección si es diferente
    AnalisisPreciosSchema
  );
  

// Endpoint para obtener el último registro de la colección `analisis_categorias`
router.get("/ultimo", async (req, res) => {
  try {
        // Establecer un timeout de 30 segundos (30000 ms) para este endpoint
        req.setTimeout(30000, () => {
            console.error("La solicitud superó el tiempo límite.");
            res.status(408).send("Tiempo de espera agotado para la solicitud.");
          });

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

// Endpoint para obtener HISTOGRAMA de distribución por empresa
router.get("/empresas", async (req, res) => {
  try {
    // Recuperar el primer documento de la colección
    const documentos = await AnalisisEmpresas.find({}); // Obtener todos los documentos
    console.log("Documentos encontrados en la colección:", documentos);

    // Procesar el primer documento encontrado
    const registro = documentos[0];
    const conteoEmpresas = registro.conteo_empresas || {};
    const mapeoEmpresas = registro.mapeo_empresa || {};
    
    // Validar si los campos clave están presentes
    if (!conteoEmpresas || !mapeoEmpresas) {
      console.error("Datos incompletos en el documento:", documentoCompleto);
      return res.status(400).json({ error: "Datos incompletos en el registro." });
    }


    // Responder con los datos
    res.status(200).json({
      conteo_empresas: conteoEmpresas,
      mapeo_empresa: mapeoEmpresas,
    });
  } catch (error) {
    console.error("Error al procesar los datos:", error);
    res.status(500).json({ error: "Error al procesar la solicitud." });
  }
});


// Endpoint para obtener los datos del histograma de precios
router.get("/histograma-precios", async (req, res) => {
  try {
      const histograma = await AnalisisPrecios.find({}); // Ajustar modelo si es necesario
      console.log("Histograma encontrado en la colección:", histograma);

      const historico = histograma.datos.labels || {};
      console.log("Historico encontrado en la colección:", historico);

      if (!histograma || !histograma.datos || !histograma.datos.labels || !histograma.datos.frecuencias) {
        return res.status(404).json({ error: "Datos incompletos o no encontrados." });
      }
      res.json({

          labels: histograma.datos.labels,
          frecuencias: histograma.datos.frecuencias,
      });
  } catch (error) {
      console.error("Error al obtener datos del histograma de precios:", error);
      res.status(500).json({ error: "Error interno del servidor." });
  }
});
  
  
  
  

module.exports = router;
