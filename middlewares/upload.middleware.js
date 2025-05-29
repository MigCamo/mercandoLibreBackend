const multer = require("multer");

/* Filtro para recibir únicamente imágenes JPG
const imageFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/jpeg") && file.originalname.endsWith(".jpg")) {
        cb(null, true);
    } else {
        cb("Solo se permiten imágenes con extensión JPG.", false);
    }
};
*/
const imageFilter = (req, file, cb) => {
    // comprueba que el mimetype sea image/jpeg o image/png
    const mimetypeOk = /^(image\/jpeg|image\/png)$/.test(file.mimetype);
    // comprueba que la extensión sea .jpg .jpeg o .png (case‑insensitive)
    const extensionOk = /\.(jpe?g|png)$/i.test(file.originalname);
  
    if (mimetypeOk && extensionOk) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes JPG, JPEG o PNG.'), false);
    }
};

// Se configura el almacenamiento para los archivos subidos
var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    },
});

// Se crea la instancia de multer
var uploadFile = multer({ storage: storage, fileFilter: imageFilter });
module.exports = uploadFile;
