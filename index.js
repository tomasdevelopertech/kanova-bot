import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Inicialización de la API de Google Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_INSTRUCTION = `
Eres un asistente virtual de atención al cliente para Kanova Tecnología en Maracay, Aragua, Venezuela.
Responde de forma amable, clara y concisa en español.

Información de Entregas y Envíos:
- Hacemos entregas personales y puntos de encuentro/pickup en Maracay.
- Realizamos envíos nacionales a todo el país a través de MRW, Zoom y Tealca (cobro en destino).
- Contamos con servicio de delivery en la zona urbana de Maracay con costo adicional según la ubicación.
`;

app.post('/webhook', async (req, res) => {
  try {
    const userMessage = req.body?.message || req.body?.content || '';

    if (!userMessage) {
      return res.status(200).json({ 
        status: 'warning', 
        reply: 'No se recibió ningún mensaje en el cuerpo de la solicitud.' 
      });
    }

    // Modelo oficial y activo: gemini-2.5-flash
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const result = await model.generateContent(userMessage);
    const responseText = result.response.text();

    return res.status(200).json({
      status: 'success',
      reply: responseText
    });

  } catch (error) {
    console.error('Error procesando la solicitud con Gemini:', error.message);

    // Retorna HTTP 200 con el detalle del error en JSON para diagnosticar fácilmente
    return res.status(200).json({
      status: 'error',
      message: 'Ocurrió un problema al procesar la respuesta con Gemini API.',
      error_detail: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.send('Servidor Kanova Bot funcionando correctamente.');
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
