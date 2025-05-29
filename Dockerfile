# Usa Node 20 alpine como la imagen padre
FROM node:20.12.2-alpine

# Se cambia al directorio /app dentro de la imagen
WORKDIR /app

# Copia los archivos package.json y package-lock.json al directorio /app de la imagen
COPY package.json package-lock.json ./

# Instala las dependencias
RUN npm install

# Copia todos los archivos a la imagen
COPY . .

# Pone la app en el puerto
EXPOSE 3000

# Inicia la aplicacion
CMD npm start