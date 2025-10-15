const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CaptionResponse {
  caption: string;
  image_description: string;
  success: boolean;
  error?: string;
}

export interface HealthResponse {
  status: string;
  blip_loaded: boolean;
  ollama_available: boolean;
  gpu_available: boolean;
}

/**
 * Check if backend is healthy and ready
 */
export async function checkBackendHealth(): Promise<HealthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`Backend health check failed: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Backend health check error:', error);
    throw error;
  }
}

/**
 * Generate Instagram caption from image file
 */
export async function generateCaption(imageFile: File): Promise<CaptionResponse> {
  try {
    const formData = new FormData();
    formData.append('file', imageFile);

    const response = await fetch(`${API_BASE_URL}/generate-caption`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Caption generation failed: ${response.statusText}`);
    }

    const data: CaptionResponse = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Caption generation failed');
    }

    return data;
  } catch (error) {
    console.error('Caption generation error:', error);
    throw error;
  }
}
