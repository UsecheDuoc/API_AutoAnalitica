// src/routes/productos.js
const express = require('express');
const router = express.Router();
const Producto = require('../models/producto');


//RUTAS PARA OBTENER INFO DE LA API - NO MOVER

//NUEVO
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
       const database = client.db('autosanalitica');
       const collection = database.collection('productos');
 
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
 
// Endpoint para buscar productos por categoría
router.get('/categoria', async (req, res) => {
    const { categoria } = req.query;
    try {
        const productos = await Producto.find({ categoria: new RegExp(categoria, 'i') });
        res.json(productos);
    } catch (error) {
        console.error("Error al obtener productos:", error);
        res.status(500).json({ message: "Error al obtener productos" });
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

// Endpoint mejorado para buscar productos solo por el campo 'nombre'
router.get('/buscar-similares', async (req, res) => {
    try {
        const { nombre, marca, modelo, categoria, descuento, tienda } = req.query;

        // Crear un filtro de búsqueda que solo aplique a 'nombre' y permita filtros adicionales
        let filtroBusqueda = {
            nombre: nombre ? new RegExp(nombre, 'i') : undefined, // Solo aplicar búsqueda en 'nombre'
            ...(marca && { marca: new RegExp(marca, 'i') }),
            ...(modelo && { modelo: new RegExp(modelo, 'i') }),
            ...(categoria && { categoria: new RegExp(categoria, 'i') }),
            ...(descuento && { descuento: descuento }),
            ...(tienda && { tienda: new RegExp(tienda, 'i') })
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
        const productos = await Producto.find({}); // Ajusta tu consulta según tus necesidades
        const productosConDescuento = productos.map(producto => {
            const lastPrice = producto.historial_precios?.slice(-3)[0]?.precio || producto.precio_actual;
            const priceDifference = producto.precio_actual - lastPrice;
            const percentageChange = lastPrice ? ((Math.abs(priceDifference) / lastPrice) * 100).toFixed(2) : 0;
            
            // Definir el estado del precio
            let estado;
            if (priceDifference < 0) {
                estado = `Bajó: ${percentageChange}%`;
            } else if (priceDifference > 0) {
                estado = `Aumentó: ${percentageChange}%`;
            } else {
                estado = `Se mantuvo`;
            }

            return {
                ...producto._doc,
                estado,  // Añade el estado directamente al producto
            };
        });
        res.json(productosConDescuento);
    } catch (error) {
        console.error("Error al obtener productos con descuento:", error);
        res.status(500).json({ error: "Error al obtener productos" });
    }
});



// Actualizar un producto por ID
router.get('/:id', async (req, res) => {
    try {
        const producto = await Producto.findById(req.params.id);
        res.json(producto);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el producto" });
    }
});


// Endpoint para obtener los detalles de un producto y aumentar vistas
router.get('/:id', async (req, res) => {
    const productId = req.params.id;
    console.log("ID recibido en el endpoint:", productId);

    try {
        const producto = await Producto.findByIdAndUpdate(
            productId,
            { $inc: { views: 1 } }, // Incrementa el campo views en 1
            { new: true } // Devuelve el documento actualizado
        );

        if (!producto) {
            console.log("Producto no encontrado.");
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        console.log("Producto encontrado:", producto);
        res.status(200).json(producto);
    } catch (error) {
        console.error("Error al obtener detalles del producto:", error);
        res.status(500).json({ error: 'Error al obtener detalles del producto' });
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
router.get('/similares', async (req, res) => {  // Asegurarse que la ruta coincida
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

// Exportar el enrutador
module.exports = router;
