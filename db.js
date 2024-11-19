const mongoose = require("mongoose");

// Conexión a la base de datos autosanalitica_Limpios
const mainDbConnection = mongoose.createConnection(
  "mongodb+srv://jucoronel:AivF1YaQSkx3NV4Q@autoanalitica.wh5c6.mongodb.net/autosanalitica_Limpios",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

mainDbConnection.on("connected", () => {
  console.log("Conectado a MongoDB (autosanalitica_Limpios)");
});

mainDbConnection.on("error", (err) => {
  console.error("Error al conectar a autosanalitica_Limpios:", err);
});

// Conexión a la base de datos MachineResul
const machineResulConnection = mongoose.createConnection(
  "mongodb+srv://jucoronel:AivF1YaQSkx3NV4Q@autoanalitica.wh5c6.mongodb.net/MachineResul",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

machineResulConnection.on("connected", () => {
  console.log("Conectado a MongoDB (MachineResul)");
});

machineResulConnection.on("error", (err) => {
  console.error("Error al conectar a MachineResul:", err);
});

module.exports = { mainDbConnection, machineResulConnection };
