// Every piece of text the map shows, in English and Spanish.
//
// HOW THIS FILE IS ORGANISED
//   UI           interface text, looked up by key:        t('search.title')
//   DATA_LABELS  values that come from the data files      label('Freight & Trucking')
//                (categories, areas, education levels...), keyed by the exact
//                English value in the GeoJSON
//   HINTS        longer explanations of a data value       hint('Southwest Detroit')
//
// TO CHANGE WORDING: edit the text on the right-hand side. Never change a key
// (left-hand side) -- the code and the data look things up by it.
//
// TO ADD A NEW CATEGORY / SUB-CATEGORY / AREA that the data has started using:
// add one line to DATA_LABELS.es. Until then it simply shows in English, and
// `npm run check:i18n` lists exactly which values are missing.
//
// A value of the form { one: '...', other: '...' } is a singular/plural pair,
// picked by the `count` passed to t(). {curly} words are filled in by the
// code -- keep them exactly as they are.
//
// NOT TRANSLATED, on purpose: employer names, street addresses, job titles and
// the text of job postings. Those are shown as the employer published them
// (see 'jobs.languageNote').

export const LANGUAGES = {
  en: { name: 'English', short: 'EN' },
  es: { name: 'Español', short: 'ES' },
}
export const DEFAULT_LANGUAGE = 'en'

