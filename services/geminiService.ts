import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StyleVariation, Furniture, ImageBase64 } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

export const fileToGenerativePart = (data: string, mimeType: string) => {
  return {
    inlineData: {
      data,
      mimeType
    },
  };
};

export const analyzeImage = async (base64Data: string, mimeType: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = fileToGenerativePart(base64Data, mimeType);
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, { text: "Analiza esta imagen de una habitación. Describe el tipo de habitación (ej. sala de estar, dormitorio) y su estilo actual. Sé conciso y directo." }] },
    });
    return response.text;
};

const generateStyleDetails = async (base64ImageData: string, mimeType: string, styleName: string): Promise<Omit<StyleVariation, 'imageUrl' | 'imageBase64' | 'iterations'>> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = fileToGenerativePart(base64ImageData, mimeType);
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: { parts: [imagePart, {text: `Basado en esta imagen de una habitación rediseñada en estilo ${styleName}, proporciona una breve descripción, una paleta de 5 colores en códigos hexadecimales y 3 recomendaciones de muebles, incluyendo su nombre, una breve descripción, su precio en pesos chilenos (CLP), un enlace a un producto disponible y en stock en una tienda online de Chile, y una URL de imagen representativa del mueble o del producto en la tienda (si es posible encontrar una de la tienda o una genérica de buena calidad). Si no puedes encontrar una URL de imagen específica, puedes dejar el campo 'imageUrl' como una cadena vacía.`}] },
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING, description: 'Una breve descripción del estilo de la habitación.' },
                    color_palette: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description: 'Una matriz de 5 códigos de color hexadecimales que representan la paleta de colores.'
                    },
                    furniture_recommendations: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                name: { type: Type.STRING },
                                description: { type: Type.STRING },
                                price: { type: Type.STRING, description: 'Precio en pesos chilenos con símbolo, ej. CLP$199.990' },
                                link: { type: Type.STRING, description: 'Un enlace de ejemplo a un producto en una tienda chilena.' },
                                imageUrl: { type: Type.STRING, description: 'URL de la imagen del mueble. Puede estar vacío si no se encuentra una.' } // New
                            },
                             required: ['name', 'description', 'price', 'link'] // imageUrl is optional for schema validation
                        }
                    }
                },
                required: ['description', 'color_palette', 'furniture_recommendations']
            }
        }
    });

    // Check for prompt blocking for text generation
    if (response.promptFeedback?.blockReason) {
        console.error("API blocked prompt for style details generation:", response.promptFeedback.blockReason, response.promptFeedback.safetyRatings, "Full response:", JSON.stringify(response, null, 2));
        throw new Error(`La generación de detalles de estilo falló debido a que el mensaje fue bloqueado por: ${response.promptFeedback.blockReason}. Por favor, intenta un mensaje diferente.`);
    }

    const jsonText = response.text.trim();
    
    if (!jsonText) {
        console.error("API response for style details was empty or invalid JSON. Full response:", JSON.stringify(response, null, 2));
        throw new Error("La generación de detalles de estilo falló: La respuesta de la API estaba vacía o no era JSON válido.");
    }

    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    } catch (e: any) {
        console.error("Failed to parse JSON response for style details:", e, "Raw response text:", jsonText, "Full response:", JSON.stringify(response, null, 2));
        throw new Error(`La generación de detalles de estilo falló: La respuesta de la API no es un JSON válido. Error: ${e.message}.`);
    }
    
    // Basic validation of parsed structure
    if (!parsed || !parsed.description || !Array.isArray(parsed.color_palette) || !Array.isArray(parsed.furniture_recommendations)) {
        console.error("Parsed JSON for style details is missing expected properties. Parsed object:", parsed, "Full response:", JSON.stringify(response, null, 2));
        throw new Error("La generación de detalles de estilo falló: El JSON de la API carece de las propiedades esperadas (descripción, paleta de colores, recomendaciones de muebles).");
    }

    return {
        style_name: styleName,
        description: parsed.description,
        color_palette: parsed.color_palette,
        furniture_recommendations: parsed.furniture_recommendations,
    };
};

