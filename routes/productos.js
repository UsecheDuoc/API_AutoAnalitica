// src/routes/productos.js
const express = require('express');
const router = express.Router();
//const Producto = require('../models/producto');
const app = express();
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb"); // Importa ObjectId para manejar el _id de MongoDB

const { mainDbConnection } = require("../db"); // Importar la conexión desde db.js
const analisisCategoriasSchema = new mongoose.Schema({}, { strict: false });
const { machineResulConnection } = require("../db"); // Importar la conexión desde db.js
const prediccionPreciosSchema = new mongoose.Schema({}, { strict: false })


//coleccion de productos
    const Producto = mainDbConnection.model(
        "productos_limpios",
        new mongoose.Schema({}, { strict: false })
    );

    const cliente = mainDbConnection.model(
        "Cliente", // Nombre del modelo
        new mongoose.Schema({}, { strict: false }),
        "Cliente" // Nombre explícito de la colección
    );

    const Destacados = mainDbConnection.model(
        "productos_destacados",
        new mongoose.Schema({}, { strict: false })
    );


    // Endpoint para agregar un cliente
    router.post('/notificaciones', async (req, res) => {
        try {
            // Extraer datos del body
            const { marca, modelo, correo } = req.body;

            // Validar que los campos necesarios estén presentes
            if (!marca || !modelo || !correo) {
                return res.status(400).json({ message: 'Faltan datos obligatorios: marca, modelo o correo' });
            }

            // Actualizar o insertar un cliente en la colección existente
            const clienteActualizado = await cliente.findOneAndUpdate(
                { correo }, // Criterio de búsqueda: usa el correo como identificador único
                {
                    $set: {
                        marca,
                        modelo,
                        fecha_ingreso: new Date().toISOString().split('T')[0] // Fecha actual en formato YYYY-MM-DD
                    }
                },
                { new: true, upsert: true } // 'new': devuelve el documento actualizado, 'upsert': inserta si no existe
            );

            res.status(200).json({
                message: 'Cliente agregado o actualizado con éxito',
                data: clienteActualizado
            });
        } catch (error) {
            console.error('Error al agregar o actualizar cliente:', error);
            res.status(500).json({
                message: 'Error al agregar o actualizar el cliente',
                error: error.message
            });
        }
    });

    // En tu controlador de productos, por ejemplo, routes/productos.js
    const getProductos = async (req, res) => {
        try {
            const { categoria, marca, modelo } = req.query;

            // Filtra productos según los parámetros recibidos
            const query = {};
            if (categoria) query.categoria = categoria;
            if (marca) query.marca = marca;
            if (modelo) query.modelo = modelo;

            const productos = await Producto.find(query); // Suponiendo que tienes un modelo de mongoose llamado Producto
            if (!productos.length) {
                return res.status(404).json({ message: "No se encontraron productos." });
            }

            return res.status(200).json(productos);
        } catch (error) {
            console.error("Error al obtener productos:", error);
            return res.status(500).json({ message: "Error interno del servidor." });
        }
    };

    // Asegúrate de asociar esta función a la ruta en el router
    router.get('/productos', getProductos);


// Endpoint para obtener los datos de graficos_interactivos
router.get("/graficos_interactivos", async (req, res) => {
    try {
      console.log("Conectando a la colección graficos_interactivos...");
      const db = mainDbConnection.useDb("autosanalitica_Limpios");
      const collection = db.collection("graficos_interactivos");
  
      // Realiza una consulta directa
      const documentos = await collection.find({}).toArray();
  
      // Si no hay documentos, responde con un mensaje
      if (!documentos || documentos.length === 0) {
        console.log("No se encontraron documentos en graficos_interactivos");
        return res
          .status(404)
          .json({ error: "No se encontraron datos en la colección graficos_interactivos" });
      }
  
      console.log("Datos obtenidos de graficos_interactivos:", documentos);
      res.status(200).json(documentos);
    } catch (error) {
      console.error("Error al obtener los datos de graficos_interactivos:", error);
      res.status(500).json({ error: "Error al procesar la solicitud" });
    }
  });
  




//NUEVO