export const UI = {
  en: {
    'page.title': 'Community View Map | SDEV',
    'language.label': 'Language',
    'logo.alt': 'Southwest Detroit Environmental Vision',

    'view.list': 'List',
    'view.map': 'Map',

    'header.employers': 'Employers',
    'header.locations': { one: '{count} location', other: '{count} locations' },
    'header.inSouthwest': '{count} in Southwest Detroit',
    'header.updated': 'Job listings updated {date}',

    'feedback.button': 'Feedback',
    'feedback.title': 'Send feedback',
    'feedback.openTab': 'Open in new tab',
    'feedback.close': 'Close',
    'feedback.frameTitle': 'Feedback form',

    'search.title': 'Search',
    'search.placeholder': 'Employer or job title',
    'search.clear': 'Clear search',
    'search.matches': { one: '{count} match across all categories', other: '{count} matches across all categories' },
    'search.none': 'No matches. Try an employer name or a job title such as "driver".',
    'search.matchingJobs': { one: '{count} matching job', other: '{count} matching jobs' },

    'hiring.only': 'Hiring now only',
    'hiring.now': 'Hiring now',
    'hiring.none': 'No current listings',
    'hiring.nowWithCount': { one: 'Hiring now · {count} open job', other: 'Hiring now · {count} open jobs' },
    'hiring.noneLong': 'No current job listings',

    'zip.title': 'Near a ZIP code',
    'zip.placeholder': 'e.g. 48210',
    'zip.radius': '{miles} mi',
    'zip.loading': 'Looking up {zip}…',
    'zip.error': 'Couldn’t find ZIP {zip}.',
    'zip.result': { one: '{count} location within {miles} mi of {zip}', other: '{count} locations within {miles} mi of {zip}' },
    'zip.distance': '{miles} mi from {zip}',

    'filter.education': 'Education Level',
    'filter.area': 'Area',
    'filter.category': 'Category',
    'filter.transit': 'Transit',
    'filter.shown': '{active}/{total} shown',
    'filter.selectAll': 'Select all',
    'filter.clearAll': 'Clear all',

    'transit.loading': 'Loading routes…',
    'transit.error': 'Couldn’t load transit data.',
    'transit.zoomHint': 'Zoom in close to see stops.',
    'transit.ddot': 'DDOT bus',
    'transit.smart': 'SMART bus',
    'transit.qline': 'QLine',
    'transit.dpm': 'People Mover',
    'transit.ddot.hint': 'Detroit Department of Transportation',
    'transit.smart.hint': 'Suburban bus service',
    'transit.qline.hint': 'Woodward Avenue streetcar',
    'transit.dpm.hint': 'Downtown elevated loop',

    'training.title': 'Training Providers',
    'training.badge': 'Training provider',
    'training.programmePage': 'Programme page',

    'jobs.open': { one: '{count} open job', other: '{count} open jobs' },
    'jobs.apply': 'Apply',
    'jobs.applyTitle': 'Open this posting',
    // Only shown when the map is NOT in English -- see App.jsx.
    'jobs.languageNote': '',
    'jobs.confidence': '{percent}% from posting text ({ratio})',

    'popup.industry': 'Industry',
    'popup.business': 'Business',
    'popup.address': 'Address',
    'popup.area': 'Area',
    'popup.education': 'Education',
    'popup.type': 'Type',
    'popup.trainsFor': 'Trains for',
    'popup.cost': 'Cost',
    'popup.seeJobs': 'See jobs',
    'popup.seeJobsInList': 'See jobs in list',
    'popup.website': 'Website',

    'empty.title': 'Select a job or training provider',
    'empty.hint': 'Search, or turn on a category, to see jobs and training providers here.',
    'empty.noMatchTitle': 'No matches',
    'empty.noMatchHint': 'Nothing matches that search. Try an employer name or a job title.',
  },

  es: {
    'page.title': 'Mapa Community View | SDEV',
    'language.label': 'Idioma',
    'logo.alt': 'Southwest Detroit Environmental Vision',

    'view.list': 'Lista',
    'view.map': 'Mapa',

    'header.employers': 'Empleadores',
    'header.locations': { one: '{count} ubicación', other: '{count} ubicaciones' },
    'header.inSouthwest': '{count} en el suroeste de Detroit',
    'header.updated': 'Vacantes actualizadas el {date}',

    'feedback.button': 'Comentarios',
    'feedback.title': 'Enviar comentarios',
    'feedback.openTab': 'Abrir en otra pestaña',
    'feedback.close': 'Cerrar',
    'feedback.frameTitle': 'Formulario de comentarios',

    'search.title': 'Buscar',
    'search.placeholder': 'Empleador o puesto',
    'search.clear': 'Borrar búsqueda',
    'search.matches': { one: '{count} resultado en todas las categorías', other: '{count} resultados en todas las categorías' },
    'search.none': 'Sin resultados. Prueba con el nombre de un empleador o con un puesto, como "soldador".',
    'search.matchingJobs': { one: '{count} vacante coincide', other: '{count} vacantes coinciden' },

    'hiring.only': 'Solo los que están contratando',
    'hiring.now': 'Contratando ahora',
    'hiring.none': 'Sin vacantes publicadas',
    'hiring.nowWithCount': { one: 'Contratando ahora · {count} vacante', other: 'Contratando ahora · {count} vacantes' },
    'hiring.noneLong': 'Sin vacantes publicadas por ahora',

    'zip.title': 'Cerca de un código postal',
    'zip.placeholder': 'p. ej. 48210',
    'zip.radius': '{miles} mi',
    'zip.loading': 'Buscando {zip}…',
    'zip.error': 'No se encontró el código postal {zip}.',
    'zip.result': { one: '{count} ubicación a menos de {miles} mi de {zip}', other: '{count} ubicaciones a menos de {miles} mi de {zip}' },
    'zip.distance': 'a {miles} mi de {zip}',

    'filter.education': 'Nivel de estudios',
    'filter.area': 'Zona',
    'filter.category': 'Categoría',
    'filter.transit': 'Transporte público',
    'filter.shown': '{active}/{total} visibles',
    'filter.selectAll': 'Seleccionar todo',
    'filter.clearAll': 'Quitar todo',

    'transit.loading': 'Cargando rutas…',
    'transit.error': 'No se pudieron cargar los datos de transporte.',
    'transit.zoomHint': 'Acerca el mapa para ver las paradas.',
    'transit.ddot': 'Autobús DDOT',
    'transit.smart': 'Autobús SMART',
    'transit.qline': 'QLine',
    'transit.dpm': 'People Mover',
    'transit.ddot.hint': 'Departamento de Transporte de Detroit',
    'transit.smart.hint': 'Servicio de autobús suburbano',
    'transit.qline.hint': 'Tranvía de la avenida Woodward',
    'transit.dpm.hint': 'Circuito elevado del centro',

    'training.title': 'Centros de capacitación',
    'training.badge': 'Centro de capacitación',
    'training.programmePage': 'Página del programa',

    'jobs.open': { one: '{count} vacante', other: '{count} vacantes' },
    'jobs.apply': 'Solicitar',
    'jobs.applyTitle': 'Abrir este anuncio',
    'jobs.languageNote': 'Los puestos y sus descripciones aparecen tal como los publicó el empleador, casi siempre en inglés.',
    'jobs.confidence': '{percent}% según el texto del anuncio ({ratio})',

    'popup.industry': 'Sector',
    'popup.business': 'Giro',
    'popup.address': 'Dirección',
    'popup.area': 'Zona',
    'popup.education': 'Estudios',
    'popup.type': 'Tipo',
    'popup.trainsFor': 'Capacita en',
    'popup.cost': 'Costo',
    'popup.seeJobs': 'Ver vacantes',
    'popup.seeJobsInList': 'Ver vacantes en la lista',
    'popup.website': 'Sitio web',

    'empty.title': 'Elige un empleo o un centro de capacitación',
    'empty.hint': 'Busca, o activa una categoría, para ver aquí empleos y centros de capacitación.',
    'empty.noMatchTitle': 'Sin resultados',
    'empty.noMatchHint': 'Nada coincide con esa búsqueda. Prueba con el nombre de un empleador o con un puesto.',
  },
}

