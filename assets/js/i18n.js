(function () {
  var LANGS = [
    { code: 'en', label: 'EN', dir: 'ltr' },
    { code: 'ar', label: 'AR', dir: 'rtl' },
    { code: 'de', label: 'DE', dir: 'ltr' },
    { code: 'it', label: 'IT', dir: 'ltr' },
    { code: 'es', label: 'ES', dir: 'ltr' },
    { code: 'fr', label: 'FR', dir: 'ltr' },
    { code: 'zh-Hans', label: '中文', dir: 'ltr' }
  ];

  var LABELS = {
    en: 'English',
    ar: 'العربية',
    de: 'Deutsch',
    it: 'Italiano',
    es: 'Español',
    fr: 'Français',
    'zh-Hans': '简体中文'
  };

  var META = {
    '/': {
      de: {
        title: 'a2b Logistics | Saudi-Arabiens führender Logistikpartner',
        description: 'a2b Logistics bietet Lkw-Transport, Lagerhaltung, Zollabfertigung und Supply-Chain-Lösungen in ganz Saudi-Arabien mit landesweiter Abdeckung und 24/7-Support.'
      },
      it: {
        title: 'a2b Logistics | Partner logistico leader in Arabia Saudita',
        description: 'a2b Logistics offre trasporto su camion, magazzinaggio, sdoganamento e soluzioni supply chain in tutta l Arabia Saudita con copertura nazionale e supporto 24/7.'
      },
      es: {
        title: 'a2b Logistics | Socio logístico líder en Arabia Saudita',
        description: 'a2b Logistics ofrece transporte por camión, almacenamiento, despacho aduanero y soluciones de cadena de suministro en toda Arabia Saudita con cobertura nacional y soporte 24/7.'
      },
      fr: {
        title: 'a2b Logistics | Partenaire logistique de référence en Arabie saoudite',
        description: 'a2b Logistics fournit transport routier, entreposage, dédouanement et solutions de supply chain dans toute l Arabie saoudite avec couverture nationale et assistance 24/7.'
      },
      'zh-Hans': {
        title: 'a2b Logistics | 沙特阿拉伯领先的物流合作伙伴',
        description: 'a2b Logistics 在沙特阿拉伯全境提供卡车运输、仓储、清关和供应链解决方案，并提供全国覆盖和全天候支持。'
      }
    },
    '/fleet': {
      de: {
        title: 'Schwertransport-Flotte, Krane und Trailer | a2b Logistics Saudi-Arabien',
        description: 'a2b Logistics betreibt 948+ Fahrzeuge in Saudi-Arabien: Tieflader, Kühlfahrzeuge, Tankwagen, Kran-Lkw und mehr.'
      },
      it: {
        title: 'Flotta per trasporti pesanti, gru e rimorchi | a2b Logistics Arabia Saudita',
        description: 'a2b Logistics gestisce oltre 948 veicoli in Arabia Saudita: pianali, lowbed, reefers, autocisterne, camion gru e altro.'
      },
      es: {
        title: 'Flota de transporte pesado, grúas y remolques | a2b Logistics Arabia Saudita',
        description: 'a2b Logistics opera más de 948 vehículos en Arabia Saudita: plataformas, lowbeds, reefers, cisternas, camiones grúa y más.'
      },
      fr: {
        title: 'Flotte de transport lourd, grues et remorques | a2b Logistics Arabie saoudite',
        description: 'a2b Logistics exploite plus de 948 véhicules en Arabie saoudite : plateaux, lowbeds, frigorifiques, citernes, camions-grues et plus.'
      },
      'zh-Hans': {
        title: '重型运输车队、吊车和挂车 | a2b Logistics 沙特阿拉伯',
        description: 'a2b Logistics 在沙特阿拉伯运营 948 多辆车辆，包括平板车、低平板、冷藏车、罐车、吊车等。'
      }
    },
    '/careers': {
      de: {
        title: 'Karriere bei a2b Logistics | Arbeiten in Saudi-Arabiens Logistik',
        description: 'Werden Sie Teil von a2b Logistics in Saudi-Arabien. Bewerben Sie sich für Rollen in Logistik, Betrieb, Flottenmanagement und Supply Chain.'
      },
      it: {
        title: 'Carriere in a2b Logistics | Lavora nella logistica saudita',
        description: 'Unisciti ad a2b Logistics in Arabia Saudita. Candidati per ruoli in logistica, operations, gestione flotte e supply chain.'
      },
      es: {
        title: 'Empleos en a2b Logistics | Carrera en logística saudí',
        description: 'Únete a a2b Logistics en Arabia Saudita. Postúlate a puestos de logística, operaciones, gestión de flota y cadena de suministro.'
      },
      fr: {
        title: 'Carrières chez a2b Logistics | Logistique en Arabie saoudite',
        description: 'Rejoignez a2b Logistics en Arabie saoudite. Postulez à des postes en logistique, opérations, gestion de flotte et supply chain.'
      },
      'zh-Hans': {
        title: 'a2b Logistics 招聘 | 加入沙特物流团队',
        description: '加入沙特阿拉伯 a2b Logistics 团队，申请物流、运营、车队管理和供应链岗位。'
      }
    },
    '/vendors': {
      de: {
        title: 'Lieferantenregistrierung | a2b Logistics',
        description: 'Registrieren Sie sich als Lieferant oder Subunternehmer bei a2b Logistics und werden Sie Teil unseres Partnernetzwerks in Saudi-Arabien.'
      },
      it: {
        title: 'Registrazione fornitori | a2b Logistics',
        description: 'Registrati come fornitore o subappaltatore con a2b Logistics ed entra nella nostra rete di partner in Arabia Saudita.'
      },
      es: {
        title: 'Registro de proveedores | a2b Logistics',
        description: 'Regístrate como proveedor o subcontratista de a2b Logistics y únete a nuestra red de socios en Arabia Saudita.'
      },
      fr: {
        title: 'Inscription fournisseur | a2b Logistics',
        description: 'Inscrivez-vous comme fournisseur ou sous-traitant auprès de a2b Logistics et rejoignez notre réseau de partenaires en Arabie saoudite.'
      },
      'zh-Hans': {
        title: '供应商注册 | a2b Logistics',
        description: '注册成为 a2b Logistics 的供应商或分包商，加入我们在沙特阿拉伯的合作伙伴网络。'
      }
    }
  };

  var DICT = {
    de: {
      'About': 'Über uns',
      'Services': 'Dienstleistungen',
      'Coverage': 'Abdeckung',
      'Clients': 'Kunden',
      'Fleet': 'Flotte',
      'Careers': 'Karriere',
      'Vendors': 'Lieferanten',
      'Get in Touch': 'Kontakt aufnehmen',
      'Get in Touch Today': 'Heute Kontakt aufnehmen',
      'Saudi Arabia': 'Saudi-Arabien',
      "Saudi Arabia's Premier Logistics Partner": 'Saudi-Arabiens führender Logistikpartner',
      'Your Logistics': 'Ihr Logistik-Gateway',
      'Gateway to': 'nach ',
      "a2b connects international companies and factories to the Kingdom's most comprehensive ground logistics network reliably, at scale, and on your terms.": 'a2b verbindet internationale Unternehmen und Fabriken zuverlässig, skalierbar und nach Ihren Anforderungen mit dem umfassendsten Straßengüter-Logistiknetz des Königreichs.',
      'Explore Services': 'Dienstleistungen ansehen',
      'Client Retention Rate': 'Kundenbindungsrate',
      'Operations Support': 'Betriebsunterstützung',
      'KSA-Wide': 'KSA-weit',
      'Full Kingdom coverage. All major cities, domestic routes and ports.': 'Vollständige Abdeckung im Königreich. Alle wichtigen Städte, Inlandsrouten und Häfen.',
      'Quality Certified': 'Qualitätszertifiziert',
      'Team Experience': 'Teamerfahrung',
      'About a2b': 'Über a2b',
      "Saudi Arabia's Logistics": 'Saudi-Arabiens Logistik',
      'Infrastructure, at Your Service': 'Infrastruktur zu Ihren Diensten',
      'Kingdom-wide fleet operations': 'Flottenbetrieb im gesamten Königreich',
      'a2b Logistics Company': 'a2b Logistics Company',
      "is a fully independent turnkey logistics company, purpose-built to serve Saudi Arabia's rapidly growing economy and the international businesses entering the Kingdom.": 'ist ein vollständig unabhängiges Turnkey-Logistikunternehmen, das gezielt für die schnell wachsende Wirtschaft Saudi-Arabiens und internationale Unternehmen im Königreich aufgebaut wurde.',
      'top logistics service providers in the Kingdom': 'führenden Logistikdienstleister im Königreich',
      'Certified': 'Zertifiziert',
      'Quality Management System': 'Qualitätsmanagementsystem',
      'Occupational Health and Safety Management System': 'Managementsystem für Arbeitsschutz',
      'Environmental Management System': 'Umweltmanagementsystem',
      'Why a2b': 'Warum a2b',
      '9 Reasons International': '9 Gründe, warum internationale',
      'Businesses Choose a2b': 'Unternehmen a2b wählen',
      'Every capability built around the unique demands of operating in Saudi Arabia.': 'Jede Fähigkeit ist auf die besonderen Anforderungen des Betriebs in Saudi-Arabien ausgelegt.',
      'Scalability': 'Skalierbarkeit',
      'Fast, proven scalability to meet your requirements, from a single trip to a full nationwide rollout.': 'Schnelle, bewährte Skalierbarkeit für Ihre Anforderungen, von einer Einzelfahrt bis zum landesweiten Rollout.',
      '24/7 Availability': '24/7 Verfügbarkeit',
      'Round-the-clock availability to answer calls and mobilize trucks. No downtime in your supply chain.': 'Rund um die Uhr erreichbar, um Anfragen zu beantworten und Lkw zu mobilisieren. Keine Ausfallzeit in Ihrer Lieferkette.',
      'Fast Response': 'Schnelle Reaktion',
      'We act fast, identifying and allocating the right equipment for your project with minimal lead time.': 'Wir handeln schnell und stellen die passende Ausrüstung für Ihr Projekt mit minimaler Vorlaufzeit bereit.',
      'Transparency': 'Transparenz',
      'Full visibility across every request, streamlined tracking and clear communication at all stages.': 'Volle Transparenz über jede Anfrage, schlankes Tracking und klare Kommunikation in allen Phasen.',
      'Planning': 'Planung',
      'We plan ahead for your projects, aligning logistics timelines precisely with your business objectives.': 'Wir planen Ihre Projekte voraus und stimmen Logistikzeitpläne präzise auf Ihre Geschäftsziele ab.',
      'Rushed Projects': 'Eilige Projekte',
      'Successfully delivered under the tightest deadlines, including complex, time-critical mega-projects.': 'Erfolgreiche Lieferung unter engsten Fristen, auch bei komplexen, zeitkritischen Megaprojekten.',
      'Experience': 'Erfahrung',
      'An impeccable track record in sensitive, high-stakes projects, with a team averaging 20+ years of experience.': 'Ein makelloser Leistungsnachweis in sensiblen, anspruchsvollen Projekten mit einem Team von durchschnittlich über 20 Jahren Erfahrung.',
      'Full KSA Coverage': 'Vollständige KSA-Abdeckung',
      'Kingdom-wide operations across all major cities, domestic routes, and sea and air port services.': 'Landesweite Einsätze in allen wichtigen Städten, Inlandsrouten sowie See- und Flughafendiensten.',
      'Automation': 'Automatisierung',
      'Paperless, automated workflows and documentation. Less friction, faster execution, full control.': 'Papierlose, automatisierte Arbeitsabläufe und Dokumentation. Weniger Reibung, schnellere Ausführung, volle Kontrolle.',
      'A Fleet for Every Industry.': 'Eine Flotte für jede Branche.',
      'A Model for Every Business.': 'Ein Modell für jedes Unternehmen.',
      '12 truck types in multiple sizes. Flexible booking models. End-to-end support services.': '12 Lkw-Typen in mehreren Größen. Flexible Buchungsmodelle. Umfassende Supportleistungen.',
      'Our Fleet': 'Unsere Flotte',
      'Closed Trucks': 'Geschlossene Lkw',
      'High Side Trucks': 'Lkw mit hohen Bordwänden',
      'Shorter Side Trucks': 'Lkw mit niedrigen Bordwänden',
      'Refrigerated / Freezer': 'Kühl- / Tiefkühlfahrzeuge',
      'Flatbed Trucks': 'Pritschen-Lkw',
      'Curtained Trucks': 'Planen-Lkw',
      'Dump Trucks': 'Kipper',
      'Boom Trucks': 'Ladekran-Lkw',
      'Cranes': 'Krane',
      'Pickups': 'Pick-ups',
      'Water Tankers': 'Wassertankwagen',
      'Lowbed Trailers': 'Tieflader',
      'All types available in multiple sizes to accommodate your business requirements.': 'Alle Typen sind in mehreren Größen verfügbar, passend zu Ihren Geschäftsanforderungen.',
      'Booking Models': 'Buchungsmodelle',
      'FLEXIBLE': 'FLEXIBEL',
      'Per Trip': 'Pro Fahrt',
      'On-demand bookings. Scale up or down based on project volume and timing.': 'Buchungen nach Bedarf. Skalieren Sie je nach Projektvolumen und Zeitplan.',
      'CONTRACT': 'VERTRAG',
      'Period Contracts': 'Laufzeitverträge',
      'Daily, weekly, monthly, or annual agreements for consistent, predictable operations.': 'Tägliche, wöchentliche, monatliche oder jährliche Vereinbarungen für planbare Abläufe.',
      'VOLUME': 'VOLUMEN',
      'Unit Rate': 'Einheitspreis',
      'Volume-based pricing for high-frequency logistics and bulk movement requirements.': 'Volumenbasierte Preise für häufige Logistik- und Massentransporte.',
      'Additional Services': 'Zusätzliche Leistungen',
      'Cargo Insurance': 'Frachtversicherung',
      'Comprehensive protection for every shipment from origin to delivery.': 'Umfassender Schutz für jede Sendung vom Ursprung bis zur Lieferung.',
      'Our Clients': 'Unsere Kunden',
      "Trusted by Saudi Arabia's": 'Vertraut von Saudi-Arabiens',
      'Leading Organizations': 'führenden Organisationen',
      'Ready to Establish Your': 'Bereit, Ihre',
      'Logistics Presence in Saudi Arabia?': 'Logistikpräsenz in Saudi-Arabien aufzubauen?',
      "Let's build a partnership that supports your entry and growth in the Kingdom.": 'Lassen Sie uns eine Partnerschaft aufbauen, die Ihren Eintritt und Ihr Wachstum im Königreich unterstützt.',
      'Contact': 'Kontakt',
      'Start a Conversation': 'Gespräch beginnen',
      "Reach our team and we'll respond within 24 hours.": 'Kontaktieren Sie unser Team und wir antworten innerhalb von 24 Stunden.',
      'General Inquiries': 'Allgemeine Anfragen',
      'Sales Department': 'Vertrieb',
      'Our Address': 'Unsere Adresse',
      'Olaya District': 'Olaya District',
      'Riyadh, Saudi Arabia': 'Riad, Saudi-Arabien',
      'Privacy Policy': 'Datenschutzrichtlinie',
      'Terms and Conditions': 'Allgemeine Geschäftsbedingungen',
      'Fleet & Capabilities': 'Flotte und Fähigkeiten',
      '948+ Units.': '948+ Einheiten.',
      'Every Load.': 'Jede Ladung. ',
      'Every City.': 'Jede Stadt.',
      "One of Saudi Arabia's largest privately operated logistics fleets — purpose-built, GPS-tracked, and fuel-monitored across the entire Kingdom since 1994.": 'Eine der größten privat betriebenen Logistikflotten Saudi-Arabiens - zweckgebaut, GPS-verfolgt und kraftstoffüberwacht im gesamten Königreich seit 1994.',
      'Vehicles in Fleet': 'Fahrzeuge in der Flotte',
      'Years Operating': 'Jahre im Betrieb',
      'Vehicle Categories': 'Fahrzeugkategorien',
      'Dispatch & Operations': 'Disposition und Betrieb',
      'Built for Every Cargo Type': 'Gebaut für jede Frachtart',
      "From standard freight to oversized project loads — our fleet covers every requirement across Saudi Arabia's road network.": 'Von Standardfracht bis zu übergroßen Projektladungen deckt unsere Flotte jede Anforderung im Straßennetz Saudi-Arabiens ab.',
      'Standard Flatbed Trailer': 'Standard-Pritschenauflieger',
      'The backbone of our fleet. Handles palletized goods, general cargo, steel, timber, and construction materials across all KSA routes.': 'Das Rückgrat unserer Flotte. Transportiert palettierte Waren, Stückgut, Stahl, Holz und Baumaterialien auf allen KSA-Routen.',
      'General Cargo': 'Stückgut',
      'Lowbed / Heavy Haul': 'Tieflader / Schwertransport',
      'For oversized industrial machinery, power generators, transformers, and heavy construction equipment. Permit-ready for KSA roads.': 'Für übergroße Industriemaschinen, Generatoren, Transformatoren und schwere Baumaschinen. Genehmigungsbereit für KSA-Straßen.',
      'Heavy Haul': 'Schwertransport',
      'Curtainsider / Tautliner': 'Curtainsider / Tautliner',
      'Refrigerated (Reefer)': 'Kühlfahrzeug (Reefer)',
      'Cold Chain': 'Kühlkette',
      'Tanker': 'Tankwagen',
      'Liquid Bulk': 'Flüssige Massengüter',
      'Crane Truck (HIAB)': 'Kran-Lkw (HIAB)',
      'Self-Loading': 'Selbstladend',
      'Box Truck / Covered Van': 'Koffer-Lkw / geschlossener Transporter',
      'Secured Cargo': 'Gesicherte Fracht',
      'Pickup / Light Commercial': 'Pickup / leichtes Nutzfahrzeug',
      'Light & Rapid': 'Leicht und schnell',
      'Extendable Trailer': 'Ausziehbarer Trailer',
      'Oversized Loads': 'Übergrößenladungen',
      'Specialized Capabilities': 'Spezialisierte Fähigkeiten',
      'Beyond Standard Trucking': 'Mehr als Standardtransport',
      'Mega Project Logistics': 'Megaprojekt-Logistik',
      'Port & Customs Clearance': 'Hafen- und Zollabfertigung',
      'Cross-Border Corridors': 'Grenzüberschreitende Korridore',
      '24/7 Rapid Mobilization': '24/7 schnelle Mobilisierung',
      'Fleet Standards': 'Flottenstandards',
      'Technology-Backed. Compliance-Ready.': 'Technologiegestützt. Compliance-bereit.',
      'GPS Tracked': 'GPS-verfolgt',
      'Fuel Monitoring': 'Kraftstoffüberwachung',
      'Preventive Maintenance': 'Vorbeugende Wartung',
      'Certified Drivers': 'Zertifizierte Fahrer',
      'Need a Specific Vehicle or Capacity?': 'Benötigen Sie ein bestimmtes Fahrzeug oder eine Kapazität?',
      "Tell us your cargo type, route, and timeline — we'll confirm availability and turn it around fast.": 'Nennen Sie uns Frachtart, Route und Zeitplan - wir bestätigen die Verfügbarkeit schnell.',
      'Join the Team': 'Werden Sie Teil des Teams',
      'Build Your Career': 'Bauen Sie Ihre Karriere auf',
      'in Saudi Logistics': 'in der saudischen Logistik',
      "a2b is growing fast. We're looking for driven professionals who want to be part of something that matters, moving Saudi Arabia forward.": 'a2b wächst schnell. Wir suchen engagierte Fachkräfte, die Teil von etwas Bedeutendem sein wollen und Saudi-Arabien voranbringen.',
      'Apply Now': 'Jetzt bewerben',
      "Send us your details and CV. Our team will review your application and be in touch if there's a fit.": 'Senden Sie uns Ihre Daten und Ihren Lebenslauf. Unser Team prüft Ihre Bewerbung und meldet sich, wenn es passt.',
      'Full Name': 'Vollständiger Name',
      'Email Address': 'E-Mail-Adresse',
      'Phone Number': 'Telefonnummer',
      'Attach Your CV': 'Lebenslauf anhängen',
      'Upload CV': 'Lebenslauf hochladen',
      'Submit Application': 'Bewerbung senden',
      'Work With Us': 'Arbeiten Sie mit uns',
      'Become an a2b': 'Werden Sie ein bei a2b',
      'Registered Vendor': 'registrierter Lieferant',
      'Vendor Registration Form': 'Lieferantenregistrierungsformular',
      'Company Information': 'Unternehmensinformationen',
      'Company Name': 'Firmenname',
      'Commercial Registration (CR) Number': 'Handelsregisternummer (CR)',
      'VAT Registration Number': 'USt-Registrierungsnummer',
      'Years in Operation': 'Jahre im Betrieb',
      'Select range': 'Bereich auswählen',
      'Less than 1 year': 'Weniger als 1 Jahr',
      '1 to 2 years': '1 bis 2 Jahre',
      '2 to 5 years': '2 bis 5 Jahre',
      '5 to 10 years': '5 bis 10 Jahre',
      '10+ years': '10+ Jahre',
      'Vendor Category': 'Lieferantenkategorie',
      'Select primary category': 'Hauptkategorie auswählen',
      'Transportation and Trucking': 'Transport und Lkw-Verkehr',
      'Warehousing and Storage': 'Lagerhaltung',
      'Customs and Clearance': 'Zoll und Abfertigung',
      'Freight and Forwarding': 'Fracht und Spedition',
      'Maintenance and Repair': 'Wartung und Reparatur',
      'Technology and Software': 'Technologie und Software',
      'Fuel and Consumables': 'Kraftstoff und Verbrauchsmaterialien',
      'Other': 'Sonstiges',
      'Contact Person': 'Kontaktperson',
      'Job Title': 'Position',
      'Services and Capabilities': 'Leistungen und Fähigkeiten',
      'Describe Your Services and Capabilities': 'Beschreiben Sie Ihre Leistungen und Fähigkeiten',
      'Submit Vendor Application': 'Lieferantenbewerbung senden'
    }
  };

  var BASE_DE = DICT.de;
  DICT.it = copyWith({}, {
    'About': 'Chi siamo', 'Services': 'Servizi', 'Coverage': 'Copertura', 'Clients': 'Clienti', 'Fleet': 'Flotta', 'Careers': 'Carriere', 'Vendors': 'Fornitori', 'Get in Touch': 'Contattaci',
    'Saudi Arabia': 'Arabia Saudita',
    "Saudi Arabia's Premier Logistics Partner": 'Il partner logistico leader in Arabia Saudita',
    'Your Logistics': 'La tua logistica', 'Gateway to': 'verso ', 'Explore Services': 'Esplora i servizi',
    "a2b connects international companies and factories to the Kingdom's most comprehensive ground logistics network reliably, at scale, and on your terms.": 'a2b collega aziende internazionali e fabbriche alla rete di logistica terrestre più completa del Regno, in modo affidabile, scalabile e secondo le tue esigenze.',
    'About a2b': 'Chi è a2b', 'Why a2b': 'Perché a2b', 'Our Fleet': 'La nostra flotta', 'Our Clients': 'I nostri clienti', 'Contact': 'Contatto',
    'Start a Conversation': 'Inizia una conversazione', 'General Inquiries': 'Richieste generali', 'Sales Department': 'Reparto vendite', 'Our Address': 'Il nostro indirizzo',
    'Privacy Policy': 'Informativa privacy', 'Terms and Conditions': 'Termini e condizioni',
    'Fleet & Capabilities': 'Flotta e capacità', 'Vehicles in Fleet': 'Veicoli in flotta', 'Years Operating': 'Anni di attività', 'Vehicle Categories': 'Categorie di veicoli',
    'Dispatch & Operations': 'Dispatch e operazioni', 'Built for Every Cargo Type': 'Progettata per ogni tipo di carico',
    'Standard Flatbed Trailer': 'Rimorchio pianale standard', 'General Cargo': 'Carico generale', 'Lowbed / Heavy Haul': 'Lowbed / trasporto pesante',
    'Heavy Haul': 'Trasporto pesante', 'Refrigerated (Reefer)': 'Refrigerato (Reefer)', 'Cold Chain': 'Catena del freddo', 'Tanker': 'Autocisterna',
    'Liquid Bulk': 'Rinfusa liquida', 'Crane Truck (HIAB)': 'Camion gru (HIAB)', 'Self-Loading': 'Autocaricante', 'Box Truck / Covered Van': 'Furgone chiuso',
    'Secured Cargo': 'Carico protetto', 'Pickup / Light Commercial': 'Pickup / commerciale leggero', 'Light & Rapid': 'Leggero e rapido', 'Extendable Trailer': 'Rimorchio estensibile',
    'Oversized Loads': 'Carichi fuori sagoma', 'Specialized Capabilities': 'Capacità specializzate', 'Beyond Standard Trucking': 'Oltre il trasporto standard',
    'Mega Project Logistics': 'Logistica per mega-progetti', 'Port & Customs Clearance': 'Porti e sdoganamento', 'Cross-Border Corridors': 'Corridoi transfrontalieri',
    'Fleet Standards': 'Standard della flotta', 'GPS Tracked': 'Tracciato GPS', 'Fuel Monitoring': 'Monitoraggio carburante', 'Preventive Maintenance': 'Manutenzione preventiva',
    'Certified Drivers': 'Autisti certificati', 'Join the Team': 'Unisciti al team', 'Build Your Career': 'Costruisci la tua carriera', 'in Saudi Logistics': 'nella logistica saudita',
    'Apply Now': 'Candidati ora', 'Full Name': 'Nome completo', 'Email Address': 'Indirizzo email', 'Phone Number': 'Numero di telefono', 'Attach Your CV': 'Allega il CV',
    "a2b is growing fast. We're looking for driven professionals who want to be part of something that matters, moving Saudi Arabia forward.": 'a2b sta crescendo rapidamente. Cerchiamo professionisti motivati che vogliano contribuire a qualcosa di importante e far avanzare l Arabia Saudita.',
    "Send us your details and CV. Our team will review your application and be in touch if there's a fit.": 'Inviaci i tuoi dati e il CV. Il nostro team esaminerà la candidatura e ti contatterà se ci sarà una posizione adatta.',
    'Upload CV': 'Carica CV', 'Submit Application': 'Invia candidatura', 'Work With Us': 'Lavora con noi', 'Registered Vendor': 'fornitore registrato',
    'Vendor Registration Form': 'Modulo registrazione fornitori', 'Company Information': 'Informazioni aziendali', 'Company Name': 'Ragione sociale',
    'We work with a select network of high-quality vendors and subcontractors. If your business meets our standards, we want to hear from you.': 'Collaboriamo con una rete selezionata di fornitori e subappaltatori di alta qualità. Se la tua azienda soddisfa i nostri standard, vogliamo conoscerti.',
    'Submit your company details below. Our procurement team will review your submission and reach out if there is a potential fit for our operations.': 'Invia qui sotto i dati della tua azienda. Il nostro team procurement li esaminerà e ti contatterà se ci sarà una possibile opportunità.',
    'Commercial Registration (CR) Number': 'Numero registro commerciale (CR)', 'VAT Registration Number': 'Partita IVA', 'Years in Operation': 'Anni di attività',
    'Select range': 'Seleziona intervallo', 'Vendor Category': 'Categoria fornitore', 'Contact Person': 'Persona di contatto', 'Job Title': 'Qualifica',
    'Services and Capabilities': 'Servizi e capacità', 'Submit Vendor Application': 'Invia richiesta fornitore'
  });

  DICT.es = copyWith({}, {
    'About': 'Quiénes somos', 'Services': 'Servicios', 'Coverage': 'Cobertura', 'Clients': 'Clientes', 'Fleet': 'Flota', 'Careers': 'Empleos', 'Vendors': 'Proveedores', 'Get in Touch': 'Contáctanos',
    'Saudi Arabia': 'Arabia Saudita',
    "Saudi Arabia's Premier Logistics Partner": 'El socio logístico líder de Arabia Saudita',
    'Your Logistics': 'Tu logística', 'Gateway to': 'hacia ', 'Explore Services': 'Explorar servicios',
    "a2b connects international companies and factories to the Kingdom's most comprehensive ground logistics network reliably, at scale, and on your terms.": 'a2b conecta empresas internacionales y fábricas con la red de logística terrestre más completa del Reino, de forma fiable, escalable y según tus necesidades.',
    'About a2b': 'Acerca de a2b', 'Why a2b': 'Por qué a2b', 'Our Fleet': 'Nuestra flota', 'Our Clients': 'Nuestros clientes', 'Contact': 'Contacto',
    'Start a Conversation': 'Iniciar conversación', 'General Inquiries': 'Consultas generales', 'Sales Department': 'Departamento comercial', 'Our Address': 'Nuestra dirección',
    'Privacy Policy': 'Política de privacidad', 'Terms and Conditions': 'Términos y condiciones',
    'Fleet & Capabilities': 'Flota y capacidades', 'Vehicles in Fleet': 'Vehículos en flota', 'Years Operating': 'Años operando', 'Vehicle Categories': 'Categorías de vehículos',
    'Dispatch & Operations': 'Despacho y operaciones', 'Built for Every Cargo Type': 'Preparada para todo tipo de carga',
    'Standard Flatbed Trailer': 'Remolque plataforma estándar', 'General Cargo': 'Carga general', 'Lowbed / Heavy Haul': 'Lowbed / carga pesada',
    'Heavy Haul': 'Carga pesada', 'Refrigerated (Reefer)': 'Refrigerado (reefer)', 'Cold Chain': 'Cadena de frío', 'Tanker': 'Cisterna',
    'Liquid Bulk': 'Granel líquido', 'Crane Truck (HIAB)': 'Camión grúa (HIAB)', 'Self-Loading': 'Autocarga', 'Box Truck / Covered Van': 'Camión cerrado',
    'Secured Cargo': 'Carga segura', 'Pickup / Light Commercial': 'Pickup / comercial ligero', 'Light & Rapid': 'Ligero y rápido', 'Extendable Trailer': 'Remolque extensible',
    'Oversized Loads': 'Cargas sobredimensionadas', 'Specialized Capabilities': 'Capacidades especializadas', 'Beyond Standard Trucking': 'Más allá del transporte estándar',
    'Mega Project Logistics': 'Logística de megaproyectos', 'Port & Customs Clearance': 'Puerto y despacho aduanero', 'Cross-Border Corridors': 'Corredores transfronterizos',
    'Fleet Standards': 'Estándares de flota', 'GPS Tracked': 'Seguimiento GPS', 'Fuel Monitoring': 'Monitoreo de combustible', 'Preventive Maintenance': 'Mantenimiento preventivo',
    'Certified Drivers': 'Conductores certificados', 'Join the Team': 'Únete al equipo', 'Build Your Career': 'Construye tu carrera', 'in Saudi Logistics': 'en la logística saudí',
    'Apply Now': 'Postúlate ahora', 'Full Name': 'Nombre completo', 'Email Address': 'Correo electrónico', 'Phone Number': 'Número de teléfono', 'Attach Your CV': 'Adjunta tu CV',
    "a2b is growing fast. We're looking for driven professionals who want to be part of something that matters, moving Saudi Arabia forward.": 'a2b está creciendo rápidamente. Buscamos profesionales motivados que quieran formar parte de algo importante y ayudar a impulsar Arabia Saudita.',
    "Send us your details and CV. Our team will review your application and be in touch if there's a fit.": 'Envíanos tus datos y tu CV. Nuestro equipo revisará tu solicitud y se pondrá en contacto si hay una oportunidad adecuada.',
    'Upload CV': 'Subir CV', 'Submit Application': 'Enviar solicitud', 'Work With Us': 'Trabaja con nosotros', 'Registered Vendor': 'proveedor registrado',
    'Vendor Registration Form': 'Formulario de registro de proveedor', 'Company Information': 'Información de la empresa', 'Company Name': 'Nombre de la empresa',
    'We work with a select network of high-quality vendors and subcontractors. If your business meets our standards, we want to hear from you.': 'Trabajamos con una red selecta de proveedores y subcontratistas de alta calidad. Si tu empresa cumple nuestros estándares, queremos saber de ti.',
    'Submit your company details below. Our procurement team will review your submission and reach out if there is a potential fit for our operations.': 'Envía los datos de tu empresa a continuación. Nuestro equipo de compras revisará la información y te contactará si existe una posible oportunidad.',
    'Commercial Registration (CR) Number': 'Número de registro comercial (CR)', 'VAT Registration Number': 'Número de IVA', 'Years in Operation': 'Años de operación',
    'Select range': 'Selecciona rango', 'Vendor Category': 'Categoría de proveedor', 'Contact Person': 'Persona de contacto', 'Job Title': 'Cargo',
    'Services and Capabilities': 'Servicios y capacidades', 'Submit Vendor Application': 'Enviar solicitud de proveedor'
  });

  DICT.fr = copyWith({}, {
    'About': 'À propos', 'Services': 'Services', 'Coverage': 'Couverture', 'Clients': 'Clients', 'Fleet': 'Flotte', 'Careers': 'Carrières', 'Vendors': 'Fournisseurs', 'Get in Touch': 'Contactez-nous',
    'Saudi Arabia': 'Arabie saoudite',
    "Saudi Arabia's Premier Logistics Partner": 'Le partenaire logistique de référence en Arabie saoudite',
    'Your Logistics': 'Votre logistique', 'Gateway to': 'vers ', 'Explore Services': 'Découvrir les services',
    "a2b connects international companies and factories to the Kingdom's most comprehensive ground logistics network reliably, at scale, and on your terms.": 'a2b relie les entreprises internationales et les usines au réseau de logistique terrestre le plus complet du Royaume, avec fiabilité, à grande échelle et selon vos besoins.',
    'About a2b': 'À propos de a2b', 'Why a2b': 'Pourquoi a2b', 'Our Fleet': 'Notre flotte', 'Our Clients': 'Nos clients', 'Contact': 'Contact',
    'Start a Conversation': 'Démarrer une conversation', 'General Inquiries': 'Demandes générales', 'Sales Department': 'Service commercial', 'Our Address': 'Notre adresse',
    'Privacy Policy': 'Politique de confidentialité', 'Terms and Conditions': 'Conditions générales',
    'Fleet & Capabilities': 'Flotte et capacités', 'Vehicles in Fleet': 'Véhicules dans la flotte', 'Years Operating': 'Années d activité', 'Vehicle Categories': 'Catégories de véhicules',
    'Dispatch & Operations': 'Dispatch et opérations', 'Built for Every Cargo Type': 'Conçue pour chaque type de cargaison',
    'Standard Flatbed Trailer': 'Remorque plateau standard', 'General Cargo': 'Fret général', 'Lowbed / Heavy Haul': 'Lowbed / transport lourd',
    'Heavy Haul': 'Transport lourd', 'Refrigerated (Reefer)': 'Frigorifique (Reefer)', 'Cold Chain': 'Chaîne du froid', 'Tanker': 'Citerne',
    'Liquid Bulk': 'Vrac liquide', 'Crane Truck (HIAB)': 'Camion-grue (HIAB)', 'Self-Loading': 'Autochargement', 'Box Truck / Covered Van': 'Camion fermé',
    'Secured Cargo': 'Fret sécurisé', 'Pickup / Light Commercial': 'Pickup / utilitaire léger', 'Light & Rapid': 'Léger et rapide', 'Extendable Trailer': 'Remorque extensible',
    'Oversized Loads': 'Charges hors gabarit', 'Specialized Capabilities': 'Capacités spécialisées', 'Beyond Standard Trucking': 'Au-delà du transport standard',
    'Mega Project Logistics': 'Logistique de méga-projets', 'Port & Customs Clearance': 'Port et dédouanement', 'Cross-Border Corridors': 'Corridors transfrontaliers',
    'Fleet Standards': 'Standards de flotte', 'GPS Tracked': 'Suivi GPS', 'Fuel Monitoring': 'Suivi carburant', 'Preventive Maintenance': 'Maintenance préventive',
    'Certified Drivers': 'Chauffeurs certifiés', 'Join the Team': 'Rejoindre l équipe', 'Build Your Career': 'Construisez votre carrière', 'in Saudi Logistics': 'dans la logistique saoudienne',
    'Apply Now': 'Postuler maintenant', 'Full Name': 'Nom complet', 'Email Address': 'Adresse e-mail', 'Phone Number': 'Numéro de téléphone', 'Attach Your CV': 'Joindre votre CV',
    "a2b is growing fast. We're looking for driven professionals who want to be part of something that matters, moving Saudi Arabia forward.": 'a2b connaît une forte croissance. Nous recherchons des professionnels motivés qui souhaitent contribuer à quelque chose d important et faire avancer l Arabie saoudite.',
    "Send us your details and CV. Our team will review your application and be in touch if there's a fit.": 'Envoyez-nous vos coordonnées et votre CV. Notre équipe examinera votre candidature et vous contactera si un poste correspond.',
    'Upload CV': 'Téléverser le CV', 'Submit Application': 'Envoyer la candidature', 'Work With Us': 'Travaillez avec nous', 'Registered Vendor': 'fournisseur enregistré',
    'Vendor Registration Form': 'Formulaire fournisseur', 'Company Information': 'Informations entreprise', 'Company Name': 'Nom de l entreprise',
    'We work with a select network of high-quality vendors and subcontractors. If your business meets our standards, we want to hear from you.': 'Nous travaillons avec un réseau sélectionné de fournisseurs et sous-traitants de haute qualité. Si votre entreprise répond à nos standards, nous souhaitons vous connaître.',
    'Submit your company details below. Our procurement team will review your submission and reach out if there is a potential fit for our operations.': 'Soumettez les informations de votre entreprise ci-dessous. Notre équipe achats les examinera et vous contactera s il existe une opportunité potentielle.',
    'Commercial Registration (CR) Number': 'Numéro de registre commercial (CR)', 'VAT Registration Number': 'Numéro de TVA', 'Years in Operation': 'Années d activité',
    'Select range': 'Sélectionner une plage', 'Vendor Category': 'Catégorie fournisseur', 'Contact Person': 'Personne de contact', 'Job Title': 'Fonction',
    'Services and Capabilities': 'Services et capacités', 'Submit Vendor Application': 'Envoyer la demande fournisseur'
  });

  DICT['zh-Hans'] = copyWith({}, {
    'About': '关于我们', 'Services': '服务', 'Coverage': '覆盖范围', 'Clients': '客户', 'Fleet': '车队', 'Careers': '招聘', 'Vendors': '供应商', 'Get in Touch': '联系我们',
    "Saudi Arabia's Premier Logistics Partner": '沙特阿拉伯领先的物流合作伙伴',
    'Your Logistics': '您的物流', 'Gateway to': '通往', 'Saudi Arabia': '沙特阿拉伯', 'Explore Services': '查看服务',
    "a2b connects international companies and factories to the Kingdom's most comprehensive ground logistics network reliably, at scale, and on your terms.": 'a2b 将国际公司和工厂可靠、规模化并按您的需求连接到沙特最完整的地面物流网络。',
    'About a2b': '关于 a2b', 'Why a2b': '为什么选择 a2b', 'Our Fleet': '我们的车队', 'Our Clients': '我们的客户', 'Contact': '联系',
    'Start a Conversation': '开始沟通', 'General Inquiries': '一般咨询', 'Sales Department': '销售部门', 'Our Address': '我们的地址',
    'Privacy Policy': '隐私政策', 'Terms and Conditions': '条款和条件',
    'Fleet & Capabilities': '车队与能力', 'Vehicles in Fleet': '车队车辆', 'Years Operating': '运营年限', 'Vehicle Categories': '车辆类别',
    'Dispatch & Operations': '调度与运营', 'Built for Every Cargo Type': '适用于各种货物类型',
    'Standard Flatbed Trailer': '标准平板挂车', 'General Cargo': '普通货物', 'Lowbed / Heavy Haul': '低平板 / 重载运输',
    'Heavy Haul': '重载运输', 'Refrigerated (Reefer)': '冷藏车', 'Cold Chain': '冷链', 'Tanker': '罐车',
    'Liquid Bulk': '液体散货', 'Crane Truck (HIAB)': '随车吊 (HIAB)', 'Self-Loading': '自装卸', 'Box Truck / Covered Van': '厢式货车',
    'Secured Cargo': '安全货运', 'Pickup / Light Commercial': '皮卡 / 轻型商用车', 'Light & Rapid': '轻便快速', 'Extendable Trailer': '可伸缩挂车',
    'Oversized Loads': '超限货物', 'Specialized Capabilities': '专项能力', 'Beyond Standard Trucking': '超越标准运输',
    'Mega Project Logistics': '大型项目物流', 'Port & Customs Clearance': '港口与清关', 'Cross-Border Corridors': '跨境通道',
    'Fleet Standards': '车队标准', 'GPS Tracked': 'GPS 跟踪', 'Fuel Monitoring': '燃油监控', 'Preventive Maintenance': '预防性维护',
    'Certified Drivers': '认证司机', 'Join the Team': '加入团队', 'Build Your Career': '发展您的职业', 'in Saudi Logistics': '在沙特物流行业',
    'Apply Now': '立即申请', 'Full Name': '全名', 'Email Address': '电子邮箱', 'Phone Number': '电话号码', 'Attach Your CV': '上传简历',
    "a2b is growing fast. We're looking for driven professionals who want to be part of something that matters, moving Saudi Arabia forward.": 'a2b 正在快速发展。我们正在寻找有动力的专业人才，共同参与有意义的事业，推动沙特阿拉伯向前发展。',
    "Send us your details and CV. Our team will review your application and be in touch if there's a fit.": '请发送您的信息和简历。我们的团队会审核申请，如有合适机会将与您联系。',
    'Upload CV': '上传简历', 'Submit Application': '提交申请', 'Work With Us': '与我们合作', 'Become an a2b': '成为 a2b', 'Registered Vendor': '注册供应商',
    'Vendor Registration Form': '供应商注册表', 'Company Information': '公司信息', 'Company Name': '公司名称',
    'We work with a select network of high-quality vendors and subcontractors. If your business meets our standards, we want to hear from you.': '我们与精选的高质量供应商和分包商网络合作。如果您的企业符合我们的标准，我们希望听到您的消息。',
    'Submit your company details below. Our procurement team will review your submission and reach out if there is a potential fit for our operations.': '请在下方提交公司信息。我们的采购团队将审核您的提交内容，如与我们的运营需求匹配，将与您联系。',
    'Commercial Registration (CR) Number': '商业注册号 (CR)', 'VAT Registration Number': '增值税注册号', 'Years in Operation': '运营年限',
    'Select range': '选择范围', 'Vendor Category': '供应商类别', 'Contact Person': '联系人', 'Job Title': '职位',
    'Services and Capabilities': '服务与能力', 'Submit Vendor Application': '提交供应商申请'
  });

  DICT.ar = {
    'About': 'من نحن',
    'Services': 'الخدمات',
    'Coverage': 'التغطية',
    'Clients': 'عملاؤنا',
    'Fleet': 'الأسطول',
    'Careers': 'الوظائف',
    'Vendors': 'الموردون',
    'Get in Touch': 'تواصل معنا',
    'Privacy Policy': 'سياسة الخصوصية',
    'Terms and Conditions': 'الشروط والأحكام'
  };

  function copyWith(base, overrides) {
    var out = {};
    Object.keys(base).forEach(function (key) { out[key] = base[key]; });
    Object.keys(overrides).forEach(function (key) { out[key] = overrides[key]; });
    return out;
  }

  function normalize(text) {
    return text.replace(/\s+/g, ' ').replace(/\u00a0/g, ' ').trim();
  }

  function pathKey() {
    var path = window.location.pathname.replace(/\/$/, '') || '/';
    var prefixMatch = path.match(/^\/(ar|de|it|es|fr|zh-Hans)(\/.*)?$/);
    if (prefixMatch) path = prefixMatch[2] || '/';
    return path.replace(/\.html$/, '');
  }

  function localizedPath(code, key) {
    var path = key === '/' ? '/' : key;
    if (code === 'en') return path;
    return '/' + code + (path === '/' ? '' : path);
  }

  function languageFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var lang = params.get('lang');
    return LANGS.some(function (item) { return item.code === lang; }) ? lang : null;
  }

  function getCurrentLanguage() {
    return languageFromUrl() || document.documentElement.getAttribute('data-default-lang') || localStorage.getItem('a2b_lang') || 'en';
  }

  function languageUrl(code, hash) {
    var params = new URLSearchParams(window.location.search);
    params.delete('lang');
    var query = params.toString();
    return localizedPath(code, pathKey()) + (query ? '?' + query : '') + (hash || '');
  }

  function ensureSelector() {
    var existing = document.getElementById('langBtn');
    var select = document.getElementById('languageSelect');
    if (!select) {
      select = document.createElement('select');
      select.id = 'languageSelect';
      select.className = existing ? existing.className : 'lang-toggle';
      select.setAttribute('aria-label', 'Language');
      LANGS.forEach(function (lang) {
        var option = document.createElement('option');
        option.value = lang.code;
        option.textContent = lang.label;
        option.setAttribute('aria-label', LABELS[lang.code]);
        select.appendChild(option);
      });
      if (existing) {
        existing.replaceWith(select);
      } else {
        var navPhone = document.querySelector('.nav-links .nav-phone');
        var navLinks = document.querySelector('.nav-links');
        if (navPhone && navPhone.parentNode) navPhone.insertAdjacentElement('afterend', select);
        else if (navLinks) navLinks.appendChild(select);
      }
    }

    if (!document.getElementById('mobileLanguageSelect')) {
      var mobileMenu = document.getElementById('mobileMenu');
      if (mobileMenu) {
        var mobileSelect = select.cloneNode(true);
        mobileSelect.id = 'mobileLanguageSelect';
        mobileSelect.className = 'mobile-language-select';
        mobileMenu.appendChild(mobileSelect);
      }
    }
  }

  function updateAlternateLinks(lang) {
    var canonicalPath = pathKey();
    if (!['/', '/fleet', '/careers', '/vendors'].includes(canonicalPath)) return;
    var head = document.head;
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.href = 'https://www.a2b.sa' + localizedPath(lang, canonicalPath);
    }
    document.querySelectorAll('link[rel="alternate"][hreflang]').forEach(function (link) {
      link.remove();
    });
    LANGS.forEach(function (item) {
      var link = document.createElement('link');
      link.rel = 'alternate';
      link.hreflang = item.code;
      link.href = 'https://www.a2b.sa' + localizedPath(item.code, canonicalPath);
      head.appendChild(link);
    });
    var x = document.createElement('link');
    x.rel = 'alternate';
    x.hreflang = 'x-default';
    x.href = 'https://www.a2b.sa' + (canonicalPath === '/' ? '/' : canonicalPath);
    head.appendChild(x);
    var metaLanguage = document.querySelector('meta[name="language"]');
    if (metaLanguage) metaLanguage.content = LABELS[lang] || 'English';
  }

  function updateMeta(lang) {
    var meta = META[pathKey()] && META[pathKey()][lang];
    if (!meta) return;
    document.title = meta.title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.content = meta.description;
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.content = meta.title;
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.content = meta.description;
    var twitterTitle = document.querySelector('meta[name="twitter:title"]');
    if (twitterTitle) twitterTitle.content = meta.title;
  }

  function translateTextNodes(lang) {
    var dict = DICT[lang] || {};
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
      acceptNode: function (node) {
        var parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        if (['SCRIPT', 'STYLE', 'SVG', 'TEXTAREA'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
        if (parent.closest('[data-no-i18n]')) return NodeFilter.FILTER_REJECT;
        if (!normalize(node.nodeValue)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    var nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(function (node) {
      if (node.__a2bOriginalText === undefined) node.__a2bOriginalText = node.nodeValue;
      var original = normalize(node.__a2bOriginalText);
      node.nodeValue = lang === 'en' ? node.__a2bOriginalText : (dict[original] || node.__a2bOriginalText);
    });
  }

  function translateAttributes(lang) {
    var dict = DICT[lang] || {};
    document.querySelectorAll('[placeholder]').forEach(function (el) {
      if (el.__a2bOriginalPlaceholder === undefined) el.__a2bOriginalPlaceholder = el.getAttribute('placeholder');
      var original = normalize(el.__a2bOriginalPlaceholder || '');
      el.setAttribute('placeholder', lang === 'en' ? el.__a2bOriginalPlaceholder : (dict[original] || el.__a2bOriginalPlaceholder));
    });
  }

  function updateInternalLinks(lang) {
    document.querySelectorAll('a[href]').forEach(function (a) {
      if (a.closest('[data-no-i18n]')) return;
      var raw = a.getAttribute('href');
      if (!raw || raw.startsWith('tel:') || raw.startsWith('mailto:') || raw.startsWith('http') || raw.startsWith('#') && pathKey() !== '/') return;
      if (raw.startsWith('#')) {
        a.setAttribute('href', languageUrl(lang, raw));
        return;
      }
      if (raw.startsWith('/')) {
        var url = new URL(raw, window.location.origin);
        url.searchParams.delete('lang');
        var targetPath = url.pathname.replace(/\/$/, '') || '/';
        var prefixMatch = targetPath.match(/^\/(ar|de|it|es|fr|zh-Hans)(\/.*)?$/);
        if (prefixMatch) targetPath = prefixMatch[2] || '/';
        targetPath = targetPath.replace(/\.html$/, '');
        a.setAttribute('href', localizedPath(lang, targetPath) + url.search + url.hash);
      }
    });
  }

  function applyLanguage(lang, updateUrl) {
    if (!LANGS.some(function (item) { return item.code === lang; })) lang = 'en';
    var dir = (LANGS.find(function (item) { return item.code === lang; }) || LANGS[0]).dir;
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    document.body.classList.toggle('ar', lang === 'ar');
    document.body.classList.toggle('is-localized', lang !== 'en');
    localStorage.setItem('a2b_lang', lang);
    document.querySelectorAll('#languageSelect, #mobileLanguageSelect').forEach(function (select) {
      select.value = lang;
    });
    translateTextNodes(lang);
    translateAttributes(lang);
    updateMeta(lang);
    updateAlternateLinks(lang);
    updateInternalLinks(lang);
    if (updateUrl) window.history.replaceState({}, '', languageUrl(lang, window.location.hash));
  }

  function init() {
    ensureSelector();
    var lang = getCurrentLanguage();
    applyLanguage(lang, Boolean(languageFromUrl()));
    document.querySelectorAll('#languageSelect, #mobileLanguageSelect').forEach(function (select) {
      select.addEventListener('change', function () {
        if (document.documentElement.getAttribute('data-static-i18n') === 'true') {
          window.location.href = languageUrl(select.value, window.location.hash);
          return;
        }
        applyLanguage(select.value, true);
      });
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
