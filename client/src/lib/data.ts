
const placeholderImage = "/images/glamping-placeholder.svg";

export const seasonalBlocks = [
  { start: new Date(2026, 0, 1), end: new Date(2026, 1, 28) },
  { start: new Date(2026, 2, 1), end: new Date(2026, 4, 30) },
  { start: new Date(2026, 5, 1), end: new Date(2026, 7, 31) },
  { start: new Date(2026, 8, 1), end: new Date(2026, 10, 30) },
  { start: new Date(2026, 11, 1), end: new Date(2026, 11, 31) },
];

export function getActiveSeason(date: Date = new Date()) {
  return seasonalBlocks.find(block => date >= block.start && date <= block.end);
}

export const campings = [
  {
    id: 1,
    typeId: 1,
    name: "Domo Gold",
    isFamiliar: false,
    images: [placeholderImage],
    image: placeholderImage,
    description: "Domo exclusivo para dos personas con vista hacia las montañas. Jacuzzi privado climatizado, malla catamarán y todas las comodidades para una escapada perfecta.",
    features: ["Jacuzzi privado", "Malla catamarán", "Baño privado", "Nevera mini", "Mini granja", "Parqueadero", "Wifi restaurante", "Desayuno americano"],
    includes: [
      "🛌 Alojamiento para dos personas",
      "🍽️ Desayuno americano para dos",
      "🛁 Jacuzzi climatizado y privado",
      "🚿 Baño privado",
      "❄️ Nevera mini en el domo",
      "🐑🦙 Mini granja en su hábitat",
      "🅿️ Parqueadero privado sin costo",
      "🛜 Zona wifi en el restaurante",
      "🕸️ Malla catamarán"
    ],
    rating: 5.0
  },
  {
    id: 2,
    typeId: 2,
    name: "Domo Big Premium",
    isFamiliar: false,
    images: [placeholderImage],
    image: placeholderImage,
    description: "Domo para dos personas con vista hacia el atardecer. Amplio, confortable y con jacuzzi privado climatizado.",
    features: ["Jacuzzi privado", "Malla catamarán", "Baño privado", "Nevera mini", "Mini granja", "Parqueadero", "Wifi restaurante", "Desayuno americano"],
    includes: [
      "🛌 Alojamiento para dos personas",
      "🍽️ Desayuno americano para dos",
      "🛁 Jacuzzi climatizado y privado",
      "🚿 Baño privado",
      "❄️ Nevera mini en el domo",
      "🐑🦙 Mini granja en su hábitat",
      "🅿️ Parqueadero privado sin costo",
      "🛜 Zona wifi en el restaurante",
      "🕸️ Malla catamarán"
    ],
    rating: 5.0
  },
  {
    id: 3,
    typeId: 3,
    name: "Domo Natura Premium",
    isFamiliar: false,
    images: [placeholderImage],
    image: placeholderImage,
    description: "Domo para dos personas con vista hacia el bosque. Tranquilidad total, jacuzzi privado y televisión para Netflix en un entorno natural incomparable.",
    features: ["Jacuzzi privado", "Televisión Netflix", "Baño privado", "Nevera mini", "Mini granja", "Parqueadero", "Wifi restaurante", "Desayuno americano"],
    includes: [
      "🛌 Alojamiento para dos personas",
      "🍽️ Desayuno americano para dos",
      "🛁 Jacuzzi climatizado y privado",
      "🚿 Baño privado",
      "❄️ Nevera mini en el domo",
      "🐑🦙 Mini granja en su hábitat",
      "🅿️ Parqueadero privado sin costo",
      "🛜 Zona wifi en el restaurante",
      "📺 Televisión para Netflix"
    ],
    rating: 5.0
  },
  {
    id: 4,
    typeId: 2,
    name: "Domo Familiar",
    isFamiliar: true,
    images: [placeholderImage],
    image: placeholderImage,
    description: "El mismo Domo Big Premium habilitado para familias o grupos de hasta 6 personas. Vista al atardecer, jacuzzi privado y todo el espacio que necesitan.",
    features: ["Jacuzzi privado", "Hasta 6 personas", "Malla catamarán", "Baño privado", "Nevera mini", "Mini granja", "Parqueadero", "Wifi restaurante"],
    includes: [
      "🛌 Alojamiento para todos en el Domo",
      "🍽️ Desayuno americano para todos",
      "🛁 Jacuzzi climatizado y privado",
      "🚿 Baño privado",
      "❄️ Nevera mini en el domo",
      "🐑🦙 Mini granja en su hábitat",
      "🅿️ Parqueadero privado sin costo",
      "🛜 Zona wifi en el restaurante",
      "🕸️ Malla catamarán"
    ],
    rating: 5.0
  }
];

export const addons = [
  {
    id: "decoracion",
    title: "Decoración especial",
    price: 80000,
    description: "Para cumpleaños, aniversario, pedida de noviazgo, noche de bodas o romántica.",
    details: ["Flores y detalles decorativos", "Iluminación especial", "Personalización del espacio"]
  },
  {
    id: "cena",
    title: "Cena (por persona)",
    price: 35000,
    description: "Cenas disponibles con reserva anticipada. Precio por persona.",
    details: ["Menú especial de temporada", "Servicio a la mesa", "Solicitar con anticipación"]
  },
  {
    id: "cuatrimoto",
    title: "Cuatrimoto (por persona)",
    price: 50000,
    description: "Recorrido en cuatrimoto por los senderos de la finca.",
    details: ["Casco, guantes y gafas incluidos", "Acompañamiento del mayordomo", "Sujeto a condiciones climáticas"]
  },
  {
    id: "poligono",
    title: "Polígono (por persona)",
    price: 30000,
    description: "Experiencia de tiro en polígono dentro de la finca.",
    details: ["Equipo proporcionado", "Instrucción básica incluida", "Solo para mayores de edad"]
  },
  {
    id: "fogata",
    title: "Fogata con masmelos",
    price: 30000,
    description: "Romántica fogata con masmelos para la pareja.",
    details: ["Leña incluida", "Masmelos para dos", "Momento perfecto bajo las estrellas"]
  }
];