// Obtener productos con filtros opcionales
router.get("/", async (req, res) => {
    try {
      const query = {};
  
      if (req.query.marca) query.marca = new RegExp(req.query.marca, "i");
      if (req.query.modelo) query.modelo = new RegExp(req.query.modelo, "i");
      if (req.query.descuento) query.descuento = { $gte: parseInt(req.query.descuento) };
      if (req.query.tienda) query.tienda = new RegExp(req.query.tienda, "i");
      if (req.query.categoria) query.categoria = new RegExp(req.query.categoria, "i");
  
      const sort = {};
      if (req.query.sortOrder === "priceAsc") sort.precio_actual = 1;
      if (req.query.sortOrder === "priceDesc") sort.precio_actual = -1;
      if (req.query.sortOrder === "nameAsc") sort.nombre = 1;
      if (req.query.sortOrder === "nameDesc") sort.nombre = -1;
  
      const productos = await Producto.find(query).sort(sort);
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos con filtros:", error);
      res.status(500).json({ message: "Error al obtener productos" });
    }
  });
  
  // Endpoint para obtener productos por categoría
  router.get("/categoria", async (req, res) => {
    console.log("Categoria 1");
    try {
      const { categoria } = req.query;
      const productos = await Producto.find({ categoria: new RegExp(categoria, "i") });
      res.json(productos);
    } catch (error) {
      console.error("Error al obtener productos por categoría:", error);
      res.status(500).json({ message: "Error al obtener productos por categoría" });
    }
  });
  
  // Endpoint para obtener productos relacionados
  router.get("/relacionados/:id", async (req, res) => {
    try {
      const productoActual = await Producto.findById(req.params.id);
      if (!productoActual) {
        return res.status(404).json({ message: "Producto no encontrado" });
      }
  
      const productosRelacionados = await Producto.find({
        $or: [
          { categoria: productoActual.categoria },
          { marca: productoActual.marca },
          { modelo: productoActual.modelo },
        ],
        _id: { $ne: productoActual._id },
      }).limit(5);
  
      res.json(productosRelacionados);
    } catch (error) {
      console.error("Error al obtener productos relacionados:", error);
      res.status(500).json({ message: "Error al obtener productos relacionados" });
    }
  });
  
// Endpoint para buscar productos por marca
    router.get('/marca', async (req, res) => {
        const { nombre } = req.query; // Obtener el nombre de la marca desde la consulta

        if (!nombre) {
            return res.status(400).json({ error: "Debe proporcionar el nombre de la marca." });
        }

        try {
            // Filtramos los productos que tienen una marca que coincide (insensible a mayúsculas)
            const productosPorMarca = await Producto.find({ marca: new RegExp(`^${nombre}$`, 'i') });

            if (productosPorMarca.length === 0) {
                return res.status(404).json({ mensaje: "No se encontraron productos para la marca especificada." });
            }

            res.status(200).json(productosPorMarca);
        } catch (error) {
            console.error("Error al buscar productos por marca:", error);
            res.status(500).json({ error: 'Error al obtener productos por marca' });
        }
    });

// Endpoint para buscar productos por categoría
router.get('/categoria', async (req, res) => {
    console.log("Categoria 2");
    const { categoria } = req.query;
    try {
        const productos = await Producto.find({ categoria: new RegExp(categoria, 'i') });
        res.json(productos);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: "Error al obtener productos" });
    }
});