// Longer explanations of a data value (shown as a hover title on the Area and
// Education filters and tags). Keyed by the exact English value in the data.
export const HINTS = {
  en: {
    'Southwest Detroit': 'Mexicantown, Springwells, Corktown, Boynton and Oakwood Heights',
    'Around Southwest Detroit': 'River Rouge, Ecorse, Melvindale, Lincoln Park, Wyandotte, Riverview, Trenton and Dearborn',
    'Detroit': 'Elsewhere in the city of Detroit',
    'Outside the area': 'Outside Detroit and the surrounding communities',
    'No degree required': 'Hiring for at least one role needing no diploma or certificate',
    'Training or certificate': 'Lowest opening needs a certificate, licence or trade credential',
    'College degree': 'All current openings ask for a degree',
    'Unclassified': 'Has open jobs, but none have an education label yet',
  },
  es: {
    'Southwest Detroit': 'Mexicantown, Springwells, Corktown, Boynton y Oakwood Heights',
    'Around Southwest Detroit': 'River Rouge, Ecorse, Melvindale, Lincoln Park, Wyandotte, Riverview, Trenton y Dearborn',
    'Detroit': 'Otras partes de la ciudad de Detroit',
    'Outside the area': 'Fuera de Detroit y de las comunidades cercanas',
    'No degree required': 'Al menos una vacante no pide diploma ni certificado',
    'Training or certificate': 'La vacante más accesible pide un certificado, una licencia o un oficio acreditado',
    'College degree': 'Todas las vacantes actuales piden título universitario',
    'Unclassified': 'Tiene vacantes, pero todavía no se les asignó un nivel de estudios',
  },
}