export const generateStyledImage = async (base64Data: string, mimeType: string, styleName: string): Promise<ImageBase64> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `Rediseña esta habitación en un estilo ${styleName}. Mantén la estructura y disposición de la habitación pero cambia los muebles, colores y decoración para que coincida con el estilo ${styleName}. El resultado debe ser fotorrealista. No incluyas personas en la imagen.`;
    
    const imagePart = fileToGenerativePart(base64Data, mimeType);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    // --- Start of enhanced error handling ---

    // 1. Check if the overall response object is valid
    if (!response) {
        console.error("API returned an empty or undefined response for image generation.");
        throw new Error("La generación de imágenes falló: La respuesta de la API estaba vacía o era inválida.");
    }

    // Check for prompt blocking for text generation
    if (response.promptFeedback?.blockReason) {
        console.error("API blocked prompt for image generation:", response.promptFeedback.blockReason, response.promptFeedback.safetyRatings, "Full response:", JSON.stringify(response, null, 2));
        throw new Error(`La generación de imágenes falló debido a que el mensaje fue bloqueado por: ${response.promptFeedback.blockReason}. Por favor, intenta un mensaje diferente.`);
    }

    // Defensive checks for the expected structure
    const candidate = response.candidates?.[0];
    if (!candidate) {
        console.error("API response for image generation missing candidates or first candidate is null/undefined. Full response:", JSON.stringify(response, null, 2));
        throw new Error("La generación de imágenes falló: No se encontró un candidato válido en la respuesta de la API.");
    }
    
    // NEW: Check for NO_IMAGE finish reason
    if (candidate.finishReason === 'NO_IMAGE') {
        console.error("API response for image generation indicated 'NO_IMAGE' was generated. Candidate:", JSON.stringify(candidate, null, 2), "Full response:", JSON.stringify(response, null, 2));
        throw new Error("La IA no pudo generar una imagen. Esto puede suceder si la solicitud es demasiado vaga, compleja o inapropiada. Por favor, intenta con un mensaje diferente.");
    }

    const content = candidate.content;
    if (!content) {
        console.error("API response for image generation missing 'content' property in first candidate. Candidate:", JSON.stringify(candidate, null, 2), "Full response:", JSON.stringify(response, null, 2));
        throw new Error("La generación de imágenes falló: El candidato de la API no contenía la propiedad 'content' esperada."); 
    }
    const parts = content.parts;
    if (!Array.isArray(parts) || parts.length === 0) {
        console.error("API response for image generation missing or empty 'parts' array in content. Candidate:", JSON.stringify(candidate, null, 2), "Full response:", JSON.stringify(response, null, 2));
        throw new Error("La generación de imágenes falló: El contenido del candidato no contenía un array 'parts' válido o estaba vacío."); 
    }

    // Now iterate through parts, confident that 'parts' is an array
    for (const part of parts) {
      if (part.inlineData) {
        return {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
        };
      }
    }
    // If loop completes without returning, it means no inlineData was found in any part
    console.error("API response for image generation did not contain inlineData in any part, despite having content. Candidate:", JSON.stringify(candidate, null, 2), "Full response:", JSON.stringify(response, null, 2));
    throw new Error("La generación de imágenes falló: La API no devolvió datos de imagen en línea. Esto puede indicar un problema en la generación de la imagen o una respuesta inesperada.");
    // --- End of enhanced error handling ---
};