// Endpoint para productos con mayor descuento (Productos destacados)
/* router.get("/destacados-descuento", async (req, res) => {
    try {
      const { categoria } = req.headers; // Tomar el filtro de categoría desde los headers
  
      // Construir el filtro inicial
      const filtro = {
        "historial_precios.1": { $exists: true }, // Al menos 2 precios en el historial
      };
  
      // Si se pasa la categoría en los headers, agregarla al filtro
      if (categoria) {
        filtro.categoria = new RegExp(categoria, "i"); // Búsqueda insensible a mayúsculas/minúsculas
      }
  
      // Obtener productos que cumplan el filtro
      const productos = await Producto.find(filtro);
  
      if (!productos.length) {
        return res.status(200).json([]); // Si no hay productos, devolver un array vacío
      }
  
      // Calcular el descuento relativo
      const productosConDescuento = productos.map((producto) => {
        const penultimoPrecio = producto.historial_precios[producto.historial_precios.length - 2]?.precio || 0;
        const precioActual = producto.precio_actual;
  
        // Calcular descuento relativo
        const descuentoRelativo = penultimoPrecio
          ? ((penultimoPrecio - precioActual) / penultimoPrecio) * 100
          : 0;
  
        return {
          ...producto.toObject(), // Convertir el documento de MongoDB a un objeto
          descuentoRelativo: descuentoRelativo > 0 ? descuentoRelativo : 0, // Evitar descuentos negativos
        };
      });
  
      // Ordenar por mayor descuento relativo y limitar a los 10 mejores
      const destacados = productosConDescuento
        .sort((a, b) => b.descuentoRelativo - a.descuentoRelativo)
        .slice(0, 10);
  
      res.json(destacados);
    } catch (error) {
      console.error("Error al obtener productos destacados:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  }); */

  router.get("/destacados-descuento", async (req, res) => {
    try {
        // Obtener todos los productos de la colección productos_destacados
        const productos = await Destacados.find({});

        // Calcular el descuento relativo para cada producto
        const productosConDescuento = productos.map((producto) => {
            const penultimoPrecio = producto.historial_precios?.[producto.historial_precios.length - 1]?.precio || 0;
            const precioActual = producto.precio_actual;

            // Calcular descuento relativo
            const descuentoRelativo = penultimoPrecio
                ? ((penultimoPrecio - precioActual) / penultimoPrecio) * 100
                : 0;

            return {
                ...producto.toObject(), // Convertir el documento de MongoDB a un objeto
                descuentoRelativo: descuentoRelativo > 0 ? descuentoRelativo : 0, // Evitar descuentos negativos
            };
        });

        // Devolver todos los productos con el descuento calculado
        res.json(productosConDescuento);
    } catch (error) {
        console.error("Error al obtener productos destacados:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
});




//VIEJOS
// Obtener productos con filtros opcionales
router.get('/', async (req, res) => {
    try {
        const query = {};

        if (req.query.marca) query.marca = new RegExp(req.query.marca, 'i');
        if (req.query.modelo) query.modelo = new RegExp(req.query.modelo, 'i');
        if (req.query.descuento) query.descuento = { $gte: parseInt(req.query.descuento) };
        if (req.query.tienda) query.tienda = new RegExp(req.query.tienda, 'i');
        if (req.query.categoria) query.categoria = new RegExp(req.query.categoria, 'i'); // Filtro de categoría

        const sort = {};
        if (req.query.sortOrder === 'priceAsc') sort.precio_actual = 1;
        if (req.query.sortOrder === 'priceDesc') sort.precio_actual = -1;
        if (req.query.sortOrder === 'nameAsc') sort.nombre = 1;
        if (req.query.sortOrder === 'nameDesc') sort.nombre = -1;

        const productos = await Producto.find(query).sort(sort);
        res.json(productos);
    } catch (error) {
        console.error("Error al obtener productos con filtros:", error);
        res.status(500).json({ message: "Error al obtener productos" });
    }
});

// Endpoint para obtener modelos por marca
router.get('/modelos', async (req, res) => {
    const { marca } = req.query;
    try {
        const modelos = await Producto.distinct("modelo", { marca: new RegExp(marca, 'i') });
        res.json(modelos);
    } catch (error) {
        console.error("Error al obtener modelos:", error);
        res.status(500).json({ error: 'Error al obtener modelos' });
    }
});

router.get("/prueba", async (req, res) => {
    try {
      const productos = await Producto.find();
      res.json(productos);
    } catch (error) {
      console.error("Error al consultar MongoDB:", error);
      res.status(500).send("Error al consultar MongoDB");
    }
  });
  
// Crear un nuevo producto
router.post('/', async (req, res) => {
    try {
        const producto = new Producto(req.body);
        await producto.save();
        res.status(201).send(producto);
    } catch (error) {
        res.status(400).send(error);
    }
});
// Obtener todos los productos
// routes/productos.js
router.get('/', async (req, res) => {
    try {
        const productos = await Producto.find();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener productos" });
    }
});

// Ruta para agregar el campo "imagenUrl" a todos los documentos
router.put('/addImageUrl', async (req, res) => {
    try {
       await client.connect();
       const database = client.db('autosanalitica_limpios');
       const collection = database.collection('productos_limpios');
 
       // Actualiza todos los documentos agregando el campo "imagenUrl" con el valor proporcionado
       const result = await collection.updateMany(
          {},
          { $set: { imagenUrl: "https://http2.mlstatic.com/D_NQ_NP_991599-MLU73080006589_112023-O.webp" } }
       );
 
       res.status(200).json({
          message: 'Campo imagenUrl agregado a todos los documentos',
          modifiedCount: result.modifiedCount
       });
    } catch (error) {
       console.error(error);
       res.status(500).json({ error: 'Error al actualizar los documentos' });
    } finally {
       await client.close();
    }
 });
 
//Endpoint para traer prediccion de productos de la coleccion "precio_futuro"
router.get("/prediccion/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar si el ID es válido
        if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "ID inválido" });
        }

        console.log('')
        // Buscar predicciones en la colección de predicciones
        const predicciones = await mainDbConnection.collection("precio_futuro")
        .findOne({ _id: new ObjectId(id) }); // Convertir id a ObjectId
    
            console.log('Encontré:',predicciones)

        // Si no se encuentra la predicción
        if (!predicciones) {
            return res.status(404).json({ message: "Predicción no encontrada" });
        }
    
        // Responder con las predicciones
        res.json(predicciones);
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Error al obtener la predicción" });
    }
  });