// Spanish for the values that come out of the data files. English needs no
// table -- the data is already in English, so label() returns it unchanged.
export const DATA_LABELS = {
  es: {
    // --- Areas (the `zone` column) ---
    'Southwest Detroit': 'Suroeste de Detroit',
    'Around Southwest Detroit': 'Alrededores del suroeste de Detroit',
    'Detroit': 'Detroit',
    'Outside the area': 'Fuera de la zona',

    // --- Education levels ---
    'No degree required': 'No requiere título',
    'Training or certificate': 'Capacitación o certificado',
    'College degree': 'Título universitario',
    'Unclassified': 'Sin clasificar',
    'Unclear': 'No está claro',
    'No listings': 'Sin vacantes',

    // --- Employer categories ---
    'Transportation, Logistics & Distribution': 'Transporte, logística y distribución',
    'Construction, Infrastructure & Engineering': 'Construcción, infraestructura e ingeniería',
    'Advanced Manufacturing & Heavy Industry': 'Manufactura avanzada e industria pesada',
    'Education & Workforce Development': 'Educación y desarrollo laboral',
    'Energy, Utilities & Environmental Services': 'Energía, servicios públicos y servicios ambientales',
    'Materials, Mining & Extraction': 'Materiales, minería y extracción',
    'Healthcare & Public Safety': 'Salud y seguridad pública',
    'Workforce, Staffing & Employment Services': 'Agencias de empleo y servicios laborales',
    'Government & Military': 'Gobierno y fuerzas armadas',
    'Commercial, Hospitality & Retail': 'Comercio, hospitalidad y ventas al por menor',
    'Needs Review': 'Por revisar',

    // --- Training-provider categories ---
    'Trade/vocational school': 'Escuela técnica o de oficios',
    'Community organization': 'Organización comunitaria',
    'Community college': 'Colegio comunitario',

    // --- Employer sub-categories ---
    'Automotive & Mobility': 'Industria automotriz y movilidad',
    'Chemicals & Plastics': 'Productos químicos y plásticos',
    'Civil Engineering & Architecture': 'Ingeniería civil y arquitectura',
    'Commercial Distribution': 'Distribución comercial',
    'Construction Materials': 'Materiales de construcción',
    'Energy & Petroleum': 'Energía y petróleo',
    'Environmental & Waste Management': 'Servicios ambientales y manejo de residuos',
    'Facilities Services': 'Servicios de mantenimiento de instalaciones',
    'Food Production': 'Producción de alimentos',
    'Food Service & Hospitality': 'Servicio de alimentos y hospitalidad',
    'Freight & Trucking': 'Carga y transporte en camión',
    'General & Infrastructure Construction': 'Construcción general y de infraestructura',
    'Healthcare Services': 'Servicios de salud',
    'Higher Education & Vocational': 'Educación superior y técnica',
    'Industrial Equipment & Tools': 'Equipo y herramientas industriales',
    'K-12 & Regional Education': 'Educación escolar (K-12) y regional',
    'Metal Fabrication': 'Fabricación de piezas metálicas',
    'Military & Defense': 'Fuerzas armadas y defensa',
    'Mining': 'Minería',
    'Port & Aviation Operations': 'Operaciones portuarias y de aviación',
    'Public Administration': 'Administración pública',
    'Public Safety & Security': 'Seguridad pública y vigilancia',
    'Retail & Real Estate': 'Ventas al por menor y bienes raíces',
    'Specialized Transit': 'Transporte especializado',
    'Specialty Contractors': 'Contratistas especializados',
    'Staffing & Recruiting': 'Agencias de personal y reclutamiento',
    'Steel & Metal Processing': 'Acero y procesamiento de metales',
    'Utilities': 'Servicios públicos',
    'Workforce Development Nonprofits': 'Organizaciones sin fines de lucro de desarrollo laboral',

    // --- Training cost notes (whole sentences from training_providers.geojson) ---
    'Free': 'Gratis',
    'Free (Detroit at Work network location)': 'Gratis (sede de la red Detroit at Work)',
    'Free per Detroit at Work / Operation Next': 'Gratis, según Detroit at Work / Operation Next',
    'Free per Detroit at Work listing': 'Gratis, según el listado de Detroit at Work',
    'Free; targets ages 18-26 and veterans': 'Gratis; dirigido a personas de 18 a 26 años y a veteranos',
    'Community college tuition; check for free/scholarship pathways': 'Colegiatura de colegio comunitario; pregunta por opciones gratuitas o con beca',
    'Noncredit/short-term programs often lower cost than degree track': 'Los programas cortos o sin créditos suelen costar menos que una carrera',
    'Private school -- verify sticker price and financial aid options': 'Escuela privada: confirma el precio y las opciones de ayuda financiera',
    'No prior experience required; verify current tuition': 'No se requiere experiencia previa; confirma la colegiatura actual',
    '$4,000-$6,000 -- private, NOT free; check current state workforce fund eligibility': '$4,000 a $6,000. Escuela privada, NO es gratis; revisa si calificas para los fondos estatales de capacitación',
  },
}

