import { GoogleGenAI, Type, Modality } from "@google/genai";
import { StyleVariation, Furniture, ImageBase64 } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const MAX_IMAGE_GENERATION_RETRIES = 3;

// Create a single instance to be reused
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
const imageModel = 'gemini-2.5-flash-image';
const textModel = 'gemini-2.5-flash';


export const fileToGenerativePart = (data: string, mimeType: string) => {
  return {
    inlineData: {
      data,
      mimeType
    },
  };
};

export const analyzeImage = async (base64Data: string, mimeType: string): Promise<string> => {
    const imagePart = fileToGenerativePart(base64Data, mimeType);
    const response = await ai.models.generateContent({
        model: textModel,
        contents: { parts: [imagePart, { text: "Analiza esta imagen de una habitación. Describe el tipo de habitación (ej. sala de estar, dormitorio) y su estilo actual. Sé conciso y directo." }] },
    });
    if (response.promptFeedback?.blockReason) {
        throw new Error(`Mi amor, no pude analizar la imagen. Razón: ${response.promptFeedback.blockReason}.`);
    }
    return response.text;
};

const generateStyleDetails = async (base64ImageData: string, mimeType: string, styleName: string): Promise<Omit<StyleVariation, 'imageUrl' | 'imageBase64' | 'iterations'>> => {
    const imagePart = fileToGenerativePart(base64ImageData, mimeType);
    
    const response = await ai.models.generateContent({
        model: textModel,
        contents: { parts: [imagePart, {text: `Basado en esta imagen de una habitación rediseñada en estilo ${styleName}, proporciona una breve descripción, una paleta de 5 colores en códigos hexadecimales y 3 recomendaciones de muebles. Para cada mueble, incluye: nombre, una breve descripción, su precio en pesos chilenos (CLP), un enlace DIRECTO y VÁLIDO a un producto que esté ACTUALMENTE DISPONIBLE y EN STOCK en una tienda online de CHILE (ej. Falabella, Sodimac, Ripley, Paris). ES OBLIGATORIO QUE VERIFIQUES LA DISPONIBILIDAD. Además, proporciona una URL de imagen PÚBLICA y FUNCIONAL que apunte directamente al archivo de imagen del producto (que termine en .jpg, .png, .webp). LA URL DE LA IMAGEN DEBE SER DIRECTA AL ARCHIVO, NO A UNA PÁGINA WEB. Prioriza imágenes de la misma tienda online. Si no encuentras una URL de imagen de producto válida, busca una imagen genérica de alta calidad de un producto muy similar que sea funcional.`}] },
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
                                link: { type: Type.STRING, description: 'Un enlace DIRECTO a un producto DISPONIBLE y EN STOCK en una tienda online de CHILE (ej. Falabella, Sodimac, Ripley, Paris).' },
                                imageUrl: { type: Type.STRING, description: 'URL de la imagen PÚBLICA y FUNCIONAL del mueble (ej. terminada en .jpg o .png). Prioriza una URL funcional y representativa del producto.' }
                            },
                             required: ['name', 'description', 'price', 'link', 'imageUrl']
                        }
                    }
                },
                required: ['description', 'color_palette', 'furniture_recommendations']
            }
        }
    });

    if (response.promptFeedback?.blockReason) {
        console.error("API blocked prompt for style details generation:", response.promptFeedback.blockReason, response.promptFeedback.safetyRatings);
        throw new Error(`Mi vida, la magia fue bloqueada al crear los detalles: ${response.promptFeedback.blockReason}. ¿Intentamos con otras palabras?`);
    }

    const jsonText = response.text.trim();
    if (!jsonText) {
        console.error("API response for style details was empty.");
        throw new Error("Mi amor, la respuesta de mi magia llegó vacía. Intentemos de nuevo.");
    }

    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    } catch (e: any) {
        console.error("Failed to parse JSON response for style details:", e, "Raw response text:", jsonText);
        throw new Error(`Mi cielo, mi magia me dio una respuesta extraña que no entiendo. Detalle: ${e.message}.`);
    }
    
    if (!parsed || !parsed.description || !Array.isArray(parsed.color_palette) || !Array.isArray(parsed.furniture_recommendations)) {
        console.error("Parsed JSON for style details is missing expected properties. Parsed object:", parsed);
        throw new Error("El diseño llegó un poco desordenado, mi amor. Algo no cuadra (faltan descripción, paleta de colores o muebles).");
    }

    return {
        style_name: styleName,
        description: parsed.description,
        color_palette: parsed.color_palette,
        furniture_recommendations: parsed.furniture_recommendations,
    };
};

