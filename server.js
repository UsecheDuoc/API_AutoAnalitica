const express = require("express");
const cors = require("cors");
const productosRouter = require("./routes/productos");
const graficoRoutes = require("./routes/grafico");

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: "3000", // Cambia esto según el puerto de tu frontend
  })
);

// Usar las rutas de productos y gráficos
app.use("/api/productos", productosRouter);
app.use("/grafico", graficoRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor escuchando en el puerto ${PORT}`));



//RUTA PARA CONECTAR A BD - NO BORRAR
//mongodb+srv://jucoronel:AivF1YaQSkx3NV4Q@autoanalitica.wh5c6.mongodb.net/autosanalitica'