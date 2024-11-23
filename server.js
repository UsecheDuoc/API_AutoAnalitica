const express = require("express");
const cors = require("cors");
const productosRouter = require("./routes/productos");
const graficoRoutes = require("./routes/grafico");
const { mainDbConnection, machineResulConnection } = require("./db");

const app = express();
app.use(express.json());
app.use(cors({ origin: "*" }));

// Usar las rutas
console.log("Registrando rutas de productos...");
app.use("/productos", productosRouter);

console.log("Registrando rutas de gráficos...");
app.use("/grafico", graficoRoutes);



// Ruta base
app.get("/", (req, res) => {
  res.send("API funcionando correctamente en Render");
});



// Middleware para capturar errores
app.use((err, req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();

  console.error(`Error en ${req.method} ${req.url}:`, err.stack);
  res.status(500).send("Error interno del servidor");
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});



//RUTA PARA CONECTAR A BD - NO BORRAR
//mongodb+srv://jucoronel:AivF1YaQSkx3NV4Q@autoanalitica.wh5c6.mongodb.net/autosanalitica'