// Endpoint mejorado para buscar productos solo por el campo 'nombre'
router.get('/buscar-similares', async (req, res) => {
    try {
        console.log('Primera')
        const { nombre, marca, modelo, categoria, descuento, empresa_procedencia } = req.query;

        // Crear un filtro de búsqueda que solo aplique a 'nombre' y permita filtros adicionales
        let filtroBusqueda = {
            nombre: nombre ? new RegExp(nombre, 'i') : undefined, // Solo aplicar búsqueda en 'nombre'
            ...(marca && { marca: new RegExp(marca, 'i') }),
            ...(modelo && { modelo: new RegExp(modelo, 'i') }),
            ...(categoria && { categoria: new RegExp(categoria, 'i') }),
            ...(descuento && { descuento: descuento }),
            ...(empresa_procedencia && { empresa_procedencia: new RegExp(empresa_procedencia, 'i') })
        };

        // Limpiar campos undefined
        Object.keys(filtroBusqueda).forEach(
            key => filtroBusqueda[key] === undefined && delete filtroBusqueda[key]
        );

        const productosSimilares = await Producto.find(filtroBusqueda)
            .sort({ views: -1 }) // Ordenar por popularidad u otro criterio
            .limit(20); // Limitar resultados

        if (productosSimilares.length === 0) {
            return res.status(404).json({ mensaje: "No se encontraron productos que coincidan con la búsqueda." });
        }

        res.json(productosSimilares);
    } catch (error) {
        console.error("Error al procesar la solicitud de búsqueda:", error);
        res.status(500).json({ error: "Error en el servidor al buscar productos." });
    }
});

// Ejemplo de endpoint en Node.js
router.get('/productos-con-descuento', async (req, res) => {
    try {
        console.log('Entro a productos-con-descuento')
        // Obtener todos los productos destacados usando el modelo definido
        const productos = await Destacados.find({});



        res.json(productos);
    } catch (error) {
        console.error("Error al obtener productos con descuento:", error);  
        res.status(500).json({ error: "Error al obtener productos" });
    }
});


// Endpoint para obtener los detalles de un producto y aumentar vistas
router.get('/:id', async (req, res) => {
    try {
      const producto = await Producto.findById(req.params.id);
      if (!producto) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
  
      // Incrementar las vistas al mismo tiempo
      producto.views = (producto.views || 0) + 1;
      await producto.save();
  
      res.status(200).json(producto);
    } catch (error) {
      console.error("Error al obtener el producto:", error);
      res.status(500).json({ message: "Error al obtener el producto" });
    }
  });
  
// Eliminar un producto por ID
router.delete('/:id', async (req, res) => {
    try {
        await Producto.findByIdAndDelete(req.params.id);
        res.send({ message: 'Producto eliminado' });
    } catch (error) {
        res.status(500).send(error);
    }
});

// Endpoint para buscar productos similares
router.get('/similaress', async (req, res) => {  // Asegurarse que la ruta coincida
    try {
        const { id } = req.query;
        const currentProduct = await Producto.findById(id);  // Cambiar 'Product' a 'Producto'
        if (!currentProduct) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        const minPrice = currentProduct.precio_actual * 0.8;
        const maxPrice = currentProduct.precio_actual * 1.2;

        const similarProducts = await Producto.find({
            _id: { $ne: currentProduct._id },
            nombre: { $regex: currentProduct.nombre, $options: 'i' },
            precio_actual: { $gte: minPrice, $lte: maxPrice }
        }).limit(3);

        res.json(similarProducts);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al buscar productos similares' });
    }
});

// Endpoint para obtener productos relacionados
router.get('/relacionados/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        // Obtener el producto actual
        const productoActual = await Producto.findById(productId);
        if (!productoActual) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        // Buscar productos que compartan al menos una característica
        const productosRelacionados = await Producto.find({
            $or: [
                { categoria: productoActual.categoria },
                { marca: productoActual.marca },
                { modelo: productoActual.modelo }
            ],
            _id: { $ne: productId }  // Excluir el producto actual
        }).limit(5);  // Limitar el número de resultados

        res.status(200).json(productosRelacionados);
    } catch (error) {
        console.error("Error al obtener productos relacionados:", error);
        res.status(500).json({ error: 'Error al obtener productos relacionados' });
    }
});


