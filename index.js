const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 8080;
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

const SYSTEM_PROMPT = `
Eres el asistente virtual de ventas de Kanova Tecnología.
Atiendes a clientes de Facebook Marketplace, Instagram y WhatsApp.

Información oficial:
- Ubicación de entregas personales: Cerca de la Redoma del Avión, por la Av. Los Aviadores (Maracay).
- Entregas a domicilio: Disponibles mediante servicio de Delivery.
- Productos habituales: Recarga de cartuchos HP/Canon, memorias MicroSD/USB (32GB, 64GB, 128GB), componentes electrónicos.

Reglas de respuesta:
1. Sé amable, breve (máximo 3 oraciones) y directo.
2. Si preguntan disponibilidad, confirma que sí hay stock disponible para entrega inmediata.
3. Menciona siempre el punto de entrega (Redoma del Avión) y opción de delivery.
4. Para concretar pago o compra, remite a WhatsApp.
`;

app.post('/webhook', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(200).json({ status: 'warning', reply: 'No se recibió ningún mensaje.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({ status: 'error', detail: 'Falta configurar GEMINI_API_KEY en Render.' });
    }

    // Lista de modelos a probar en orden de prioridad
    const modelsToTry = ['gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-pro'];
    let botResponse = null;
    let lastError = null;

    for (const modelName of modelsToTry) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          systemInstruction: SYSTEM_PROMPT
        });

        const result = await model.generateContent(message);
        botResponse = result.response.text();
        break; // Si el modelo responde con éxito, salimos del ciclo
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!botResponse) {
      return res.status(200).json({ status: 'error', detail: `Ningún modelo respondió. Último error: ${lastError}` });
    }

    return res.status(200).json({ status: 'success', reply: botResponse });

  } catch (error) {
    console.error('Error general:', error.message);
    return res.status(200).json({ status: 'error', detail: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('🤖 Bot Server Kanova en línea y listo.');
});

app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