export const generateStyledImage = async (base64Data: string, mimeType: string, styleName: string): Promise<ImageBase64> => {
    const prompt = `Rediseña esta habitación en un estilo ${styleName}. Mantén la estructura y disposición de la habitación pero cambia los muebles, colores y decoración para que coincida con el estilo ${styleName}. El resultado debe ser fotorrealista, de alta calidad y claro. No incluyas personas en la imagen.`;
    
    const imagePart = fileToGenerativePart(base64Data, mimeType);
    const textPart = { text: prompt };

    for (let i = 0; i < MAX_IMAGE_GENERATION_RETRIES; i++) {
        try {
            const response = await ai.models.generateContent({
                model: imageModel,
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            if (!response) {
                throw new Error("Mi amor, mi magia falló al generar la imagen: La respuesta llegó vacía.");
            }

            if (response.promptFeedback?.blockReason) {
                throw new Error(`No pude crear la imagen, mi amor. Razón: ${response.promptFeedback.blockReason}.`);
            }

            const candidate = response.candidates?.[0];
            if (!candidate) {
                throw new Error("Mi magia no encontró una idea válida en la respuesta. ¿Intentamos de nuevo?");
            }
            
            if (candidate.finishReason === 'NO_IMAGE') {
                if (i < MAX_IMAGE_GENERATION_RETRIES - 1) {
                    console.warn(`Reintento ${i + 1}/${MAX_IMAGE_GENERATION_RETRIES} para la generación de imagen (NO_IMAGE).`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                } else {
                    throw new Error("Mi magia no pudo crear la imagen esta vez, mi vida. Esto puede pasar si la idea es muy compleja.");
                }
            }
            
            for (const part of candidate.content?.parts || []) {
                if (part.inlineData) {
                    return {
                        data: part.inlineData.data,
                        mimeType: part.inlineData.mimeType,
                    };
                }
            }
            throw new Error("La respuesta de mi magia no contenía los datos de la imagen. Esto puede indicar un problema en la generación.");

        } catch (error: any) {
            if (i < MAX_IMAGE_GENERATION_RETRIES - 1) {
                console.warn(`Reintento ${i + 1}/${MAX_IMAGE_GENERATION_RETRIES} debido a error: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            throw error;
        }
    }
    throw new Error("Mi amor, lo intenté varias veces pero no pude crear la imagen. ¿Probamos con otra idea?");
};

const generateFullVariation = async (base64Data: string, mimeType: string, styleName: string): Promise<StyleVariation> => {
    const newImageData = await generateStyledImage(base64Data, mimeType, styleName);
    const details = await generateStyleDetails(newImageData.data, newImageData.mimeType, styleName);

    return {
        ...details,
        imageUrl: `data:${newImageData.mimeType};base64,${newImageData.data}`,
        imageBase64: newImageData,
        iterations: [],
    };
};

export const generateInitialDesigns = async (
    base64Data: string, 
    mimeType: string, 
    analysis: string,
    onProgress: (style: string, current: number, total: number) => void
): Promise<StyleVariation[]> => {
    const styles = ['Moderno', 'Nórdico', 'Clásico', 'Bohemio', 'Industrial'];
    const results: StyleVariation[] = [];

    for (let i = 0; i < styles.length; i++) {
        onProgress(styles[i], i + 1, styles.length);
        const variation = await generateFullVariation(base64Data, mimeType, styles[i]);
        results.push(variation);
    }
    
    return results;
};


export const refineDesign = async (
    base64Data: string, 
    mimeType: string, 
    prompt: string,
    styleName: string
): Promise<{ newImage: ImageBase64; newDetails: Pick<StyleVariation, 'description' | 'color_palette' | 'furniture_recommendations'> }> => {
    const imagePart = fileToGenerativePart(base64Data, mimeType);
    const textPart = { text: prompt };

    let refinedImage: ImageBase64 | null = null;

    for (let i = 0; i < MAX_IMAGE_GENERATION_RETRIES; i++) {
        try {
            const response = await ai.models.generateContent({
                model: imageModel,
                contents: { parts: [imagePart, textPart] },
                config: {
                    responseModalities: [Modality.IMAGE],
                },
            });

            if (!response) {
                throw new Error("El refinamiento de imagen falló: La respuesta de mi magia estaba vacía.");
            }

            if (response.promptFeedback?.blockReason) {
                throw new Error(`El refinamiento de imagen fue bloqueado, mi amor: ${response.promptFeedback.blockReason}.`);
            }

            const candidate = response.candidates?.[0];
            if (!candidate) {
                throw new Error("El refinamiento de imagen falló: No se encontró una idea válida en la respuesta.");
            }

            if (candidate.finishReason === 'NO_IMAGE') {
                if (i < MAX_IMAGE_GENERATION_RETRIES - 1) {
                    console.warn(`Reintento ${i + 1}/${MAX_IMAGE_GENERATION_RETRIES} para el refinamiento (NO_IMAGE).`);
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    continue;
                } else {
                    throw new Error("Mi magia no pudo generar una imagen para el refinamiento. Intenta con una instrucción diferente, mi vida.");
                }
            }

            for (const part of candidate.content?.parts || []) {
                if (part.inlineData) {
                    refinedImage = {
                        data: part.inlineData.data,
                        mimeType: part.inlineData.mimeType,
                    };
                    break;
                }
            }
            
            if (refinedImage) break;
            
            throw new Error("La respuesta de mi magia para el refinamiento no contenía datos de imagen.");
        } catch (error: any) {
             if (i < MAX_IMAGE_GENERATION_RETRIES - 1) {
                console.warn(`Reintento ${i + 1}/${MAX_IMAGE_GENERATION_RETRIES} para refinamiento debido a error: ${error.message}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
            }
            throw error;
        }
    }
    
    if (!refinedImage) {
      throw new Error("Mi amor, el refinamiento de imagen falló después de múltiples reintentos.");
    }
    
    const newDetailsResult = await generateStyleDetails(refinedImage.data, refinedImage.mimeType, styleName);

    return {
        newImage: refinedImage,
        newDetails: {
            description: newDetailsResult.description,
            color_palette: newDetailsResult.color_palette,
            furniture_recommendations: newDetailsResult.furniture_recommendations,
        },
    };
};