export const generateInitialDesigns = async (base64Data: string, mimeType: string, analysis: string): Promise<StyleVariation[]> => {
    // Updated to 5 distinct styles
    const styles = ['Moderno', 'Nórdico', 'Clásico', 'Bohemio', 'Industrial']; 
    const results: StyleVariation[] = [];

    // Phase 1: Generate all styled images in parallel
    const imageGenerationPromises = styles.map(style =>
        generateStyledImage(base64Data, mimeType, style)
    );
    const newImageDatas = await Promise.all(imageGenerationPromises);

    // Phase 2: Generate all style details in parallel using the generated images
    const detailsGenerationPromises = styles.map((style, index) =>
        generateStyleDetails(newImageDatas[index].data, newImageDatas[index].mimeType, style)
    );
    const allDetails = await Promise.all(detailsGenerationPromises);

    // Combine results
    allDetails.forEach((details, index) => {
        const newImageData = newImageDatas[index];
        results.push({
            ...details,
            imageUrl: `data:${newImageData.mimeType};base64,${newImageData.data}`,
            imageBase64: newImageData, // Corrected: Store the ImageBase64 object directly
            iterations: [],
        });
    });

    return results;
};


export const refineDesign = async (base64Data: string, mimeType: string, prompt: string): Promise<ImageBase64> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const imagePart = fileToGenerativePart(base64Data, mimeType);
    const textPart = { text: prompt };

    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: { parts: [imagePart, textPart] },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    });

    // --- Start of enhanced error handling ---

    // 1. Check if the overall response object is valid
    if (!response) {
        console.error("API returned an empty or undefined response for image refinement.");
        throw new Error("El refinamiento de imágenes falló: La respuesta de la API estaba vacía o era inválida.");
    }

    // Check for prompt blocking for text generation
    if (response.promptFeedback?.blockReason) {
        console.error("API blocked prompt for image refinement:", response.promptFeedback.blockReason, response.promptFeedback.safetyRatings, "Full response:", JSON.stringify(response, null, 2));
        throw new Error(`El refinamiento de imágenes falló debido a que el mensaje fue bloqueado por: ${response.promptFeedback.blockReason}. Por favor, intenta un mensaje diferente.`);
    }

    // Defensive checks for the expected structure
    const candidate = response.candidates?.[0];
    if (!candidate) {
        console.error("API response for image refinement missing candidates or first candidate is null/undefined. Full response:", JSON.stringify(response, null, 2));
        throw new Error("El refinamiento de imágenes falló: No se encontró un candidato válido en la respuesta de la API.");
    }

    // NEW: Check for NO_IMAGE finish reason
    if (candidate.finishReason === 'NO_IMAGE') {
        console.error("API response for image refinement indicated 'NO_IMAGE' was generated. Candidate:", JSON.stringify(candidate, null, 2), "Full response:", JSON.stringify(response, null, 2));
        throw new Error("La IA no pudo generar una imagen para el refinamiento. Esto puede suceder si la solicitud es demasiado vaga, compleja o inapropiada. Por favor, intenta con un mensaje diferente.");
    }

    const content = candidate.content;
    if (!content) {
        console.error("API response for image refinement missing 'content' property in first candidate. Candidate:", JSON.stringify(candidate, null, 2), "Full response:", JSON.stringify(response, null, 2));
        throw new Error("El refinamiento de imágenes falló: El candidato de la API no contenía la propiedad 'content' esperada.");
    }
    const parts = content.parts;
    if (!Array.isArray(parts) || parts.length === 0) {
        console.error("API response for image refinement missing or empty 'parts' array in content. Candidate:", JSON.stringify(candidate, null, 2), "Full response:", JSON.stringify(response, null, 2));
        throw new Error("El refinamiento de imágenes falló: El contenido del candidato no contenía un array 'parts' válido o estaba vacío.");
    }

    // Now iterate through parts, confident that 'parts' is an array
    for (const part of parts) {
      if (part.inlineData) {
        return {
            data: part.inlineData.data,
            mimeType: part.inlineData.mimeType,
        };
      }
    }
    // If loop completes without returning, it means no inlineData was found in any part
    console.error("API response for image refinement did not contain inlineData in any part, despite having content. Candidate:", JSON.stringify(candidate, null, 2), "Full response:", JSON.stringify(response, null, 2));
    throw new Error("El refinamiento de imágenes falló: La API no devolvió datos de imagen en línea en ninguna parte de la respuesta. Esto puede indicar un problema en la generación de la imagen o una respuesta inesperada.");
    // --- End of enhanced error handling ---
};