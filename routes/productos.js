// src/routes/productos.js
const express = require('express');
const router = express.Router();
const Producto = require('../models/producto');


//RUTAS PARA OBTENER INFO DE LA API - NO MOVER

// Ruta para buscar productos de manera dinámica por diferentes campos
    

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

// Endpoint mejorado para buscar productos similares por varios criterios
router.get('/buscar-similares', async (req, res) => {
    try {
        const { marca, modelo, nombre, categoria } = req.query;

        // Crear un filtro de búsqueda dinámico
        let filtroBusqueda = {};
        if (marca) filtroBusqueda.marca = new RegExp(marca, 'i');
        if (modelo) filtroBusqueda.modelo = new RegExp(modelo, 'i');
        if (nombre) filtroBusqueda.nombre = new RegExp(nombre, 'i');
        if (categoria) filtroBusqueda.categoria = new RegExp(categoria, 'i');

        const productosSimilares = await Producto.find(filtroBusqueda)
            .sort({ views: -1 })  // Ordenar por popularidad (puedes ajustar esto según tus criterios)
            .limit(20);  // Limitar resultados

        if (productosSimilares.length === 0) {
            return res.status(404).json({ mensaje: "No se encontraron productos que coincidan con los criterios de búsqueda." });
        }

        res.json(productosSimilares);
    } catch (error) {
        console.error("Error al procesar la solicitud de búsqueda:", error);
        res.status(500).json({ error: "Error en el servidor al buscar productos." });
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

// Ruta para buscar productos similares por marca, modelo y nombre, con ajuste en caso de no encontrar coincidencias exactas
router.get('/buscar-similares', async (req, res) => {
    try {
        const { marca, modelo, nombre } = req.query;

        // Verificar que al menos uno de los parámetros esté presente
        if (!marca && !modelo && !nombre) {
            return res.status(400).json({ error: "Debe proporcionar al menos uno de los criterios: 'marca', 'modelo' o 'nombre'." });
        }

        let productosSimilares = [];

        // Nivel 1: Búsqueda completa por marca, modelo y nombre
        try {
            let filtroBusqueda = {};
            if (marca) filtroBusqueda.marca = new RegExp(marca, 'i');
            if (modelo) filtroBusqueda.modelo = new RegExp(modelo, 'i');
            if (nombre) filtroBusqueda.nombre = new RegExp(nombre, 'i');

            console.log("Nivel 1 - Filtro:", filtroBusqueda);
            productosSimilares = await Producto.find(filtroBusqueda);
        } catch (err) {
            console.error("Error en la búsqueda de Nivel 1:", err);
        }

        // Si no se encuentran resultados, reducir criterios de búsqueda
        if (productosSimilares.length === 0 && marca && modelo) {
            try {
                const filtroBusqueda = {
                    marca: new RegExp(marca, 'i'),
                    modelo: new RegExp(modelo, 'i')
                };
                console.log("Nivel 2 - Filtro:", filtroBusqueda);
                productosSimilares = await Producto.find(filtroBusqueda);
            } catch (err) {
                console.error("Error en la búsqueda de Nivel 2:", err);
            }
        }

        if (productosSimilares.length === 0 && marca) {
            try {
                const filtroBusqueda = { marca: new RegExp(marca, 'i') };
                console.log("Nivel 3 - Filtro:", filtroBusqueda);
                productosSimilares = await Producto.find(filtroBusqueda);
            } catch (err) {
                console.error("Error en la búsqueda de Nivel 3:", err);
            }
        }

        // Si aún no se encuentran resultados, retornar mensaje 404
        if (productosSimilares.length === 0) {
            return res.status(404).json({ mensaje: "No se encontraron productos similares que coincidan con los criterios de búsqueda." });
        }

        res.json(productosSimilares);
    } catch (error) {
        console.error("Error al procesar la solicitud:", error);
        res.status(500).json({ error: "Ocurrió un error en el servidor al buscar productos similares." });
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