// Two columns are free text built out of a small, repeating vocabulary: an
// employer's `business_type` ("Manufacturing (Automotive Parts)") and a
// training provider's `credential_focus` ("Welding,CDL/Truck Driving,...").
// A whole-value table would need a new line for every new combination, so
// these are translated phrase by phrase instead: each English phrase below is
// swapped for its Spanish wherever it appears, longest phrase first so
// "Truck Driving" is handled before "Truck". Anything not listed -- mostly
// programme and company names -- stays as it is.
export const PHRASES = {
  es: {
    // business_type
    'Trucking/Transportation/Logistics': 'Transporte de carga y logística',
    'Container Drayage': 'acarreo de contenedores',
    'Fuel Hauling': 'transporte de combustible',
    'Steel Hauling': 'transporte de acero',
    'USPS Mail Contractor': 'contratista de correo de USPS',
    'Excavating': 'excavación',
    'Towing': 'grúas',
    'Architecture/Engineering Services': 'Servicios de arquitectura e ingeniería',
    'Aviation Ground Support Services': 'Servicios de apoyo en tierra para aviación',
    'Building Technologies/HVAC': 'Tecnología para edificios y climatización (HVAC)',
    'Construction Materials/Steel Mill Services': 'Materiales de construcción y servicios para acerías',
    'Construction Materials': 'Materiales de construcción',
    'Construction/Industrial Services': 'Construcción y servicios industriales',
    'Water Infrastructure Rehab': 'rehabilitación de infraestructura de agua',
    'Ready-Mix Concrete': 'concreto premezclado',
    'Cement/Aggregates': 'cemento y agregados',
    'Lime/Stone': 'cal y piedra',
    'Cement': 'cemento',
    'Paving': 'pavimentación',
    'Construction': 'Construcción',
    'Regional Service Agency': 'agencia regional de servicios',
    'School Job Network': 'red de empleos escolares',
    'Education/CDL Training': 'Educación / capacitación para licencia CDL',
    'Education/Higher Education': 'Educación superior',
    'Education/Vocational Training': 'Educación / capacitación técnica',
    'Education/K-12': 'Educación escolar (K-12)',
    'Education': 'Educación',
    'Electrical Contractor': 'Contratista eléctrico',
    'Energy/Petroleum Refining': 'Energía / refinación de petróleo',
    'Energy/Petroleum Terminal': 'Energía / terminal de petróleo',
    'Energy/Utilities': 'Energía y servicios públicos',
    'DTE subsidiary': 'subsidiaria de DTE',
    'Engineering/Construction': 'Ingeniería y construcción',
    'Engineering Services': 'Servicios de ingeniería',
    'Civil': 'civil',
    'Environmental Services': 'Servicios ambientales',
    'Marine Spill Response': 'respuesta a derrames marinos',
    'Waste Management': 'manejo de residuos',
    'Facilities/Food Services': 'Mantenimiento de instalaciones y servicio de alimentos',
    'Facilities Services': 'Mantenimiento de instalaciones',
    'Government/County': 'Gobierno del condado',
    'Government/Federal': 'Gobierno federal',
    'Government/Municipal': 'Gobierno municipal',
    'Government/Port Authority': 'Gobierno / autoridad portuaria',
    'Government/Public Safety': 'Gobierno / seguridad pública',
    'Government/State': 'Gobierno estatal',
    'Government/Water Utility': 'Gobierno / servicio de agua',
    'Military Retail': 'tiendas militares',
    'HVAC/Mechanical Contractor': 'Contratista de climatización (HVAC) y mecánica',
    'HVAC/Refrigeration Services': 'Servicios de climatización (HVAC) y refrigeración',
    'Healthcare Services': 'Servicios de salud',
    'Medical Waste': 'residuos médicos',
    'Healthcare': 'Salud',
    'Hospitality/Airline Catering': 'Hospitalidad / comida para aerolíneas',
    'Hospitality/Food Service': 'Hospitalidad / servicio de alimentos',
    'Industrial Equipment Distribution/Service': 'Distribución y servicio de equipo industrial',
    'Industrial Services': 'Servicios industriales',
    'Tank Container Services': 'servicios para contenedores cisterna',
    'Industrial/Logistics Services': 'Servicios industriales y de logística',
    'Logistics/Port Operations': 'Logística y operaciones portuarias',
    'Automotive HVAC': 'climatización automotriz',
    'Automotive Interiors': 'interiores automotrices',
    'Automotive Parts': 'autopartes',
    'Automotive Seating': 'asientos automotrices',
    'Automotive Stampings': 'estampados automotrices',
    'Automotive': 'automotriz',
    'Chemicals/Resins': 'químicos y resinas',
    'Industrial Chemicals': 'químicos industriales',
    'Chemicals': 'químicos',
    'Refractories/Specialty Materials': 'refractarios y materiales especiales',
    'Steel/Scrap Processing': 'acero y procesamiento de chatarra',
    'Steel Tubing': 'tubería de acero',
    'Steel': 'acero',
    'Test Equipment/Engineering': 'equipo de pruebas e ingeniería',
    'Trucks': 'camiones',
    'Food': 'alimentos',
    'Salt': 'sal',
    'Mining': 'Minería',
    'Nonprofit/Community Organization': 'Organización comunitaria sin fines de lucro',
    'Nonprofit/Workforce Development': 'Organización sin fines de lucro de desarrollo laboral',
    'Quality Inspection Services': 'Servicios de inspección de calidad',
    'Convenience Stores': 'tiendas de conveniencia',
    'Retail': 'Ventas al por menor',
    'Security/Armored Transport': 'Seguridad / transporte blindado',
    'Staffing/Recruiting': 'Agencia de personal y reclutamiento',
    'Wholesale Distribution': 'Distribución mayorista',

    // credential_focus
    'General workforce services': 'Servicios generales de empleo',
    'referrals to training': 'referencias a programas de capacitación',
    'Logistics & Transportation Pathway': 'ruta de logística y transporte',
    'CDL/Truck Driving': 'Licencia CDL / manejo de camiones',
    'CDL Class A/B': 'Licencia CDL clase A/B',
    'EV/Mobility/Battery Technician': 'Técnico en vehículos eléctricos, movilidad y baterías',
    'EV/Battery Technician': 'Técnico en vehículos eléctricos y baterías',
    'Energy & Construction Technology': 'Tecnología de energía y construcción',
    'simulated warehouse/fulfillment training': 'capacitación en un almacén simulado',
    'Forklift/Material Handling': 'Montacargas y manejo de materiales',
    'General Manufacturing/Mechatronics': 'Manufactura general y mecatrónica',
    'Career/Skilled Trades Academy incl. EVSE': 'academia de oficios, incluye cargadores para vehículos eléctricos',
    'Heavy Equipment': 'maquinaria pesada',
    'Machinist Training Institute': 'Machinist Training Institute, formación de maquinistas',
    'CNC Machining': 'maquinado CNC',
    'skilled trades': 'oficios especializados',
    'Skilled Trades': 'Oficios especializados',
    'Advanced Manufacturing': 'Manufactura avanzada',
    'Manufacturing': 'Manufactura',
    'Mechatronics': 'Mecatrónica',
    'Robotics': 'Robótica',
    'IT/Computer Technology': 'Informática y tecnología de computación',
    'PC tech support': 'soporte técnico de computadoras',
    'Pre-Apprentice Electrical': 'preaprendizaje de electricidad',
    'Industrial Electrical': 'Electricidad industrial',
    'Industrial Sewing': 'Costura industrial',
    'Lead/Asbestos Abatement': 'eliminación de plomo y asbesto',
    'Medical Assistant/Healthcare': 'Asistente médico y salud',
    'Medical Assistant': 'Asistente médico',
    'Pharmacy Technician': 'Técnico de farmacia',
    'Sterile Processing Technician': 'Técnico en esterilización',
    'Dental Assistant': 'Asistente dental',
    'Dental Assisting': 'asistencia dental',
    'Practical Nurse': 'Enfermería práctica (LPN)',
    'Paramedic': 'Paramédico',
    'EMT': 'Técnico en emergencias médicas (EMT)',
    'Supply Chain/Logistics': 'Cadena de suministro y logística',
    'Masonry': 'albañilería',
    'Welding': 'Soldadura',
    'Solar': 'energía solar',
    'Other': 'Otros',
    // "HVAC" on its own is left alone: the trade uses the English acronym.
  },
}