// Endpoint para obtener los productos más buscados
router.get('/mas-buscados', async (req, res) => {
    try {
        // Busca los productos ordenados por vistas en orden descendente y limita a 5
        const productosMasBuscados = await Producto.find()
            .sort({ views: -1 }) // Ordena por el campo views de mayor a menor
            .limit(5); // Limita a los 5 productos más buscados

        res.status(200).json(productosMasBuscados);
    } catch (error) {
        console.error("Error al obtener productos más buscados:", error);
        res.status(500).json({ error: 'Error al obtener productos más buscados' });
    }
});



// Endpoint para buscar productos por marca
router.get('/marca', async (req, res) => {
    const { nombre } = req.query; // Obtener la marca desde la consulta
    if (!nombre) {
        return res.status(400).json({ error: "Debe proporcionar el nombre de la marca." });
    }

    try {
        const productosPorMarca = await Producto.find({ marca: new RegExp(nombre, 'i') }); // Búsqueda insensible a mayúsculas
        if (productosPorMarca.length === 0) {
            return res.status(404).json({ mensaje: "No se encontraron productos para la marca especificada." });
        }
        res.status(200).json(productosPorMarca);
    } catch (error) {
        console.error("Error al buscar productos por marca:", error);
        res.status(500).json({ error: 'Error al obtener productos por marca' });
    }
}); 



//NO TOCAR
// Endpoint para buscar productos similares por marca, modelo y nombre
router.get('/buscar-similares', async (req, res) => {
    try {
        console.log('Segunda')

        const { marca, modelo, nombre } = req.query;
        if (!marca && !modelo && !nombre) {
            return res.status(400).json({ error: "Debe proporcionar al menos uno de los criterios: 'marca', 'modelo' o 'nombre'." });
        }
        let productosSimilares = [];
        let filtroBusqueda = {};

        if (marca) filtroBusqueda.marca = new RegExp(marca, 'i');
        if (modelo) filtroBusqueda.modelo = new RegExp(modelo, 'i');
        if (nombre) filtroBusqueda.nombre = new RegExp(nombre, 'i');
        productosSimilares = await Producto.find(filtroBusqueda);

        if (productosSimilares.length === 0 && marca && modelo) {
            filtroBusqueda = { marca: new RegExp(marca, 'i'), modelo: new RegExp(modelo, 'i') };
            productosSimilares = await Producto.find(filtroBusqueda);
        }

        if (productosSimilares.length === 0 && marca) {
            filtroBusqueda = { marca: new RegExp(marca, 'i') };
            productosSimilares = await Producto.find(filtroBusqueda);
        }

        if (productosSimilares.length === 0) {
            return res.status(404).json({ mensaje: "No se encontraron productos similares que coincidan con los criterios de búsqueda." });
        }
        res.json(productosSimilares);
    } catch (error) {
        console.error("Error al procesar la solicitud:", error);
        res.status(500).json({ error: "Ocurrió un error en el servidor al buscar productos similares." });
    }
});



router.get('/similares-por-categoria/:id', async (req, res) => {
    try {
        const { id } = req.params; // Cambiar a req.params para obtener el ID

        console.log('Entro a similares por categorias')
        console.log("ID recibido:", id);

        // Validar si el ID es un ObjectId válido
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'ID del producto no es válido' });
        }

        const currentProduct = await Producto.findById(id); // Buscar el producto actual
        if (!currentProduct) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        console.log("Producto actual encontrado:", currentProduct);
        console.log("Categoría del producto:", currentProduct?.categoria);

        // Buscar productos de la misma categoría, excluyendo el producto actual
        const similarProducts = await Producto.find({
            _id: { $ne: currentProduct._id },
            categoria: currentProduct.categoria
        }).limit(3);
        if (similarProducts.length === 0) {
            return res.status(200).json({ message: 'No se encontraron productos similares en la misma categoría' });
        }

        res.json(similarProducts);
    } catch (error) {
        console.error("Error al buscar productos por categoría:", error);
        res.status(500).json({ error: "Ocurrió un error en el servidor al buscar productos por categoría." });
    }
});









//MAS ENDPOINTS





// Exportar el enrutador
module.exports = router;
