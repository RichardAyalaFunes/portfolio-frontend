/**
 * Utilidades para manejo de plantillas HTML
 * Carga y renderiza plantillas desde archivos HTML externos
 */

export interface TemplateData {
  [key: string]: any;
}

/**
 * Carga una plantilla HTML desde un archivo
 * @param templatePath - Ruta del archivo de plantilla
 * @returns Promise con el contenido HTML de la plantilla
 */
export const loadTemplate = async (templatePath: string): Promise<string> => {
  try {
    console.log(`Loading template from path: ${templatePath}`);
    const response = await fetch(templatePath);
    if (!response.ok) {
      console.error(`Template fetch failed with status: ${response.status}`);
      throw new Error(`Error al cargar plantilla: ${response.status}`);
    }
    const text = await response.text();
    console.log(`Template loaded successfully, size: ${text.length} characters`);
    return text;
  } catch (error) {
    console.error('Error cargando plantilla:', error);
    throw error;
  }
};

/**
 * Renderiza una plantilla HTML en un contenedor
 * @param container - Elemento DOM donde renderizar la plantilla
 * @param templateHtml - Contenido HTML de la plantilla
 * @param data - Datos para reemplazar en la plantilla
 */
export const renderTemplate = (
  container: HTMLElement, 
  templateHtml: string, 
  data: TemplateData = {}
): void => {
  container.innerHTML = templateHtml;
  
  // Aplicar datos a elementos específicos
  Object.keys(data).forEach(key => {
    const element = container.querySelector(`#${key}`);
    if (element) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        (element as HTMLInputElement).value = data[key];
      } else {
        element.textContent = data[key];
      }
    }
  });
};

/**
 * Actualiza elementos específicos en una plantilla ya renderizada
 * @param container - Contenedor de la plantilla
 * @param updates - Objeto con los elementos a actualizar
 */
export const updateTemplateElements = (
  container: HTMLElement, 
  updates: TemplateData
): void => {
  Object.keys(updates).forEach(key => {
    const element = container.querySelector(`#${key}`);
    if (element) {
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
        (element as HTMLInputElement).value = updates[key];
      } else {
        element.textContent = updates[key];
      }
    }
  });
};

/**
 * Muestra u oculta elementos en la plantilla
 * @param container - Contenedor de la plantilla
 * @param elementId - ID del elemento a mostrar/ocultar
 * @param visible - Si el elemento debe ser visible
 */
export const toggleElementVisibility = (
  container: HTMLElement, 
  elementId: string, 
  visible: boolean
): void => {
  const element = container.querySelector(`#${elementId}`);
  if (element) {
    (element as HTMLElement).style.display = visible ? 'block' : 'none';
  }
};

/**
 * Agrega clases CSS a un elemento
 * @param container - Contenedor de la plantilla
 * @param elementId - ID del elemento
 * @param className - Clase CSS a agregar
 */
export const addElementClass = (
  container: HTMLElement, 
  elementId: string, 
  className: string
): void => {
  const element = container.querySelector(`#${elementId}`);
  if (element) {
    element.classList.add(className);
  }
};

/**
 * Remueve clases CSS de un elemento
 * @param container - Contenedor de la plantilla
 * @param elementId - ID del elemento
 * @param className - Clase CSS a remover
 */
export const removeElementClass = (
  container: HTMLElement, 
  elementId: string, 
  className: string
): void => {
  const element = container.querySelector(`#${elementId}`);
  if (element) {
    element.classList.remove(className);
  }
};
