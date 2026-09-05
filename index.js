const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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

// Declaración correcta de systemInstruction para Gemini 1.5
const model = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash",
  systemInstruction: SYSTEM_PROMPT
});

app.post('/webhook', async (req, res) => {
  try {
    const { message, senderId } = req.body;

    if (!message) {
      return res.status(400).send("No message received");
    }

    const result = await model.generateContent(message);
    const botResponse = result.response.text();

    res.status(200).json({ status: "success", reply: botResponse });
  } catch (error) {
    console.error("Error procesando mensaje:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get('/', (req, res) => {
  res.send('🤖 Bot Server Kanova en línea y listo.');
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en el puerto ${PORT}`);
});
