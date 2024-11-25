const express = require("express");
const mongoose = require("mongoose");
const { machineResulConnection } = require("../db"); // Importar la conexión desde db.js
const router = express.Router();

// Definir el esquema y modelo de la colección
const analisisCategoriasSchema = new mongoose.Schema({}, { strict: false });
const AnalisisEmpresasSchema = new mongoose.Schema({}, { strict: false })
const AnalisisPreciosSchema = new mongoose.Schema({}, { strict: false })
const MetodoCodoSchema = new mongoose.Schema({}, { strict: false })
const prediccionPreciosSchema = new mongoose.Schema({}, { strict: false })

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
  
  //Grafico metodo codo
  const MetodoCodo = machineResulConnection.model(
    "Metodo_Codo", // Reemplaza con el nombre real de la colección si es diferente
    MetodoCodoSchema
  );

  const Prediccion = machineResulConnection.model(
    'Predicciones',
    prediccionPreciosSchema  
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
  

  // Endpoint para obtener los datos de Metodo_Codo
router.get("/metodo_codo", async (req, res) => {
  try {
    console.log("Conectando a la colección Metodo_Codo...");
    const db = machineResulConnection.useDb("MachineResul");
    const collection = db.collection("Metodo_Codo");

    // Realiza una consulta directa
    const documentos = await collection.find({}).toArray();//Esto funciona para que busque los datos mas directos

    // Si no hay documentos, responde con un mensaje
    if (!documentos || documentos.length === 0) {
        console.log("No se encontraron documentos en Metodo_Codo");
        return res.status(404).json({ error: "No se encontraron datos en la colección Metodo_Codo" });
    }


    console.log("Datos obtenidos de Metodo_Codo:", documentos);
    res.status(200).json(documentos);
  } catch (error) {
      console.error("Error al obtener los datos de Metodo_Codo:", error);
      res.status(500).json({ error: "Error al procesar la solicitud" });
  }
});
  
  

//PRUEBA PARA TRAER PRODUCTOS DE PRECIOS CON PREDICCION JUNTOS
// Modelos para ambas colecciones
  
  
  // Endpoint para obtener predicciones por _id de producto
  router.get('/predicciones/:id', async (req, res) => {
    const { id } = req.params; // Obtén el _id del producto desde los parámetros de la URL
    console.log(id)
    try {
      // Busca predicciones que coincidan con el _id del producto
      const predicciones = await Prediccion.find({_id: id});
        console.log(predicciones)

      // Verifica si hay predicciones
      if (predicciones.length === 0) {
        return res.status(404).json({
          message: `No se encontraron predicciones para el producto con id: ${id}`,
        });
      }
  
      // Devuelve las predicciones encontradas
      res.status(200).json({
        message: `Predicciones encontradas para el producto con id: ${id}`,
        data: predicciones.map((prediccion) => ({
          fecha_futura: prediccion.fecha_futura,
          precio_futuro: prediccion.precio_futuro,
        })),
      });
    } catch (error) {
      console.error('Error al buscar predicciones:', error);
      res.status(500).json({
        message: 'Error al buscar predicciones.',
        error: error.message,
      });
    }
  });





module.exports = router;
